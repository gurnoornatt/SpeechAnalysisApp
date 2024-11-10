// Import dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { router: analyzeSpeechRouter } = require('./routes/analyzeSpeech');
const analyzeToneRouter = require('./routes/analyzeTone');

// Load environment variables with debug info
console.log('Current working directory:', process.cwd());
console.log('Loading environment variables from:', path.resolve(process.cwd(), '.env'));
dotenv.config();

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
