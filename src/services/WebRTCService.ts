import SocketService from './SocketService';

interface PeerConnection {
	connection: RTCPeerConnection;
	stream: MediaStream;
}

class WebRTCService {
	private static instance: WebRTCService;
	private peerConnections: Map<string, PeerConnection> = new Map();
	private localStream: MediaStream | null = null;
	private isSocketListenerSetup = false;
	private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
	private configuration: RTCConfiguration = {
		iceServers: [
			{
				urls: [
					'stun:stun.l.google.com:19302',
				]
			}
		],
		iceTransportPolicy: 'all',
		bundlePolicy: 'max-bundle',
		rtcpMuxPolicy: 'require',
		iceCandidatePoolSize: 0
	};

	private constructor() { }

	public static getInstance(): WebRTCService {
		if (!WebRTCService.instance) {
			WebRTCService.instance = new WebRTCService();
		}
		return WebRTCService.instance;
	}

	public getLocalStream(): MediaStream | null {
		return this.localStream;
	}

	private setupSocketListeners(): void {
		if (this.isSocketListenerSetup) {
			console.log('Socket dinleyicileri zaten kurulu');
			return;
		}

		const socket = SocketService.getSocket();
		if (!socket) {
			console.error('Socket bağlantısı bulunamadı');
			return;
		}

		console.log('Socket dinleyicileri kuruluyor...');
		this.isSocketListenerSetup = true;

		socket.on('voice_user_joined', async ({ userId }: { userId: string }) => {
			console.log('Yeni kullanıcı sesli sohbete katıldı:', userId);

			try {
				const peerConnection = await this.createPeerConnection(userId);
				const offer = await peerConnection.connection.createOffer({
					offerToReceiveAudio: true,
					offerToReceiveVideo: false
				});

				await peerConnection.connection.setLocalDescription(offer);
				socket.emit('voice_offer', { userId, offer });
				console.log('Teklif gönderildi:', userId);
			} catch (error) {
				console.error('Teklif oluşturma hatası:', error);
			}
		});

		socket.on('voice_offer', async ({ userId, offer }: { userId: string; offer: RTCSessionDescriptionInit }) => {
			console.log('Teklif alındı:', userId);
			try {
				const peerConnection = await this.createPeerConnection(userId);
				await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(offer));

				const answer = await peerConnection.connection.createAnswer();
				await peerConnection.connection.setLocalDescription(answer);

				socket.emit('voice_answer', { userId, answer });
				console.log('Cevap gönderildi:', userId);

				// Bekleyen ICE adaylarını ekle
				const candidates = this.pendingCandidates.get(userId);
				if (candidates) {
					console.log('Bekleyen ICE adayları ekleniyor:', candidates.length);
					for (const candidate of candidates) {
						await peerConnection.connection.addIceCandidate(new RTCIceCandidate(candidate));
					}
					this.pendingCandidates.delete(userId);
				}
			} catch (error) {
				console.error('Cevap oluşturma hatası:', error);
			}
		});

		socket.on('voice_answer', async ({ userId, answer }: { userId: string; answer: RTCSessionDescriptionInit }) => {
			console.log('Cevap alındı:', userId);
			try {
				const peerConnection = this.peerConnections.get(userId);
				if (peerConnection && peerConnection.connection.signalingState !== 'closed') {
					await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(answer));
					console.log('Bağlantı kuruldu:', userId);
				}
			} catch (error) {
				console.error('Cevap ayarlama hatası:', error);
			}
		});

		socket.on('voice_ice_candidate', async ({ userId, candidate }: { userId: string; candidate: RTCIceCandidateInit }) => {
			try {
				const peerConnection = this.peerConnections.get(userId);
				if (peerConnection && peerConnection.connection.remoteDescription) {
					await peerConnection.connection.addIceCandidate(new RTCIceCandidate(candidate));
					console.log('ICE adayı eklendi:', userId);
				} else {
					// RemoteDescription henüz ayarlanmamışsa, adayı sakla
					if (!this.pendingCandidates.has(userId)) {
						this.pendingCandidates.set(userId, []);
					}
					this.pendingCandidates.get(userId)?.push(candidate);
					console.log('ICE adayı beklemeye alındı');
				}
			} catch (error) {
				console.error('ICE adayı ekleme hatası:', error);
			}
		});

		socket.on('voice_user_left', ({ userId }: { userId: string }) => {
			console.log('Kullanıcı sesli sohbetten ayrıldı:', userId);
			this.removePeerConnection(userId);
			this.pendingCandidates.delete(userId);
		});
	}

	private async createPeerConnection(userId: string): Promise<PeerConnection> {
		const existingConnection = this.peerConnections.get(userId);
		if (existingConnection && existingConnection.connection.connectionState !== 'closed') {
			return existingConnection;
		}

		if (existingConnection) {
			this.removePeerConnection(userId);
		}

		console.log('Yeni peer bağlantısı oluşturuluyor:', userId);
		const connection = new RTCPeerConnection(this.configuration);
		const stream = await this.getLocalStream();

		if (!stream) {
			throw new Error('Yerel ses akışı alınamadı');
		}

		stream.getTracks().forEach(track => {
			connection.addTrack(track, stream);
			console.log('Ses kanalı eklendi:', track.id);
		});

		connection.onicecandidate = (event) => {
			if (event.candidate) {
				console.log('Yeni ICE adayı bulundu:', event.candidate.type, event.candidate.protocol);
				SocketService.emit('voice_ice_candidate', {
					userId,
					candidate: event.candidate
				});
			} else {
				console.log('ICE aday toplama tamamlandı');
			}
		};

		connection.oniceconnectionstatechange = () => {
			console.log('ICE Bağlantı durumu:', connection.iceConnectionState, 'için', userId);
			if (connection.iceConnectionState === 'failed') {
				console.log('ICE bağlantısı başarısız oldu, yeniden deneniyor...', userId);
				connection.restartIce();
			} else if (connection.iceConnectionState === 'connected') {
				console.log('ICE bağlantısı başarılı:', userId);
			}
		};

		connection.ontrack = (event) => {
			console.log('Uzak ses akışı alındı:', userId);
			const [remoteStream] = event.streams;
			this.handleRemoteStream(userId, remoteStream);
		};

		connection.onconnectionstatechange = () => {
			console.log('Bağlantı durumu:', connection.connectionState, 'için', userId);
			if (connection.connectionState === 'connected') {
				console.log('Peer bağlantısı başarılı:', userId);
			} else if (connection.connectionState === 'failed') {
				console.log('Bağlantı başarısız oldu, yeniden bağlanılıyor:', userId);
				this.removePeerConnection(userId);
				this.createPeerConnection(userId);
			}
		};

		connection.onsignalingstatechange = () => {
			console.log('Sinyal durumu:', connection.signalingState, 'için', userId);
		};

		const peerConnection: PeerConnection = { connection, stream };
		this.peerConnections.set(userId, peerConnection);

		return peerConnection;
	}

	private handleRemoteStream(userId: string, stream: MediaStream): void {
		console.log('Uzak ses akışı işleniyor:', userId);

		// Varolan ses elementini kaldır
		const existingAudio = document.getElementById(`remote-audio-${userId}`);
		if (existingAudio) {
			existingAudio.remove();
		}

		// Yeni ses elementi oluştur
		const audioElement = document.createElement('audio');
		audioElement.id = `remote-audio-${userId}`;
		audioElement.srcObject = stream;
		audioElement.autoplay = true;
		document.body.appendChild(audioElement);

		// Ses seviyesini kontrol et
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		source.connect(analyser);

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		const checkAudioLevel = () => {
			analyser.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
			if (average > 0) {
				console.log('Uzak ses seviyesi:', userId, average);
			}
		};
		setInterval(checkAudioLevel, 100);
	}

	private async initLocalStream(): Promise<MediaStream> {
		try {
			this.localStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					channelCount: 1
				},
				video: false
			});

			console.log('Mikrofon başarıyla başlatıldı');
			return this.localStream;
		} catch (error) {
			console.error('Mikrofon erişim hatası:', error);
			throw error;
		}
	}

	public async joinVoiceChat(): Promise<void> {
		try {
			await this.initLocalStream();
			this.setupSocketListeners();
			SocketService.emit('voice_join', {});
			console.log('Sesli sohbete katılma başarılı');
		} catch (error) {
			console.error('Sesli sohbete katılma hatası:', error);
			throw error;
		}
	}

	public leaveVoiceChat(): void {
		if (this.localStream) {
			this.localStream.getTracks().forEach(track => {
				track.stop();
				console.log('Ses kanalı kapatıldı:', track.id);
			});
			this.localStream = null;
		}

		this.peerConnections.forEach((_, userId) => {
			this.removePeerConnection(userId);
			const audioElement = document.getElementById(`remote-audio-${userId}`);
			if (audioElement) {
				audioElement.remove();
				console.log('Uzak ses elementi kaldırıldı:', userId);
			}
		});

		SocketService.emit('voice_leave', {});
		console.log('Sesli sohbetten çıkış yapıldı');
	}

	private removePeerConnection(userId: string): void {
		const peerConnection = this.peerConnections.get(userId);
		if (peerConnection) {
			peerConnection.connection.close();
			this.peerConnections.delete(userId);
			console.log('Peer bağlantısı kapatıldı:', userId);
		}
	}
}

export default WebRTCService.getInstance(); 