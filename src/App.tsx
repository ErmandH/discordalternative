import { useState } from "react";
import ServerList from "./components/server/ServerList";
import ChannelList from "./components/channel/ChannelList";
import ChatArea from "./components/channel/ChatArea";
import UserList from "./components/user/UserList";
import WindowControls from "./components/layout/WindowControls";
import UsernameModal from "./components/modal/UsernameModal";

// WebkitAppRegion için özel tip tanımı
interface DragAreaStyle extends React.CSSProperties {
  WebkitAppRegion?: "drag" | "no-drag";
}

const App = () => {
  const [selectedChannel, setSelectedChannel] = useState("genel");
  const [username, setUsername] = useState<string | null>(null);

  const dragAreaStyle: DragAreaStyle = {
    WebkitAppRegion: "drag",
  };

  const handleUpdateUsername = (newUsername: string) => {
    setUsername(newUsername);
  };

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex flex-col h-screen bg-discord-tertiary">
      {/* Pencereyi sürüklemek için alan */}
      <div
        className="h-7 bg-discord-tertiary w-full flex items-center"
        style={dragAreaStyle}
      >
        <WindowControls />
      </div>

      {/* Ana içerik */}
      <div className="flex flex-1">
        <ServerList />
        <ChannelList
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          username={username}
          onUpdateUsername={handleUpdateUsername}
        />
        <ChatArea selectedChannel={selectedChannel} username={username} />
        <UserList username={username} />
      </div>
    </div>
  );
};

export default App;
