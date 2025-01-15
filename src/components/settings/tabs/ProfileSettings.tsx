import { useState } from "react";

interface ProfileSettingsProps {
  currentUsername: string;
  onUpdateUsername: (newUsername: string) => void;
}

const ProfileSettings = ({
  currentUsername,
  onUpdateUsername,
}: ProfileSettingsProps) => {
  const [username, setUsername] = useState(currentUsername);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && username !== currentUsername) {
      onUpdateUsername(username.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="text-discord-textPrimary">
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-2">Kullanıcı Adı</h3>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-discord-tertiary text-discord-textPrimary p-2 rounded-md outline-none focus:ring-2 focus:ring-discord-accent"
              autoFocus
            />
            <button
              type="submit"
              className="bg-discord-accent hover:bg-opacity-80 text-white px-4 py-2 rounded-md"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername(currentUsername);
                setIsEditing(false);
              }}
              className="bg-discord-channelHover hover:bg-opacity-80 text-white px-4 py-2 rounded-md"
            >
              İptal
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-lg">{currentUsername}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-discord-accent hover:underline text-sm"
            >
              Düzenle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
