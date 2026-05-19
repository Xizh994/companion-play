const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

// 加载环境变量
try {
  require("dotenv").config();
} catch (e) {
  // dotenv 可能没安装，忽略
}

function parsePort() {
  const portArgIdx = process.argv.findIndex((a) => a === "--port" || a === "-p");
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  return parseInt(process.env.PORT || "3000", 10);
}

const dev = process.env.NODE_ENV !== "production";
const port = parsePort();
const app = next({ dev });
const handle = app.getRequestHandler();

// 调试：打印环境变量
console.log("[Server] NODE_ENV:", process.env.NODE_ENV);
console.log("[Server] ALIYUN_ACCESS_KEY_ID:", process.env.ALIYUN_ACCESS_KEY_ID ? "已设置" : "未设置");
console.log("[Server] ALIYUN_DM_ACCOUNT_NAME:", process.env.ALIYUN_DM_ACCOUNT_NAME ? "已设置" : "未设置");

app.prepare().then(async () => {
  const { resetAllOfflineOnBoot } = require("./server/presence.cjs");
  await resetAllOfflineOnBoot();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
  });

  // 供 API Routes 推送实时消息（与 src/lib/socket-emit.ts 共用 global）
  global.__dazistar_io = io;

  const { trackConnect, trackDisconnect } = require("./server/presence.cjs");

  io.on("connection", (socket) => {
    console.log("[Socket] Connected:", socket.id);

    socket.on("auth", (userId) => {
      if (!userId || typeof userId !== "string") return;
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      trackConnect(io, userId, socket.id).catch(console.error);
      console.log("[Socket] Auth:", userId);
    });

    socket.on("join_lobby", () => {
      socket.join("lobby");
    });

    socket.on("leave_lobby", () => {
      socket.leave("lobby");
    });

    socket.on("join_chat", (roomId) => {
      socket.join(roomId);
    });

    socket.on("private_message", (data) => {
      if (data.roomId) {
        io.to(data.roomId).emit("new_message", data.message);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        trackDisconnect(io, userId, socket.id).catch(console.error);
      }
      console.log("[Socket] Disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});