const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

const studyMaterialRoutes = require('./routes/studyMaterials');
const managementRoutes = require('./routes/management');
const moduleRoutes = require('./routes/modules');
const kuppiSessionRoutes = require('./routes/kuppiSessions');
const { ensureDataStore } = require('./utils/dataStore');

dotenv.config();
ensureDataStore();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Route
app.get('/', (_req, res) => {
  res.json({
    name: 'Unibridge Study Materials API',
    status: 'ok',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/kuppi-sessions', kuppiSessionRoutes);

// Error Handler
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Unibridge API running on port ${PORT}`);
});

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB Connected');
    })
    .catch((error) => {
      console.error('⚠️ MongoDB Connection Error:', error.message);
    });
}