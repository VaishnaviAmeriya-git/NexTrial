const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimit');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const trialRoutes = require('./routes/trialRoutes');
const regulatoryRoutes = require('./routes/regulatoryRoutes');
const participantRoutes = require('./routes/participantRoutes');
const visitRoutes = require('./routes/visitRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const mlRoutes = require('./routes/mlRoutes');
const interopRoutes = require('./routes/interopRoutes');
const alertRoutes = require('./routes/alertRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use('/api', globalLimiter);

// API Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/trials', trialRoutes);
app.use('/api/v1', regulatoryRoutes);
app.use('/api/v1', participantRoutes);
app.use('/api/v1', visitRoutes);
app.use('/api/v1', safetyRoutes);
app.use('/api/v1', qualityRoutes);
app.use('/api/v1', mlRoutes);
app.use('/api/v1', interopRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Central error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[NexTrial API] Running on http://localhost:${PORT}/api/v1`);
      console.log(`[NexTrial API] Health check at http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('[NexTrial API] Startup failed:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
