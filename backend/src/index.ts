import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ChatService from './services/ChatService';
import handleVoiceEvents from './socket/voiceHandler';

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

		// Socket.data'ya kullanıcı bilgilerini ekle
		socket.data.userId = user.id;
		console.log('Socket.data güncellendi:', socket.data);

		socket.emit('user_info', user);
		// Tüm kullanıcıları gönder
		io.emit('users_update', ChatService.getAllUsers());
	});

	// Kanala katılma
	socket.on('join_channel', ({ userId, channelId }) => {
		ChatService.joinChannel(userId, channelId);
		socket.join(channelId);

		// Socket.data'ya kanal bilgisini ekle
		socket.data.roomId = channelId;
		console.log('Socket.data güncellendi:', socket.data);

		// Voice handler'ı başlat
		handleVoiceEvents(socket);

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

	// Sesli sohbet olayları
	socket.on('voice_join', () => {
		const user = ChatService.getUserBySocketId(socket.id);
		console.log('Sesli sohbete katılma olayı tetiklendi:', user);
		if (user) {
			// Diğer kullanıcılara bildir
			socket.broadcast.emit('voice_user_joined', { userId: user.id });
		}
	});

	socket.on('voice_leave', () => {
		const user = ChatService.getUserBySocketId(socket.id);
		if (user) {
			// Diğer kullanıcılara bildir
			socket.broadcast.emit('voice_user_left', { userId: user.id });
		}
	});

	socket.on('voice_offer', ({ userId, offer }) => {
		const user = ChatService.getUserBySocketId(socket.id);
		if (user) {
			// Teklifi hedef kullanıcıya ilet
			io.to(userId).emit('voice_offer', {
				userId: user.id,
				offer
			});
		}
	});

	socket.on('voice_answer', ({ userId, answer }) => {
		const user = ChatService.getUserBySocketId(socket.id);
		if (user) {
			// Cevabı hedef kullanıcıya ilet
			io.to(userId).emit('voice_answer', {
				userId: user.id,
				answer
			});
		}
	});

	socket.on('voice_ice_candidate', ({ userId, candidate }) => {
		const user = ChatService.getUserBySocketId(socket.id);
		if (user) {
			// ICE adayını hedef kullanıcıya ilet
			io.to(userId).emit('voice_ice_candidate', {
				userId: user.id,
				candidate
			});
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
// Tüm IP adreslerinden bağlantı kabul et
httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`Server ${PORT} portunda çalışıyor`);
	console.log('Bağlantı adresleri:');
	const networkInterfaces = require('os').networkInterfaces();
	for (const interfaceName in networkInterfaces) {
		const interfaces = networkInterfaces[interfaceName];
		for (const iface of interfaces) {
			if (iface.family === 'IPv4' && !iface.internal) {
				console.log(`http://${iface.address}:${PORT}`);
			}
		}
	}
}); 