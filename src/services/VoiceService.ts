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
		const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

		source.connect(processor);
		processor.connect(this.audioContext.destination);
		console.log('Ses işleme bağlantıları kuruldu');

		processor.onaudioprocess = (e) => {
			if (!this.isRecording) return;

			const inputData = e.inputBuffer.getChannelData(0);
			const audioData = new Float32Array(inputData);

			// Float32Array'i base64'e çevir
			const bytes = new Uint8Array(audioData.buffer);
			const binary = String.fromCharCode(...bytes);
			const base64Data = btoa(binary);

			SocketService.emit('voice_data', {
				data: base64Data,
				sampleRate: this.audioContext?.sampleRate
			});
		};

		this.isRecording = true;
		console.log('Ses işleme başlatıldı');
	}

	private setupSocketListeners(): void {
		const socket = SocketService.getSocket();
		if (!socket) {
			console.error('Socket bağlantısı bulunamadı');
			return;
		}

		console.log('Socket dinleyicileri ayarlanıyor...');

		socket.on('voice_data', async ({ userId, data, sampleRate }: { userId: string; data: string; sampleRate: number }) => {
			try {
				if (!this.audioContext) {
					this.audioContext = new AudioContext();
				}

				// Base64'ten Float32Array'e çevir
				const binaryString = atob(data);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				const audioData = new Float32Array(bytes.buffer);

				// AudioBuffer oluştur
				const audioBuffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
				audioBuffer.getChannelData(0).set(audioData);

				// AudioBuffer'ı çal
				const source = this.audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(this.audioContext.destination);

				source.onended = () => {
					console.log('Ses çalma tamamlandı:', userId);
				};

				console.log('Ses çalınmaya başlıyor:', userId);
				source.start(0);
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