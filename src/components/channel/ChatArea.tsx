import { useState, useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";

interface ChatAreaProps {
  selectedChannel: string;
  username: string;
}

const ChatArea = ({ selectedChannel, username }: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentUser, joinChannel, sendMessage } = useChat(username);

  useEffect(() => {
    if (currentUser) {
      joinChannel(selectedChannel);
    }
  }, [selectedChannel, currentUser, joinChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue, selectedChannel);
      setInputValue("");
    }
  };

  return (
    <div className="flex-1 bg-discord-primary flex flex-col">
      <div className="h-12 border-b border-discord-tertiary flex items-center px-4">
        <span className="text-lg text-discord-textSecondary mr-1">#</span>
        <span className="font-bold text-white">{selectedChannel}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.userId === currentUser?.id ? "ml-auto" : ""
            }`}
          >
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-discord-accent flex items-center justify-center">
                <span className="text-white text-sm">
                  {message.username[0]}
                </span>
              </div>
              <div className="ml-2">
                <div className="flex items-center">
                  <span className="font-semibold text-white">
                    {message.username}
                  </span>
                  <span className="ml-2 text-xs text-discord-textSecondary">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-discord-textPrimary">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="bg-[#40444b] rounded-lg p-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`#${selectedChannel} kanalına mesaj gönder`}
            className="w-full bg-transparent text-discord-textPrimary outline-none placeholder-discord-textSecondary"
          />
        </div>
      </form>
    </div>
  );
};

export default ChatArea;
