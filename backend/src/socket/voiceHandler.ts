import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export default function handleVoiceEvents(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
	const voiceRooms = new Map<string, Set<string>>();
	console.log('Voice handler başlatıldı, socket ID:', socket.id);

	socket.on('voice_join', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;
		console.log('Sesli sohbet katılma isteği:', { userId, roomId, socketId: socket.id });

		if (!voiceRooms.has(roomId)) {
			console.log('Yeni ses odası oluşturuluyor:', roomId);
			voiceRooms.set(roomId, new Set());
		}

		const room = voiceRooms.get(roomId);
		if (room) {
			room.add(userId);
			console.log('Kullanıcı odaya eklendi:', {
				userId,
				roomId,
				odadakiKullaniciSayisi: room.size
			});

			// Odadaki diğer kullanıcılara bildir
			socket.to(roomId).emit('voice_user_joined', { userId });
			console.log('Diğer kullanıcılara katılım bildirildi');

			// Yeni kullanıcıya odadaki diğer kullanıcıları bildir
			const existingUsers = Array.from(room).filter(id => id !== userId);
			console.log('Mevcut kullanıcılar bildiriliyor:', existingUsers);

			existingUsers.forEach(existingUserId => {
				socket.emit('voice_user_joined', { userId: existingUserId });
			});

			console.log(`Kullanıcı sesli sohbete katıldı: ${userId} - Oda: ${roomId}`);
		}
	});

	socket.on('voice_leave', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;
		console.log('Sesli sohbetten ayrılma isteği:', { userId, roomId });

		const room = voiceRooms.get(roomId);
		if (room) {
			room.delete(userId);
			console.log('Kullanıcı odadan çıkarıldı:', {
				userId,
				roomId,
				kalanKullaniciSayisi: room.size
			});

			if (room.size === 0) {
				voiceRooms.delete(roomId);
				console.log('Boş oda silindi:', roomId);
			}

			socket.to(roomId).emit('voice_user_left', { userId });
			console.log('Diğer kullanıcılara ayrılma bildirildi');
		}
	});

	socket.on('voice_data', ({ data }) => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;
		console.log('Ses verisi alındı:', {
			userId,
			roomId,
			veriBoyu: data.size,
			veriTipi: data.type,
			timestamp: new Date().toISOString()
		});

		// Ses verisini odadaki diğer kullanıcılara ilet
		socket.to(roomId).emit('voice_data', {
			userId,
			data
		});
		console.log('Ses verisi diğer kullanıcılara iletildi');
	});

	// Bağlantı koptuğunda temizlik yap
	socket.on('disconnect', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;
		console.log('Bağlantı koptu:', { userId, roomId, socketId: socket.id });

		const room = voiceRooms.get(roomId);
		if (room) {
			room.delete(userId);
			console.log('Kullanıcı odadan çıkarıldı:', {
				userId,
				roomId,
				kalanKullaniciSayisi: room.size
			});

			if (room.size === 0) {
				voiceRooms.delete(roomId);
				console.log('Boş oda silindi:', roomId);
			}

			socket.to(roomId).emit('voice_user_left', { userId });
			console.log('Diğer kullanıcılara ayrılma bildirildi');
		}
	});
} 