require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/cia', require('./routes/ciaRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'College Management API is running 🚀', time: new Date() });
});

// ── Test email route ──────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('./services/emailService');
    await sendEmail({
      to: 'anandbalaji.aids23@mamcet.com',
      subject: 'EduManage Test Email',
      html: '<h1>✅ Email is working!</h1><p>EduManage email service is configured correctly.</p>'
    });
    res.json({ success: true, message: 'Email sent! Check your inbox.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health\n`);
});