const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate Environment before boot
const { validateEnv } = require('./config/env');
validateEnv();

// Ensure demo screenshots exist
const { ensureDemoScreenshots } = require('./utils/demoGenerator');
ensureDemoScreenshots();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to Database
connectDB();

const app = express();

// 1. Secure HTTP Headers using Helmet
app.use(helmet());

// 2. Prevent NoSQL Query Injection (sanitizes req.body, req.query, req.params)
app.use(mongoSanitize());

// 3. API Abuse Protection / Rate Limiting (Clamps requests to 300 per 15 mins for local work)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// 4. Secure CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsers with size constraints (prevents large payload attacks)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Static directory for screenshots
const path = require('path');
app.use('/screenshots', express.static(path.join(__dirname, 'public/screenshots')));

// Define API Routes
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));

// Server status environment configurations
app.get('/api/config', (req, res) => {
  const isApifySet = !!process.env.APIFY_TOKEN && process.env.APIFY_TOKEN.trim() !== '' && process.env.APIFY_TOKEN !== 'your_apify_api_token';
  const isGroqSet = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '' && process.env.GROQ_API_KEY !== 'your_groq_api_key';
  
  res.status(200).json({
    success: true,
    developmentMode: process.env.DEVELOPMENT_MODE === 'true' || process.env.NODE_ENV === 'development',
    groqEnabled: isGroqSet,
    apifyEnabled: isApifySet
  });
});

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', time: new Date() });
});

// Root fallback for routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Secure Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ClientScout Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`Access API health at http://localhost:${PORT}/health`);
});
