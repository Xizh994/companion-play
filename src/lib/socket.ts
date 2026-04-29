import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
  });

  const onlineUsers = new Map<string, string>(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // 用户上线，注册身份
    socket.on("auth", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;
      console.log(`[Socket] User authenticated: ${userId}`);
    });

    // 加入匹配大厅
    socket.on("join_lobby", () => {
      socket.join("lobby");
      const users = Array.from(onlineUsers.entries())
        .filter(([uid]) => uid !== socket.data.userId);
      socket.emit("lobby_users", users);
    });

    // 离开匹配大厅
    socket.on("leave_lobby", () => {
      socket.leave("lobby");
    });

    // 加入私聊房间 (roomId = sorted userId pair)
    socket.on("join_chat", (roomId: string) => {
      socket.join(roomId);
      console.log(`[Socket] ${socket.data.userId} joined room ${roomId}`);
    });

    // 私聊消息
    socket.on("private_message", (data: { roomId: string; message: any }) => {
      io?.to(data.roomId).emit("new_message", data.message);
    });

    // 大厅广播消息
    socket.on("lobby_message", (data: any) => {
      io?.to("lobby").emit("lobby_broadcast", data);
    });

    socket.on("disconnect", () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        io?.to("lobby").emit("user_offline", socket.data.userId);
      }
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
}