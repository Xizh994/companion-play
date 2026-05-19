const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** @type {Map<string, Set<string>>} userId -> socket ids */
const userSockets = new Map();

async function setUserStatus(userId, status) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    return true;
  } catch (err) {
    console.error("[Presence] Failed to update status:", userId, status, err);
    return false;
  }
}

/**
 * @param {import("socket.io").Server} io
 * @param {string} userId
 * @param {string} socketId
 */
async function trackConnect(io, userId, socketId) {
  if (!userId || !socketId) return;

  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(userId, sockets);
  }

  const firstConnection = sockets.size === 0;
  sockets.add(socketId);

  if (firstConnection) {
    await setUserStatus(userId, "online");
    io.to("lobby").emit("lobby_users", { userId, status: "online" });
    console.log("[Presence] User online:", userId);
  }
}

/**
 * @param {import("socket.io").Server} io
 * @param {string} userId
 * @param {string} socketId
 */
async function trackDisconnect(io, userId, socketId) {
  if (!userId) return;

  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
    await setUserStatus(userId, "offline");
    io.to("lobby").emit("lobby_users", { userId, status: "offline" });
    console.log("[Presence] User offline:", userId);
  }
}

/** 客户端登出时立即标离线（若无活跃 Socket） */
async function forceOffline(userId) {
  const sockets = userSockets.get(userId);
  if (sockets && sockets.size > 0) {
    return false;
  }
  userSockets.delete(userId);
  await setUserStatus(userId, "offline");
  return true;
}

function isSocketOnline(userId) {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}

/** 服务启动时将库内在线标记清零，避免重启后残留假在线 */
async function resetAllOfflineOnBoot() {
  try {
    const result = await prisma.user.updateMany({
      where: { status: "online" },
      data: { status: "offline" },
    });
    if (result.count > 0) {
      console.log("[Presence] Reset stale online users on boot:", result.count);
    }
  } catch (err) {
    console.error("[Presence] Boot reset failed:", err);
  }
}

module.exports = {
  trackConnect,
  trackDisconnect,
  forceOffline,
  isSocketOnline,
  resetAllOfflineOnBoot,
};
