import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';

let io: Server;

// Temporary mock secret for development. Replace with real JWT_SECRET later.
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const initSocketServer = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        try {
            // Mock authentication strategy for development 
            // where we pass the token and factoryId in auth payload
            const token = socket.handshake.auth.token;
            const factoryId = socket.handshake.auth.factoryId;

            if (token === 'test' && factoryId) {
                socket.data.factoryId = factoryId;
                return next();
            }

            // Real JWT Verification
            if (token && token !== 'test') {
                const decoded = verify(token, JWT_SECRET) as { factoryId: string };
                socket.data.factoryId = decoded.factoryId;
                return next();
            }

            return next(new Error('Authentication error'));
        } catch (err) {
            return next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const factoryId = socket.data.factoryId;

        // Join factory specific room
        if (factoryId) {
            const roomName = `factory:${factoryId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room ${roomName}`);
        }

        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} disconnected`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
