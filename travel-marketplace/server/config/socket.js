const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

function setupSocket(server, corsOptions) {
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authenticate socket connections using the JWT cookie
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole } = socket;

    // Join a personal room for receiving messages
    if (userRole === 'AGENCY') {
      socket.join(`agency_${userId}`);
    } else {
      socket.join(`user_${userId}`);
    }

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // ── Trip collaboration rooms ──
    socket.on('join_trip', (tripId) => {
      socket.join(`trip_${tripId}`);
    });

    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        role: userRole
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
        role: userRole
      });
    });

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    });
  });

  return io;
}

module.exports = setupSocket;
