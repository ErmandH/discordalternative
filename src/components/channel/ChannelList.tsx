import UserProfile from "../user/UserProfile";

interface ChannelListProps {
  selectedChannel: string;
  onChannelSelect: (channel: string) => void;
  username: string;
  onUpdateUsername: (newUsername: string) => void;
}

const ChannelList = ({
  selectedChannel,
  onChannelSelect,
  username,
  onUpdateUsername,
}: ChannelListProps) => {
  const channels = ["genel", "sohbet", "kodlama", "yardım"];

  return (
    <div className="w-60 bg-discord-secondary flex flex-col">
      <div className="p-4">
        <h2 className="text-white font-bold">Discord Alternative</h2>
      </div>
      <div className="px-2 flex-1">
        <div className="text-discord-textSecondary uppercase text-xs font-semibold mb-1 mt-4">
          Metin Kanalları
        </div>
        {channels.map((channel) => (
          <div
            key={channel}
            onClick={() => onChannelSelect(channel)}
            className={`flex items-center px-2 py-1 rounded cursor-pointer ${
              selectedChannel === channel
                ? "bg-discord-channelActive text-discord-textPrimary"
                : "text-discord-textSecondary hover:bg-discord-channelHover hover:text-discord-textPrimary"
            }`}
          >
            <span className="text-lg mr-1">#</span>
            {channel}
          </div>
        ))}
      </div>
      <UserProfile username={username} onUpdateUsername={onUpdateUsername} />
    </div>
  );
};

export default ChannelList;
