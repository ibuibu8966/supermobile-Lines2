"use client";

import { useCallback } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { mutate } from "swr";

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

// プリフェッチ用のマッピング
const PREFETCH_MAP: Record<string, string[]> = {
  "/sims": ["/api/sims?page=1", "/api/sim-location-tags"],
  "/applications": ["/api/applications?page=1", "/api/services"],
  "/users": ["/api/users", "/api/services"],
};

export function SidebarItem({
  href,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
}: SidebarItemProps) {
  // ホバー時にSWRキャッシュにプリフェッチ
  const handleMouseEnter = useCallback(() => {
    const urls = PREFETCH_MAP[href];
    if (urls) {
      urls.forEach((url) => {
        // undefinedを渡すとfetcherが呼ばれる
        mutate(url);
      });
    }
  }, [href]);

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${isCollapsed ? "justify-center" : ""}
      `}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <span className="truncate text-sm">{label}</span>
      )}
    </Link>
  );
}
