import { useState } from "react";
import ProfileSettings from "./tabs/ProfileSettings";
import VoiceSettings from "./tabs/VoiceSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUpdateUsername: (newUsername: string) => void;
}

type TabType = "profile" | "voice";

const SettingsModal = ({
  isOpen,
  onClose,
  username,
  onUpdateUsername,
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  if (!isOpen) return null;

  const tabs = [
    { id: "profile" as TabType, name: "Profil", icon: "👤" },
    { id: "voice" as TabType, name: "Ses Ayarları", icon: "🎤" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-discord-primary w-[900px] h-[600px] rounded-lg flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[232px] bg-discord-tertiary p-4">
          <div className="text-discord-textSecondary uppercase text-xs font-semibold mb-2">
            KULLANICI AYARLARI
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-2 py-2 rounded mb-1 flex items-center ${
                activeTab === tab.id
                  ? "bg-discord-channelActive text-white"
                  : "text-discord-textSecondary hover:bg-discord-channelHover hover:text-discord-textPrimary"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-xl font-bold">
              {tabs.find((tab) => tab.id === activeTab)?.name}
            </h2>
            <button
              onClick={onClose}
              className="text-discord-textSecondary hover:text-white"
            >
              ✕
            </button>
          </div>

          {activeTab === "profile" && (
            <ProfileSettings
              currentUsername={username}
              onUpdateUsername={onUpdateUsername}
            />
          )}
          {activeTab === "voice" && <VoiceSettings />}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
