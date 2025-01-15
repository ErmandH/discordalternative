import { useState } from "react";
import { FaHashtag } from "react-icons/fa";
import UserProfile from "../user/UserProfile";
import VoiceControls from "../voice/VoiceControls";

interface ChannelListProps {
  selectedChannel: string;
  onChannelSelect: (channel: string) => void;
  username: string;
  onUpdateUsername: (newUsername: string) => void;
}

const channels = ["genel", "sohbet", "kodlama", "yardım"];

const ChannelList = ({
  selectedChannel,
  onChannelSelect,
  username,
  onUpdateUsername,
}: ChannelListProps) => {
  return (
    <div className="w-60 bg-discord-secondary flex flex-col">
      {/* Sunucu Başlığı */}
      <div className="p-4 shadow-sm">
        <h2 className="text-white font-semibold">Discord Alternative</h2>
      </div>

      {/* Ses Kontrolleri */}
      {/* <div className="p-2">
        <VoiceControls />
      </div> */}

      {/* Kanallar */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <h3 className="text-discord-textSecondary font-semibold text-xs uppercase px-2 mb-2">
            Metin Kanalları
          </h3>
          {channels.map((channel) => (
            <button
              key={channel}
              onClick={() => onChannelSelect(channel)}
              className={`w-full flex items-center px-2 py-1 rounded text-sm mb-1 ${
                selectedChannel === channel
                  ? "bg-discord-selected text-white"
                  : "text-discord-textSecondary hover:bg-discord-hover hover:text-discord-textPrimary"
              }`}
            >
              <FaHashtag className="mr-1" />
              {channel}
            </button>
          ))}
        </div>
      </div>

      {/* Kullanıcı Profili */}
      <div className="p-2 bg-discord-primary mt-auto">
        <UserProfile username={username} onUpdateUsername={onUpdateUsername} />
      </div>
    </div>
  );
};

export default ChannelList;
