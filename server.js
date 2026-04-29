const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("[Socket] Connected:", socket.id);

    socket.on("auth", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;
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
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
      }
      console.log("[Socket] Disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});