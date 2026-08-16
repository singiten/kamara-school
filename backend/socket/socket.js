// socket/socket.js - COMPLETE FIXED

const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Store connected users { userId: socketId }
const connectedUsers = {};

const initializeSocket = (io) => {
  // Socket middleware: Authenticate user
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;
      socket.userRole = decoded.user.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Store user connection
    connectedUsers[socket.userId] = socket.id;
    io.emit('users:online', Object.keys(connectedUsers));

    // ============================================
    // 📌 SEND MESSAGE
    // ============================================
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content } = data;

        // 1️⃣ Prevent self-messaging
        if (receiverId === socket.userId) {
          socket.emit('message:error', { error: 'You cannot send a message to yourself' });
          return;
        }

        // 2️⃣ Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('message:error', { error: 'User not found' });
          return;
        }

        // 3️⃣ Validate role-based chat permissions
        const sender = await User.findById(socket.userId);
        
        const allowedRoles = {
          admin: ['admin', 'teacher', 'parent', 'student'],
          teacher: ['admin', 'parent', 'student'],
          parent: ['admin', 'teacher'],
          student: ['admin', 'teacher'],
        };

        if (!allowedRoles[sender.role]?.includes(receiver.role)) {
          socket.emit('message:error', { 
            error: `You are not allowed to chat with ${receiver.role}s` 
          });
          return;
        }

        // 4️⃣ Create and save message
        const message = new Message({
          senderId: socket.userId,
          receiverId,
          content,
        });
        await message.save();

        // 5️⃣ Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name email role')
          .populate('receiverId', 'name email role');

        // 6️⃣ Emit to sender (confirmation)
        socket.emit('message:sent', populatedMessage);

        // 7️⃣ Emit to receiver if online
        const receiverSocketId = connectedUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:received', populatedMessage);
          
          // Send unread count update to receiver
          const unreadCount = await Message.countDocuments({
            receiverId,
            isRead: false,
          });
          io.to(receiverSocketId).emit('message:unread', { count: unreadCount });
        }

        // 8️⃣ Update sender's unread count
        const senderUnreadCount = await Message.countDocuments({
          receiverId: socket.userId,
          isRead: false,
        });
        socket.emit('message:unread', { count: senderUnreadCount });

        // 9️⃣ Broadcast to all that a message was sent (for notification badges)
        io.emit('message:new', {
          senderId: socket.userId,
          receiverId: receiverId,
          content: content,
          senderName: sender.name,
          receiverName: receiver.name,
        });

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // ============================================
    // 📌 MARK MESSAGES AS READ
    // ============================================
    socket.on('message:read', async (data) => {
      try {
        const { senderId } = data;
        
        // Mark all messages from sender as read
        const result = await Message.updateMany(
          {
            senderId,
            receiverId: socket.userId,
            isRead: false,
          },
          {
            $set: { isRead: true, readAt: new Date() },
          }
        );

        // Get updated unread count
        const unreadCount = await Message.countDocuments({
          receiverId: socket.userId,
          isRead: false,
        });

        // Notify sender that messages were read
        const senderSocketId = connectedUsers[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:read', { 
            userId: socket.userId,
            count: unreadCount 
          });
        }

        // Update unread count for receiver
        socket.emit('message:unread', { count: unreadCount });

      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // ============================================
    // 📌 MARK ALL MESSAGES AS READ
    // ============================================
    socket.on('message:read-all', async () => {
      try {
        const result = await Message.updateMany(
          {
            receiverId: socket.userId,
            isRead: false,
          },
          {
            $set: { isRead: true, readAt: new Date() },
          }
        );

        const unreadCount = await Message.countDocuments({
          receiverId: socket.userId,
          isRead: false,
        });

        socket.emit('message:unread', { count: unreadCount });

      } catch (error) {
        console.error('❌ Error marking all as read:', error);
      }
    });

    // ============================================
    // 📌 TYPING INDICATOR
    // ============================================
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      const receiverSocketId = connectedUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', {
          userId: socket.userId,
          userName: socket.userName || 'Someone',
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      const receiverSocketId = connectedUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', {
          userId: socket.userId,
        });
      }
    });

    // ============================================
    // 📌 GET USER NAME (for typing indicator)
    // ============================================
    socket.on('user:get-name', async () => {
      try {
        const user = await User.findById(socket.userId);
        if (user) {
          socket.userName = user.name;
          socket.emit('user:name', { name: user.name });
        }
      } catch (error) {
        console.error('❌ Error getting user name:', error);
      }
    });

    // ============================================
    // 📌 DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      delete connectedUsers[socket.userId];
      io.emit('users:online', Object.keys(connectedUsers));
    });
  });

  return connectedUsers;
};

module.exports = { initializeSocket, connectedUsers };