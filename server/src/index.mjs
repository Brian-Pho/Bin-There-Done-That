import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

/** Milliseconds between emitted numbers (1 value per second). */
const INTERVAL_MS = 1000;
/** Inclusive-exclusive upper bound for generated nonnegative integers. */
const MAX_VALUE = 1_000_000_000;
const PORT = Number(process.env.PORT) || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.get("/", (_req, res) => {
  res.send(
    "<p>Bin There, Done That data server. Connect with Socket.IO to receive a continuous number stream.</p>",
  );
});

io.on("connection", (socket) => {
  console.log(`client connected: ${socket.id}`);

  const timer = setInterval(() => {
    const n = Math.floor(Math.random() * MAX_VALUE);
    socket.emit("number", n);
  }, INTERVAL_MS);

  socket.on("disconnect", (reason) => {
    clearInterval(timer);
    console.log(`client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}/`);
});
