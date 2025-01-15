const ServerList = () => {
  return (
    <div className="w-[72px] bg-discord-tertiary flex flex-col items-center py-3 space-y-2">
      <div className="w-12 h-12 bg-discord-accent rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer">
        <span className="text-white text-2xl">D</span>
      </div>
      <div className="w-12 h-[2px] bg-discord-divider rounded-lg"></div>
      <div className="w-12 h-12 bg-discord-serverIcon rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer">
        <span className="text-discord-textPrimary">+</span>
      </div>
    </div>
  );
};

export default ServerList;
