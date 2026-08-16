

require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const parentRoutes = require('./routes/parentRoutes');
const classRoutes = require('./routes/classRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const messageRoutes = require('./routes/messageRoutes'); 
const { initializeSocket } = require('./socket/socket');
const FeeStructure = require('./models/FeeStructure'); 
const StudentFee = require('./models/StudentFee');     
const Payment = require('./models/Payment');           
const feeRoutes = require('./routes/feeRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const registrarRoutes = require('./routes/registrarRoutes');
const financeOfficerRoutes = require('./routes/financeOfficerRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const worksheetRoutes = require('./routes/worksheetRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminReport = require('./routes/adminReport');

const reportCardRoutes = require('./routes/reportCardRoutes');

connectDB();

const app = express();
const PORT = process.env.PORT || 7000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Update with frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// Attach Socket.io to app (for use in routes)
app.set('io', io);

// Initialize Socket.io handlers
initializeSocket(io);

// Middleware
app.use(express.json());
const path = require('path');
const fs = require('fs');
// Logger
app.use((req, res, next) => {
  console.log(`📝 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 📌 Routes
app.use(cors());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/messages', messageRoutes); 
app.use('/api/fees', feeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/registrar', registrarRoutes);
 app.use('/api/finance', financeOfficerRoutes);
 app.use('/api/announcements', announcementRoutes);
 app.use('/api/worksheets', worksheetRoutes);
 app.use('/api/payments', paymentRoutes);
 app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 app.use('/api/password-reset', passwordResetRoutes);
 app.use('/api/resources', resourceRoutes);
 app.use('/api/report-cards', reportCardRoutes);
app.use ('/api/adminReport',adminReport);
// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/screenshots');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created uploads/screenshots directory');
}

// Home route
app.get('/', (req, res) => {
  res.send('Hello World! 🚀 High School Portal with Real-time Messaging!');
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`✅ Socket.io is running on ws://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  // ✅ Import the scheduler (starts cron jobs automatically)
require('./scheduler');
console.log('🕐 Scheduler started!');
});