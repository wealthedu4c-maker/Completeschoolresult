require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const auditLogger = require('./middlewares/auditLogger');

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Audit logging
app.use('/api/', auditLogger);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/pins', require('./routes/pinRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/pin-requests', require('./routes/pinRequestRoutes')); // ✅ NEW
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});