import { useChat } from "../../hooks/useChat";

interface UserListProps {
  username: string;
}

const UserList = ({ username }: UserListProps) => {
  const { users } = useChat(username);

  return (
    <div className="w-60 bg-discord-secondary p-4">
      <div className="text-discord-textSecondary uppercase text-xs font-semibold mb-2">
        Çevrimiçi — {users.length}
      </div>
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center py-2 px-2 rounded hover:bg-discord-channelHover cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center">
            <span className="text-white text-sm">{user.username[0]}</span>
          </div>
          <span className="ml-2 text-discord-textPrimary">{user.username}</span>
        </div>
      ))}
    </div>
  );
};

export default UserList;
