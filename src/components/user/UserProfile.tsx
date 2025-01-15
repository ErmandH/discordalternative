import { useState } from "react";
import SettingsModal from "../settings/SettingsModal";

interface UserProfileProps {
  username: string;
  onUpdateUsername?: (newUsername: string) => void;
}

const UserProfile = ({ username, onUpdateUsername }: UserProfileProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="h-[52px] bg-discord-secondary flex items-center px-2 mt-auto">
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center">
            <span className="text-white text-sm">{username[0]}</span>
          </div>
          <div className="ml-2 flex-1">
            <div className="text-white font-medium text-sm">{username}</div>
            <div className="text-discord-textSecondary text-xs">Çevrimiçi</div>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Mikrofon */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-8 h-8 rounded-md hover:bg-discord-channelHover flex items-center justify-center ${
              isMuted
                ? "text-red-500"
                : "text-discord-textSecondary hover:text-discord-textPrimary"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line
                x1="12"
                y1="18"
                x2="12"
                y2="22"
                strokeWidth="2"
                stroke="currentColor"
              />
              <line
                x1="8"
                y1="22"
                x2="16"
                y2="22"
                strokeWidth="2"
                stroke="currentColor"
              />
              {isMuted && (
                <line
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="text-red-500"
                />
              )}
            </svg>
          </button>

          {/* Kulaklık */}
          <button
            onClick={() => setIsDeafened(!isDeafened)}
            className={`w-8 h-8 rounded-md hover:bg-discord-channelHover flex items-center justify-center ${
              isDeafened
                ? "text-red-500"
                : "text-discord-textSecondary hover:text-discord-textPrimary"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9" />
              <path d="M21 14v4a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2Z" />
              <path d="M3 14v4a2 2 0 0 0 2 2h2v-6H5a2 2 0 0 0-2 2Z" />
              {isDeafened && (
                <line
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="text-red-500"
                />
              )}
            </svg>
          </button>

          {/* Ayarlar */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-md hover:bg-discord-channelHover flex items-center justify-center text-discord-textSecondary hover:text-discord-textPrimary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M12 2a1 1 0 0 1 1 1v1.6a7.5 7.5 0 0 1 2.2.9l1.1-1.1a1 1 0 0 1 1.4 0l1.5 1.5a1 1 0 0 1 0 1.4l-1.1 1.1c.4.7.7 1.4.9 2.2H21a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1.6a7.5 7.5 0 0 1-.9 2.2l1.1 1.1a1 1 0 0 1 0 1.4l-1.5 1.5a1 1 0 0 1-1.4 0l-1.1-1.1c-.7.4-1.4.7-2.2.9V21a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.6a7.5 7.5 0 0 1-2.2-.9l-1.1 1.1a1 1 0 0 1-1.4 0l-1.5-1.5a1 1 0 0 1 0-1.4l1.1-1.1a7.5 7.5 0 0 1-.9-2.2H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1.6a7.5 7.5 0 0 1 .9-2.2L4.4 6.4a1 1 0 0 1 0-1.4l1.5-1.5a1 1 0 0 1 1.4 0l1.1 1.1c.7-.4 1.4-.7 2.2-.9V2a1 1 0 0 1 1-1h2Z" />
            </svg>
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        username={username}
        onUpdateUsername={onUpdateUsername || (() => {})}
      />
    </>
  );
};

export default UserProfile;
