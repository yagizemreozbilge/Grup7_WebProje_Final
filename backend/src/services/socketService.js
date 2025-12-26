const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      console.log(`User ${userId} connected via WebSocket`);

      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Join role-based rooms
      socket.join(`role:${socket.userRole}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });

      // Handle real-time attendance updates (for faculty)
      if (socket.userRole === 'faculty' || socket.userRole === 'admin') {
        socket.on('subscribe-attendance', (sessionId) => {
          socket.join(`attendance:${sessionId}`);
        });

        socket.on('unsubscribe-attendance', (sessionId) => {
          socket.leave(`attendance:${sessionId}`);
        });
      }

      // Handle sensor subscriptions (bonus)
      socket.on('subscribe-sensor', (sensorId) => {
        socket.join(`sensor:${sensorId}`);
      });

      socket.on('unsubscribe-sensor', (sensorId) => {
        socket.leave(`sensor:${sensorId}`);
      });
    });

    return this.io;
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', notification);
    }
  }

  // Broadcast notification to all users
  broadcastNotification(notification) {
    if (this.io) {
      this.io.emit('notification', notification);
    }
  }

  // Send notification to role-based room
  sendNotificationToRole(role, notification) {
    if (this.io) {
      this.io.to(`role:${role}`).emit('notification', notification);
    }
  }

  // Broadcast attendance update
  broadcastAttendanceUpdate(sessionId, update) {
    if (this.io) {
      this.io.to(`attendance:${sessionId}`).emit('attendance-update', update);
    }
  }

  // Broadcast sensor data
  broadcastSensorData(sensorId, data) {
    if (this.io) {
      this.io.to(`sensor:${sensorId}`).emit('sensor-data', data);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }
}

module.exports = new SocketService();

