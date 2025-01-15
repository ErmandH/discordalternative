const WindowControls = () => {
  const handleMinimize = () => {
    window.electron?.minimize();
  };

  const handleMaximize = () => {
    window.electron?.maximize();
  };

  const handleClose = () => {
    window.electron?.close();
  };

  return (
    <div
      className="flex items-center h-full ml-auto"
      style={{ WebkitAppRegion: "no-drag" }}
    >
      <button
        onClick={handleMinimize}
        className="px-4 h-full hover:bg-discord-channelHover text-discord-textSecondary hover:text-discord-textPrimary"
      >
        ─
      </button>
      <button
        onClick={handleMaximize}
        className="px-4 h-full hover:bg-discord-channelHover text-discord-textSecondary hover:text-discord-textPrimary"
      >
        □
      </button>
      <button
        onClick={handleClose}
        className="px-4 h-full hover:bg-red-500 text-discord-textSecondary hover:text-white"
      >
        ×
      </button>
    </div>
  );
};

export default WindowControls;
