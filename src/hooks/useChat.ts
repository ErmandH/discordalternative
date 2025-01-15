import { useState, useEffect, useCallback } from 'react';
import SocketService from '../services/SocketService';
import { Socket } from 'socket.io-client';

interface Message {
	id: string;
	content: string;
	userId: string;
	username: string;
	channelId: string;
	timestamp: Date;
}

interface User {
	id: string;
	username: string;
	socketId: string;
	activeChannel?: string;
}

export const useChat = (username: string) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Socket.IO bağlantısını başlat
	useEffect(() => {
		const socket = SocketService.connect();

		// Sadece username değiştiğinde user_join eventi gönder
		if (!currentUser) {
			socket.emit('user_join', { username });
		}

		socket.on('user_info', (user: User) => {
			setCurrentUser(user);
			setError(null);
		});

		socket.on('join_error', ({ message }) => {
			setError(message);
		});

		return () => {
			socket.off('user_info');
			socket.off('join_error');
		};
	}, [username, currentUser]);

	// Kanal olaylarını dinle
	useEffect(() => {
		const socket = SocketService.getSocket();
		if (!socket) return;

		socket.on('channel_messages', (channelMessages: Message[]) => {
			setMessages(channelMessages);
		});

		socket.on('receive_message', (message: Message) => {
			setMessages(prev => [...prev, message]);
		});

		socket.on('users_update', (updatedUsers: User[]) => {
			setUsers(updatedUsers);
		});

		socket.on('user_left', ({ userId }) => {
			setUsers(prev => prev.filter(user => user.id !== userId));
		});

		return () => {
			socket.off('channel_messages');
			socket.off('receive_message');
			socket.off('users_update');
			socket.off('user_left');
		};
	}, []);

	// Kanala katıl
	const joinChannel = useCallback((channelId: string) => {
		if (currentUser) {
			SocketService.emit('join_channel', {
				userId: currentUser.id,
				channelId
			});
		}
	}, [currentUser]);

	// Mesaj gönder
	const sendMessage = useCallback((content: string, channelId: string) => {
		if (currentUser) {
			SocketService.emit('send_message', {
				content,
				userId: currentUser.id,
				channelId
			});
		}
	}, [currentUser]);

	return {
		messages,
		users,
		currentUser,
		error,
		joinChannel,
		sendMessage
	};
}; 