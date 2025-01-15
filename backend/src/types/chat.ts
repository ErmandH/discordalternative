export interface Message {
	id: string;
	content: string;
	userId: string;
	username: string;
	channelId: string;
	timestamp: Date;
}

export interface User {
	id: string;
	username: string;
	socketId: string;
	activeChannel?: string;
}

export interface Channel {
	id: string;
	name: string;
	messages: Message[];
	users: User[];
}

export interface ChatEvent {
	JOIN_CHANNEL: 'join_channel';
	LEAVE_CHANNEL: 'leave_channel';
	SEND_MESSAGE: 'send_message';
	RECEIVE_MESSAGE: 'receive_message';
	USER_JOINED: 'user_joined';
	USER_LEFT: 'user_left';
} 