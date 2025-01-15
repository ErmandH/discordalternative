import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
	private static instance: SocketService;
	private socket: Socket | null = null;

	private constructor() { }

	public static getInstance(): SocketService {
		if (!SocketService.instance) {
			SocketService.instance = new SocketService();
		}
		return SocketService.instance;
	}

	public getSocket(): Socket | null {
		return this.socket;
	}

	public connect(): Socket {
		if (!this.socket) {
			this.socket = io(SOCKET_URL);
			console.log('Yeni socket bağlantısı kuruldu');
		}
		return this.socket;
	}

	public disconnect(): void {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
			console.log('Socket bağlantısı kapatıldı');
		}
	}

	public emit(event: string, data: any): void {
		if (this.socket) {
			this.socket.emit(event, data);
		}
	}

	public on(event: string, callback: (...args: any[]) => void): void {
		if (this.socket) {
			this.socket.on(event, callback);
		}
	}

	public off(event: string, callback?: (...args: any[]) => void): void {
		if (this.socket) {
			this.socket.off(event, callback);
		}
	}
}

export default SocketService.getInstance(); 