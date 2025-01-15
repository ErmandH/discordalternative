import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export default function handleVoiceEvents(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
	const voiceRooms = new Map<string, Set<string>>();
	console.log('Voice handler başlatıldı:', {
		socketId: socket.id,
		userId: socket.data.userId,
		roomId: socket.data.roomId
	});

	if (!socket.data.userId || !socket.data.roomId) {
		console.error('Voice handler başlatılamadı: Kullanıcı bilgileri eksik', {
			socketId: socket.id,
			data: socket.data
		});
		return;
	}

	// Kullanıcının mevcut odasını ayarla
	const currentRoomId = socket.data.roomId;
	if (!voiceRooms.has(currentRoomId)) {
		voiceRooms.set(currentRoomId, new Set());
	}
	const currentRoom = voiceRooms.get(currentRoomId);
	if (currentRoom) {
		currentRoom.add(socket.data.userId);
		console.log('Kullanıcı mevcut odaya eklendi:', {
			userId: socket.data.userId,
			roomId: currentRoomId,
			odadakiKullaniciSayisi: currentRoom.size
		});
	}

	socket.on('voice_join', () => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		if (!userId || !roomId) {
			console.error('Eksik kullanıcı bilgileri:', {
				socketId: socket.id,
				userId,
				roomId
			});
			return;
		}

		console.log('Sesli sohbet katılma isteği:', { userId, roomId, socketId: socket.id });

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
		}
	});

	socket.on('voice_data', ({ data }) => {
		const userId = socket.data.userId;
		const roomId = socket.data.roomId;

		if (!userId || !roomId) {
			console.error('Eksik kullanıcı bilgileri:', {
				socketId: socket.id,
				data: socket.data
			});
			return;
		}

		if (!data) {
			console.error('Ses verisi bulunamadı');
			return;
		}

		const room = voiceRooms.get(roomId);
		if (!room) {
			console.error('Oda bulunamadı:', roomId);
			return;
		}

		if (!room.has(userId)) {
			console.error('Kullanıcı odada değil:', {
				userId,
				roomId,
				odadakiKullanicilar: Array.from(room)
			});
			return;
		}
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
} 