import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = 3001;
const STREAM_INTERVAL_MS = 50;
const MAX_VALUE = 1e9;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

app.get('/', (_req, res) => {
    res.send('<p>Bin There, Done That data server. Connect with Socket.IO to receive a number stream.</p>');
});

io.on('connection', (socket) => {
    console.log(`client connected: ${socket.id}`);

    const interval = setInterval(() => {
        const n = Math.floor(Math.random() * MAX_VALUE);
        socket.emit('number', n);
    }, STREAM_INTERVAL_MS);

    socket.on('disconnect', () => {
        clearInterval(interval);
        console.log(`client disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}/`);
});
