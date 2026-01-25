"use client";

import { signOut } from "next-auth/react";
import { Button, Badge } from "@repo/ui";
import { LogOut, User } from "lucide-react";

interface UserMenuProps {
  user?: {
    email?: string | null;
    role?: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "顧客",
  ADMIN: "管理者",
  SUPER_ADMIN: "スーパー管理者",
};

export function UserMenu({ user }: UserMenuProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">{user.email}</span>
        {user.role && (
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABELS[user.role] || user.role}
          </Badge>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        ログアウト
      </Button>
    </div>
  );
}
