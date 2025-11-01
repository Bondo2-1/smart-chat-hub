import { Server } from "socket.io";

let io;

export function initSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      // Listen for message events from clients
      socket.on("send-message", (msg) => {
        // console.log("Message received:", msg);
        // Broadcast to everyone else except sender
        socket.broadcast.emit("receive-message", msg);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
