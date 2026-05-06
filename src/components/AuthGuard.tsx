"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (!token) {
      setChecked(true);
      setAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch {}

    setChecked(true);
    setAuthorized(true);
  }, [pathname, router]);

  return { checked, authorized, user };
}

export default function AuthGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { checked, authorized } = useAuthGuard();

  if (!checked) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl animate-bounce">🎮</span>
          <p className="text-gray-400 text-sm">验证登录状态...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
