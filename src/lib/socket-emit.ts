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

export function emitNewMessage(roomId: string, message: Record<string, unknown>) {
  getSocketIO()?.to(roomId).emit("new_message", message);
}
