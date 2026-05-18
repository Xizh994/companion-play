"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";
const COOKIE_KEY = "dazistar_token";

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
  }
}

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (!cancelled) {
          setChecked(true);
          setAuthorized(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        if (!res.ok) {
          clearAuth();
          setChecked(true);
          setAuthorized(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        setAuthorized(true);
        setChecked(true);
      } catch {
        if (cancelled) return;
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
          try {
            setUser(JSON.parse(userStr));
            setAuthorized(true);
          } catch {
            clearAuth();
            setAuthorized(false);
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          }
        } else {
          setAuthorized(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        setChecked(true);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return { checked, authorized, user };
}

export default function AuthGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { checked, authorized } = useAuthGuard();

  if (!checked) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-3xl animate-bounce">🎮</span>
            <p className="text-gray-400 text-sm">验证登录状态...</p>
          </div>
        </div>
      )
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
