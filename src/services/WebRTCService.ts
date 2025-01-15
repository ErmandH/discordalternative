import SocketService from './SocketService';

interface PeerConnection {
	connection: RTCPeerConnection;
	stream: MediaStream;
}

class WebRTCService {
	private static instance: WebRTCService;
	private peerConnections: Map<string, PeerConnection> = new Map();
	private localStream: MediaStream | null = null;
	private configuration: RTCConfiguration = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' },
		],
	};

	private constructor() {
		this.setupSocketListeners();
	}

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
		const socket = SocketService.getSocket();
		if (!socket) return;

		socket.on('voice_user_joined', async ({ userId }: { userId: string }) => {
			console.log('Yeni kullanıcı sesli sohbete katıldı:', userId);
			await this.createPeerConnection(userId);

			// Yeni kullanıcıya teklif gönder
			const peerConnection = this.peerConnections.get(userId);
			if (peerConnection) {
				try {
					const offer = await peerConnection.connection.createOffer();
					await peerConnection.connection.setLocalDescription(offer);
					socket.emit('voice_offer', { userId, offer });
					console.log('Teklif gönderildi:', userId);
				} catch (error) {
					console.error('Teklif oluşturma hatası:', error);
				}
			}
		});

		socket.on('voice_user_left', ({ userId }: { userId: string }) => {
			console.log('Kullanıcı sesli sohbetten ayrıldı:', userId);
			this.removePeerConnection(userId);
		});

		socket.on('voice_offer', async ({ userId, offer }: { userId: string; offer: RTCSessionDescriptionInit }) => {
			console.log('Teklif alındı:', userId);
			const peerConnection = await this.createPeerConnection(userId);
			try {
				await peerConnection.connection.setRemoteDescription(offer);
				const answer = await peerConnection.connection.createAnswer();
				await peerConnection.connection.setLocalDescription(answer);
				socket.emit('voice_answer', { userId, answer });
				console.log('Cevap gönderildi:', userId);
			} catch (error) {
				console.error('Cevap oluşturma hatası:', error);
			}
		});

		socket.on('voice_answer', async ({ userId, answer }: { userId: string; answer: RTCSessionDescriptionInit }) => {
			console.log('Cevap alındı:', userId);
			const peerConnection = this.peerConnections.get(userId);
			if (peerConnection) {
				try {
					await peerConnection.connection.setRemoteDescription(answer);
					console.log('Bağlantı kuruldu:', userId);
				} catch (error) {
					console.error('Cevap ayarlama hatası:', error);
				}
			}
		});

		socket.on('voice_ice_candidate', async ({ userId, candidate }: { userId: string; candidate: RTCIceCandidateInit }) => {
			console.log('ICE adayı alındı:', userId);
			const peerConnection = this.peerConnections.get(userId);
			if (peerConnection) {
				try {
					await peerConnection.connection.addIceCandidate(candidate);
					console.log('ICE adayı eklendi:', userId);
				} catch (error) {
					console.error('ICE adayı ekleme hatası:', error);
				}
			}
		});
	}

	private async createPeerConnection(userId: string): Promise<PeerConnection> {
		if (this.peerConnections.has(userId)) {
			return this.peerConnections.get(userId)!;
		}

		const connection = new RTCPeerConnection(this.configuration);
		const stream = await this.getLocalStream();

		if (!stream) {
			throw new Error('Yerel ses akışı alınamadı');
		}

		// Ses seviyesini kontrol et
		const audioContext = new AudioContext();
		const mediaStreamSource = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		mediaStreamSource.connect(analyser);

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		const checkAudioLevel = () => {
			analyser.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
			if (average > 0) {
				console.log('Ses algılandı - Seviye:', average);
			}
		};
		setInterval(checkAudioLevel, 100);

		stream.getTracks().forEach(track => {
			const sender = connection.addTrack(track, stream);
			console.log('Ses kanalı eklendi:', track.id);

			// Ses seviyesini izle
			sender.getStats().then(stats => {
				stats.forEach(report => {
					if (report.type === 'outbound-rtp' && report.kind === 'audio') {
						console.log('Ses iletim istatistikleri:', report);
					}
				});
			});
		});

		connection.onicecandidate = (event) => {
			if (event.candidate) {
				SocketService.emit('voice_ice_candidate', {
					userId,
					candidate: event.candidate,
				});
			}
		};

		connection.ontrack = (event) => {
			const [remoteStream] = event.streams;
			console.log('Uzak ses akışı alındı:', remoteStream.id);
			this.handleRemoteStream(userId, remoteStream);
		};

		connection.onconnectionstatechange = () => {
			console.log('Bağlantı durumu değişti:', connection.connectionState);
			if (connection.connectionState === 'connected') {
				console.log('Peer bağlantısı başarıyla kuruldu:', userId);
			}
		};

		const peerConnection: PeerConnection = { connection, stream };
		this.peerConnections.set(userId, peerConnection);

		return peerConnection;
	}

	private removePeerConnection(userId: string): void {
		const peerConnection = this.peerConnections.get(userId);
		if (peerConnection) {
			peerConnection.connection.close();
			this.peerConnections.delete(userId);
			console.log('Peer bağlantısı kapatıldı:', userId);
		}
	}

	private async initLocalStream(): Promise<MediaStream> {
		try {
			this.localStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				},
				video: false
			});

			console.log('Mikrofon başarıyla başlatıldı');

			// Ses seviyesini kontrol et
			const audioContext = new AudioContext();
			const mediaStreamSource = audioContext.createMediaStreamSource(this.localStream);
			const analyser = audioContext.createAnalyser();
			mediaStreamSource.connect(analyser);

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			const checkAudioLevel = () => {
				analyser.getByteFrequencyData(dataArray);
				const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
				if (average > 0) {
					console.log('Mikrofon ses seviyesi:', average);
				}
			};
			setInterval(checkAudioLevel, 100);

			return this.localStream;
		} catch (error) {
			console.error('Mikrofon erişim hatası:', error);
			throw error;
		}
	}

	private handleRemoteStream(userId: string, stream: MediaStream): void {
		const audioElement = document.createElement('audio');
		audioElement.id = `remote-audio-${userId}`;
		audioElement.srcObject = stream;
		audioElement.autoplay = true;
		document.body.appendChild(audioElement);

		console.log('Uzak ses akışı başlatıldı:', userId);

		// Ses seviyesini kontrol et
		const audioContext = new AudioContext();
		const mediaStreamSource = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		mediaStreamSource.connect(analyser);

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

	public async joinVoiceChat(): Promise<void> {
		try {
			await this.initLocalStream();
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
}

export default WebRTCService.getInstance(); 