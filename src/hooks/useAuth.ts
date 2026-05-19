"use client";

import { useState, useCallback } from "react";

const TOKEN_KEY = "dazistar_token";
const USER_KEY = "dazistar_user";
const COOKIE_KEY = "dazistar_token";

function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function removeTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
}

function getStoredAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedToken && storedUser) {
    try {
      return { token: storedToken, user: JSON.parse(storedUser) as AuthUser };
    } catch {
      return { token: null, user: null };
    }
  }
  return { token: null, user: null };
}

export interface AuthUser {
  id: string;
  phone: string;
  role: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  status: string;
  realNameVerification: {
    id: string;
    realName: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
  playerProfile: Record<string, unknown> | null;
  shopProfile: Record<string, unknown> | null;
}

export interface RegisterFormData {
  phone: string;
  password?: string;
  role: string;
  nickname: string;
  avatar?: string | null;
  phoneVerifiedToken: string;
  email?: string;
  emailVerifiedToken?: string;
  shopName?: string;
  shopBio?: string;
  shopCover?: string | null;
  contactName?: string;
  contactIdCard?: string;
  licenseImage?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth().user);
  const [token, setToken] = useState<string | null>(() => getStoredAuth().token);
  const [loading] = useState(false);

  const login = useCallback(
    async (params: { phone?: string; email?: string; password?: string; loginType?: "password" | "sms" | "email_code"; smsVerifiedToken?: string; emailVerifiedToken?: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "登录失败");
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setTokenCookie(data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    },
    []
  );

  const register = useCallback(async (formData: RegisterFormData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "注册失败");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setTokenCookie(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      } catch {
        // 仍清除本地登录态
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    removeTokenCookie();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {
      // skip refresh errors
    }
  }, []);

  return { user, token, loading, login, register, logout, refreshUser };
}
