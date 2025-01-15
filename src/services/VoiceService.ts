import SocketService from './SocketService';

class VoiceService {
	private static instance: VoiceService;
	private localStream: MediaStream | null = null;
	private audioContext: AudioContext | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private isRecording = false;

	private constructor() { }

	public static getInstance(): VoiceService {
		if (!VoiceService.instance) {
			VoiceService.instance = new VoiceService();
		}
		return VoiceService.instance;
	}

	public getLocalStream(): MediaStream | null {
		return this.localStream;
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

	private setupAudioProcessing(): void {
		if (!this.localStream) {
			console.log('Ses akışı bulunamadı, ses işleme başlatılamıyor');
			return;
		}

		console.log('Ses işleme başlatılıyor...');
		this.audioContext = new AudioContext();
		const source = this.audioContext.createMediaStreamSource(this.localStream);
		const processor = this.audioContext.createScriptProcessor(2048, 1, 1);

		source.connect(processor);
		processor.connect(this.audioContext.destination);
		console.log('Ses işleme bağlantıları kuruldu');

		this.mediaRecorder = new MediaRecorder(this.localStream, {
			mimeType: 'audio/webm;codecs=opus',
			audioBitsPerSecond: 32000
		});

		console.log('MediaRecorder yapılandırması:', {
			state: this.mediaRecorder.state,
			mimeType: this.mediaRecorder.mimeType,
			audioBitsPerSecond: 32000
		});

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0 && this.isRecording) {
				console.log('Ses verisi yakalandı:', {
					size: event.data.size,
					type: event.data.type,
					timestamp: new Date().toISOString()
				});

				SocketService.emit('voice_data', {
					data: event.data
				});
				console.log('Ses verisi socket üzerinden gönderildi');
			}
		};

		this.mediaRecorder.onstart = () => {
			console.log('MediaRecorder kaydı başladı');
		};

		this.mediaRecorder.onerror = (error) => {
			console.error('MediaRecorder hatası:', error);
		};

		// Her 100ms'de bir ses verisi gönder
		this.mediaRecorder.start(100);
		this.isRecording = true;
		console.log('Ses kaydı başlatıldı, her 100ms\'de veri gönderilecek');
	}

	private setupSocketListeners(): void {
		const socket = SocketService.getSocket();
		if (!socket) {
			console.error('Socket bağlantısı bulunamadı');
			return;
		}

		console.log('Socket dinleyicileri ayarlanıyor...');
		console.log('Socket durumu:', {
			id: socket.id,
			connected: socket.connected,
			activeChannel: socket.data?.roomId
		});

		socket.on('voice_data', async ({ userId, data }: { userId: string; data: Blob }) => {
			try {
				console.log('Ses verisi alındı:', {
					userId,
					socketId: socket.id,
					activeChannel: socket.data?.roomId,
					size: data.size,
					type: data.type,
					timestamp: new Date().toISOString()
				});

				const audioBlob = new Blob([data], { type: 'audio/webm;codecs=opus' });
				const audioUrl = URL.createObjectURL(audioBlob);
				const audio = new Audio(audioUrl);

				audio.onplay = () => {
					console.log('Ses çalınmaya başladı:', {
						userId,
						socketId: socket.id,
						activeChannel: socket.data?.roomId
					});
				};

				audio.onended = () => {
					console.log('Ses çalma tamamlandı:', {
						userId,
						socketId: socket.id,
						activeChannel: socket.data?.roomId
					});
					URL.revokeObjectURL(audioUrl);
				};

				await audio.play();
			} catch (error) {
				console.error('Ses çalma hatası:', error);
			}
		});

		socket.on('voice_user_joined', ({ userId }: { userId: string }) => {
			console.log('Yeni kullanıcı sesli sohbete katıldı:', userId);
		});

		socket.on('voice_user_left', ({ userId }: { userId: string }) => {
			console.log('Kullanıcı sesli sohbetten ayrıldı:', userId);
		});

		console.log('Socket dinleyicileri başarıyla ayarlandı');
	}

	public async joinVoiceChat(): Promise<void> {
		try {
			const socket = SocketService.getSocket();
			if (!socket) {
				throw new Error('Socket bağlantısı bulunamadı');
			}

			console.log('Sesli sohbete katılma isteği gönderiliyor...');
			console.log('Socket durumu:', {
				id: socket.id,
				connected: socket.connected,
				activeChannel: socket.data?.roomId
			});

			await this.initLocalStream();
			this.setupSocketListeners();
			this.setupAudioProcessing();
			SocketService.emit('voice_join', {});
			console.log('Sesli sohbete katılma başarılı');
		} catch (error) {
			console.error('Sesli sohbete katılma hatası:', error);
			throw error;
		}
	}

	public leaveVoiceChat(): void {
		this.isRecording = false;

		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}

		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}

		if (this.localStream) {
			this.localStream.getTracks().forEach(track => {
				track.stop();
				console.log('Ses kanalı kapatıldı:', track.id);
			});
			this.localStream = null;
		}

		SocketService.emit('voice_leave', {});
		console.log('Sesli sohbetten çıkış yapıldı');
	}

	public setMuted(muted: boolean): void {
		if (this.localStream) {
			this.localStream.getAudioTracks().forEach(track => {
				track.enabled = !muted;
			});
		}
	}
}

export default VoiceService.getInstance(); 