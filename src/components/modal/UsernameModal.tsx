import { useState } from "react";
import { useChat } from "../../hooks/useChat";

interface UsernameModalProps {
  onSubmit: (username: string) => void;
}

const UsernameModal = ({ onSubmit }: UsernameModalProps) => {
  const [username, setUsername] = useState("");
  const { error } = useChat(username || "temp");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-discord-primary p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-4">Hoş Geldiniz!</h2>
        <p className="text-discord-textSecondary mb-4">
          Sohbete başlamak için lütfen bir kullanıcı adı girin.
        </p>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınız..."
            className="w-full bg-discord-tertiary text-discord-textPrimary p-3 rounded-md outline-none focus:ring-2 focus:ring-discord-accent mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-discord-accent hover:bg-opacity-80 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sohbete Başla
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
