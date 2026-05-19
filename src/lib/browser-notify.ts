const DEFAULT_TITLE = "搭子星 - 游戏搭子平台";

let titleBlinkTimer: ReturnType<typeof setInterval> | null = null;
let titleBlinkOn = false;
let originalTitle = DEFAULT_TITLE;
let originalFaviconHref: string | null = null;

export function getDefaultTitle() {
  return DEFAULT_TITLE;
}

export function stopTitleBlink() {
  if (titleBlinkTimer) {
    clearInterval(titleBlinkTimer);
    titleBlinkTimer = null;
  }
  titleBlinkOn = false;
  if (typeof document !== "undefined") {
    document.title = originalTitle || DEFAULT_TITLE;
  }
}

export function startTitleBlink(unreadCount: number) {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") {
    stopTitleBlink();
    return;
  }

  originalTitle = document.title.includes("条新消息") ? DEFAULT_TITLE : document.title;
  const alertTitle = `(${unreadCount > 99 ? "99+" : unreadCount}条新消息) 搭子星`;

  if (titleBlinkTimer) return;

  titleBlinkOn = false;
  titleBlinkTimer = setInterval(() => {
    document.title = titleBlinkOn ? originalTitle : alertTitle;
    titleBlinkOn = !titleBlinkOn;
  }, 1000);
  document.title = alertTitle;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showDesktopNotification(title: string, body: string, onClick?: () => void) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "dazistar-message",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      onClick?.();
    };
  } catch {
    // ignore
  }
}

export function setFaviconBadge(show: boolean) {
  if (typeof document === "undefined") return;

  const link =
    (document.querySelector('link[rel="icon"]') as HTMLLinkElement | null) ||
    (document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null);

  if (!link) return;

  if (!show) {
    if (originalFaviconHref) {
      link.href = originalFaviconHref;
    }
    return;
  }

  if (!originalFaviconHref) {
    originalFaviconHref = link.href;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff6b9d";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("搭", 16, 17);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(26, 6, 6, 0, Math.PI * 2);
  ctx.fill();

  link.href = canvas.toDataURL("image/png");
}

export function clearBrowserNotifyEffects() {
  stopTitleBlink();
  setFaviconBadge(false);
}
