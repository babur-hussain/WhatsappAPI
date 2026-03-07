import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { auth } from '../config/firebase';
import prisma from '../config/database';

let io: Server;

export const initSocketServer = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST']
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify Firebase token
            const decodedToken = await auth.verifyIdToken(token);
            
            // Find user in database to get factoryId
            const user = await prisma.user.findUnique({
                where: { firebaseUid: decodedToken.uid }
            });

            if (!user || (!user.factoryId && user.role !== 'SUPER_ADMIN')) {
                return next(new Error('Authentication error: User or Factory not found'));
            }

            socket.data.factoryId = user.factoryId;
            return next();
        } catch (err) {
            console.error('Socket Auth Error:', err);
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
