import { useState, useEffect } from "react";
import WebRTCService from "../../services/WebRTCService";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

const VoiceControls = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Kullanıcı sesli sohbete otomatik katılsın
    handleJoinVoice();

    return () => {
      // Component unmount olduğunda sesli sohbetten çık
      if (isConnected) {
        handleLeaveVoice();
      }
    };
  }, [isConnected]);

  const handleJoinVoice = async () => {
    try {
      await WebRTCService.setupSocketListeners();
      await WebRTCService.joinVoiceChat();
      setIsConnected(true);
    } catch (error) {
      console.error("Sesli sohbete katılma hatası:", error);
    }
  };

  const handleLeaveVoice = () => {
    WebRTCService.leaveVoiceChat();
    setIsConnected(false);
  };

  const handleToggleMute = () => {
    const stream = WebRTCService.getLocalStream();
    if (stream) {
      stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-discord-primary rounded-lg">
      <button
        onClick={handleToggleMute}
        className={`p-2 rounded-full ${
          isMuted
            ? "bg-red-500 hover:bg-red-600"
            : "bg-discord-accent hover:bg-opacity-80"
        }`}
        title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
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
