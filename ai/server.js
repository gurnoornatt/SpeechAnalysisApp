// Move dotenv.config() to the very top, before any other code
require('dotenv').config();

// Then your imports
const express = require('express');
const cors = require('cors');
const path = require('path');
const { router: analyzeSpeechRouter } = require('./routes/analyzeSpeech');
const analyzeToneRouter = require('./routes/analyzeTone');

// Add detailed debugging at the very top
console.log('=====================================');
console.log('Server Startup Diagnostics');
console.log('=====================================');
console.log('1. Current Directory:', process.cwd());
console.log('2. Env File Path:', path.resolve(process.cwd(), '.env'));
console.log('3. AssemblyAI Key Status:', process.env.ASSEMBLYAI_API_KEY ? 'Present' : 'Missing');
console.log('4. Key Length:', process.env.ASSEMBLYAI_API_KEY?.length);
console.log('=====================================');

// Debug environment variables
console.log('Environment variables loaded:', {
    ASSEMBLYAI_KEY: process.env.ASSEMBLYAI_API_KEY ? 'Present' : 'Missing',
    IBM_WATSON_KEY: process.env.IBM_WATSON_API_KEY ? 'Present' : 'Missing',
    IBM_WATSON_URL: process.env.IBM_WATSON_URL ? 'Present' : 'Missing'
});

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Fix: Use the router objects correctly
app.use('/analyze-speech', analyzeSpeechRouter);
app.use('/analyze-tone', analyzeToneRouter);

// Health Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            assemblyAI: process.env.ASSEMBLYAI_API_KEY ? 'configured' : 'missing'
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Speech Analysis App Backend is Running.');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
