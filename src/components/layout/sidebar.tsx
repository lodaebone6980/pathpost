"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Search,
  BookOpen,
  Globe,
  ImageIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/editor", label: "글쓰기", icon: PenSquare },
  { href: "/blog", label: "블로그 관리", icon: FileText },
  { href: "/search", label: "논문 검색", icon: Search },
  { href: "/papers", label: "논문 관리", icon: BookOpen },
  { href: "/crawl", label: "크롤링", icon: Globe },
  { href: "/image", label: "이미지 생성", icon: ImageIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("로그아웃 되었습니다");
      router.push("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다");
    }
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center px-6 border-b">
        <Link href="/dashboard" className="text-lg font-bold text-sidebar-foreground">
          PathPost
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          )}
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm font-medium text-sidebar-foreground/70 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
