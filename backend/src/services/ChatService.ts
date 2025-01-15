import { Channel, Message, User } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

class ChatService {
	private channels: Map<string, Channel>;
	private users: Map<string, User>;

	constructor() {
		this.channels = new Map();
		this.users = new Map();

		// Varsayılan kanalları oluştur
		['genel', 'sohbet', 'kodlama', 'yardım'].forEach(channelName => {
			this.channels.set(channelName, {
				id: channelName,
				name: channelName,
				messages: [],
				users: []
			});
		});
	}

	// Kullanıcı işlemleri
	addUser(username: string, socketId: string): User | null {
		// Aynı kullanıcı adı ile başka bir kullanıcı var mı kontrol et
		const existingUser = Array.from(this.users.values()).find(
			u => u.username.toLowerCase() === username.toLowerCase()
		);

		if (existingUser) {
			return null; // Aynı kullanıcı adı varsa null dön
		}

		const user: User = {
			id: uuidv4(),
			username,
			socketId
		};
		this.users.set(socketId, user);

		// Kullanıcıyı varsayılan olarak 'genel' kanala ekle
		this.joinChannel(user.id, 'genel');

		return user;
	}

	removeUser(socketId: string): void {
		const user = this.users.get(socketId);
		if (user && user.activeChannel) {
			this.removeUserFromChannel(user.id, user.activeChannel);
		}
		this.users.delete(socketId);
	}

	// Kanal işlemleri
	joinChannel(userId: string, channelId: string): void {
		const channel = this.channels.get(channelId);
		const user = Array.from(this.users.values()).find(u => u.id === userId);

		if (channel && user) {
			// Önceki kanaldan çık
			if (user.activeChannel) {
				this.removeUserFromChannel(userId, user.activeChannel);
			}

			// Yeni kanala katıl
			if (!channel.users.find(u => u.id === userId)) {
				channel.users.push(user);
			}
			user.activeChannel = channelId;
		}
	}

	removeUserFromChannel(userId: string, channelId: string): void {
		const channel = this.channels.get(channelId);
		if (channel) {
			channel.users = channel.users.filter(u => u.id !== userId);
		}
	}

	// Mesaj işlemleri
	addMessage(content: string, userId: string, channelId: string): Message {
		const user = Array.from(this.users.values()).find(u => u.id === userId);
		const channel = this.channels.get(channelId);

		if (!user || !channel) {
			throw new Error('Kullanıcı veya kanal bulunamadı');
		}

		const message: Message = {
			id: uuidv4(),
			content,
			userId,
			username: user.username,
			channelId,
			timestamp: new Date()
		};

		channel.messages.push(message);
		return message;
	}

	getChannelMessages(channelId: string): Message[] {
		return this.channels.get(channelId)?.messages || [];
	}

	getChannelUsers(channelId: string): User[] {
		return this.channels.get(channelId)?.users || [];
	}

	getAllUsers(): User[] {
		return Array.from(this.users.values());
	}

	getAllChannels(): Channel[] {
		return Array.from(this.channels.values());
	}

	getUserBySocketId(socketId: string): User | undefined {
		return this.users.get(socketId);
	}
}

export default new ChatService(); 