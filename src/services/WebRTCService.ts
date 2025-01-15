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
		});

		socket.on('voice_user_left', ({ userId }: { userId: string }) => {
			console.log('Kullanıcı sesli sohbetten ayrıldı:', userId);
			this.removePeerConnection(userId);
		});

		socket.on('voice_offer', async ({ userId, offer }: { userId: string; offer: RTCSessionDescriptionInit }) => {
			console.log('Teklif alındı:', userId);
			const peerConnection = await this.createPeerConnection(userId);
			await peerConnection.connection.setRemoteDescription(offer);
			const answer = await peerConnection.connection.createAnswer();
			await peerConnection.connection.setLocalDescription(answer);
			socket.emit('voice_answer', { userId, answer });
		});

		socket.on('voice_answer', async ({ userId, answer }: { userId: string; answer: RTCSessionDescriptionInit }) => {
			console.log('Cevap alındı:', userId);
			const peerConnection = this.peerConnections.get(userId);
			if (peerConnection) {
				await peerConnection.connection.setRemoteDescription(answer);
			}
		});

		socket.on('voice_ice_candidate', async ({ userId, candidate }: { userId: string; candidate: RTCIceCandidateInit }) => {
			console.log('ICE adayı alındı:', userId);
			const peerConnection = this.peerConnections.get(userId);
			if (peerConnection) {
				await peerConnection.connection.addIceCandidate(candidate);
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

		stream.getTracks().forEach(track => {
			connection.addTrack(track, stream);
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
			this.handleRemoteStream(userId, remoteStream);
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
		}
	}

	private async initLocalStream(): Promise<MediaStream> {
		try {
			this.localStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false,
			});
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
	}

	public async joinVoiceChat(): Promise<void> {
		try {
			await this.initLocalStream();
			SocketService.emit('voice_join', {});
		} catch (error) {
			console.error('Sesli sohbete katılma hatası:', error);
			throw error;
		}
	}

	public leaveVoiceChat(): void {
		if (this.localStream) {
			this.localStream.getTracks().forEach(track => track.stop());
			this.localStream = null;
		}

		this.peerConnections.forEach((_, userId) => {
			this.removePeerConnection(userId);
			const audioElement = document.getElementById(`remote-audio-${userId}`);
			if (audioElement) {
				audioElement.remove();
			}
		});

		SocketService.emit('voice_leave', {});
	}
}

export default WebRTCService.getInstance(); 