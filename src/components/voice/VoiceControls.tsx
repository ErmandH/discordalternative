import { useState, useEffect, useCallback } from "react";
import WebRTCService from "../../services/WebRTCService";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

const VoiceControls = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinVoice = useCallback(async () => {
    if (isJoining || isConnected) return;

    try {
      setIsJoining(true);
      await WebRTCService.joinVoiceChat();
      setIsConnected(true);
    } catch (error) {
      console.error("Sesli sohbete katılma hatası:", error);
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isConnected]);

  const handleLeaveVoice = useCallback(() => {
    if (!isConnected) return;

    WebRTCService.leaveVoiceChat();
    setIsConnected(false);
  }, [isConnected]);

  useEffect(() => {
    handleJoinVoice();
    return () => {
      handleLeaveVoice();
    };
  }, []); // Boş bağımlılık dizisi

  const handleToggleMute = useCallback(() => {
    const stream = WebRTCService.getLocalStream();
    if (stream) {
      stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return (
    <div className="flex items-center space-x-2 p-2 bg-discord-primary rounded-lg">
      <button
        onClick={handleToggleMute}
        disabled={!isConnected}
        className={`p-2 rounded-full ${
          !isConnected
            ? "bg-gray-500 cursor-not-allowed"
            : isMuted
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
