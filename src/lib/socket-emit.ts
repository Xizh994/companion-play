import type { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __dazistar_io: SocketIOServer | undefined;
}

export function setSocketIO(io: SocketIOServer) {
  global.__dazistar_io = io;
}

export function getSocketIO(): SocketIOServer | undefined {
  return global.__dazistar_io;
}

export function emitNewMessage(conversationId: string, message: Record<string, unknown>) {
  const io = getSocketIO();
  if (!io) return;

  const payload = { ...message, conversationId };
  io.to(conversationId).emit("new_message", payload);

  const toId = message.toId;
  if (typeof toId === "string" && toId) {
    io.to(`user:${toId}`).emit("new_message", payload);
  }
}
