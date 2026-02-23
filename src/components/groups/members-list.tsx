"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  user_id: string;
  role: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

export function MembersList({ members }: { members: Member[] }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 mb-2">
        Members ({members.length})
      </h2>
      <div className="flex -space-x-2">
        {members.map((m) => (
          <Avatar key={m.user_id} className="h-8 w-8 border-2 border-white">
            {m.user?.avatar_url && (
              <AvatarImage src={m.user.avatar_url} alt={m.user?.full_name} />
            )}
            <AvatarFallback className="text-xs">
              {m.user?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
}
