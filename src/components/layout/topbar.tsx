"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Menu, LogOut, Settings,
  LayoutDashboard, PenSquare, FileText, Search, BookOpen, Globe, ImageIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/editor", label: "글쓰기", icon: PenSquare },
  { href: "/blog", label: "블로그 관리", icon: FileText },
  { href: "/search", label: "논문 검색", icon: Search },
  { href: "/papers", label: "논문 관리", icon: BookOpen },
  { href: "/crawl", label: "크롤링", icon: Globe },
  { href: "/image", label: "이미지 생성", icon: ImageIcon },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "대시보드",
  "/editor": "글쓰기",
  "/blog": "블로그 관리",
  "/search": "논문 검색",
  "/papers": "논문 관리",
  "/crawl": "크롤링",
  "/image": "이미지 생성",
  "/settings": "설정",
  "/write": "새 글 작성",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] || "PathPost";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("로그아웃 되었습니다");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="flex h-14 items-center px-6 border-b text-lg font-bold">
            PathPost
          </SheetTitle>
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="p-3 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50">
              <Settings className="h-4 w-4" />
              설정
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
