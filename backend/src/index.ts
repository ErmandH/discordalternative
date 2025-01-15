import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ChatService from './services/ChatService';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

app.use(cors());
app.use(express.json());

// Socket.IO olayları
io.on('connection', (socket) => {
	console.log('Yeni kullanıcı bağlandı:', socket.id);

	// Kullanıcı girişi
	socket.on('user_join', ({ username }) => {
		const user = ChatService.addUser(username, socket.id);

		if (!user) {
			// Kullanıcı adı zaten kullanımda
			socket.emit('join_error', {
				message: 'Bu kullanıcı adı zaten kullanımda. Lütfen başka bir kullanıcı adı seçin.'
			});
			return;
		}

		socket.emit('user_info', user);
		// Tüm kullanıcıları gönder
		io.emit('users_update', ChatService.getAllUsers());
	});

	// Kanala katılma
	socket.on('join_channel', ({ userId, channelId }) => {
		ChatService.joinChannel(userId, channelId);
		socket.join(channelId);

		const user = ChatService.getUserBySocketId(socket.id);
		if (user) {
			io.to(channelId).emit('user_joined', {
				channelId,
				user
			});
		}

		// Kanal mesajlarını gönder
		const messages = ChatService.getChannelMessages(channelId);
		socket.emit('channel_messages', messages);

		// Kanal kullanıcılarını gönder
		io.emit('users_update', ChatService.getAllUsers());
	});

	// Mesaj gönderme
	socket.on('send_message', ({ content, userId, channelId }) => {
		try {
			const message = ChatService.addMessage(content, userId, channelId);
			io.to(channelId).emit('receive_message', message);
		} catch (error) {
			console.error('Mesaj gönderme hatası:', error);
		}
	});

	// Bağlantı koptuğunda
	socket.on('disconnect', () => {
		const user = ChatService.getUserBySocketId(socket.id);
		if (user && user.activeChannel) {
			io.to(user.activeChannel).emit('user_left', {
				channelId: user.activeChannel,
				userId: user.id
			});
		}
		ChatService.removeUser(socket.id);
		// Güncellenmiş kullanıcı listesini gönder
		io.emit('users_update', ChatService.getAllUsers());
		console.log('Kullanıcı ayrıldı:', socket.id);
	});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`Server ${PORT} portunda çalışıyor`);
}); 