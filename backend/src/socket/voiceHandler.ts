import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export default function handleVoiceEvents(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
	const voiceRooms = new Map<string, Set<string>>();

	socket.on('voice_join', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		if (!voiceRooms.has(roomId)) {
			voiceRooms.set(roomId, new Set());
		}

		const room = voiceRooms.get(roomId);
		if (room) {
			room.add(userId);

			// Odadaki diğer kullanıcılara bildir
			socket.to(roomId).emit('voice_user_joined', { userId });

			// Yeni kullanıcıya odadaki diğer kullanıcıları bildir
			room.forEach(existingUserId => {
				if (existingUserId !== userId) {
					socket.emit('voice_user_joined', { userId: existingUserId });
				}
			});

			console.log(`Kullanıcı sesli sohbete katıldı: ${userId} - Oda: ${roomId}`);
		}
	});

	socket.on('voice_leave', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		const room = voiceRooms.get(roomId);
		if (room) {
			room.delete(userId);
			if (room.size === 0) {
				voiceRooms.delete(roomId);
			}
			socket.to(roomId).emit('voice_user_left', { userId });
			console.log(`Kullanıcı sesli sohbetten ayrıldı: ${userId} - Oda: ${roomId}`);
		}
	});

	socket.on('voice_data', ({ data }) => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		// Ses verisini odadaki diğer kullanıcılara ilet
		socket.to(roomId).emit('voice_data', {
			userId,
			data
		});
	});

	// Bağlantı koptuğunda temizlik yap
	socket.on('disconnect', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		const room = voiceRooms.get(roomId);
		if (room) {
			room.delete(userId);
			if (room.size === 0) {
				voiceRooms.delete(roomId);
			}
			socket.to(roomId).emit('voice_user_left', { userId });
			console.log(`Kullanıcı bağlantısı koptu: ${userId} - Oda: ${roomId}`);
		}
	});
} 