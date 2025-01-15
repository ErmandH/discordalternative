import React, { useState, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import VoiceService from "../../services/VoiceService";

const VoiceControls: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleJoin = async () => {
      try {
        await VoiceService.joinVoiceChat();
        setIsConnected(true);
      } catch (error) {
        console.error("Sesli sohbete katılma hatası:", error);
        setIsConnected(false);
      }
    };

    handleJoin();

    return () => {
      if (isConnected) {
        VoiceService.leaveVoiceChat();
        setIsConnected(false);
      }
    };
  }, []);

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    VoiceService.setMuted(!isMuted);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggleMute}
        className={`p-2 rounded-full ${
          isMuted
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
        aria-label={isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
      >
        {isMuted ? (
          <FaMicrophoneSlash className="w-5 h-5 text-white" />
        ) : (
          <FaMicrophone className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
};

export default VoiceControls;
