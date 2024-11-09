// Import dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import routes
const generateScriptRoute = require('./routes/generateScript');
const analyzeSpeechRoute = require('./routes/analyzeSpeech');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to all routes
app.use(limiter);

// Routes
app.use('/generate-script', generateScriptRoute);
app.use('/analyze-speech', analyzeSpeechRoute);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Speech Analysis App Backend is Running.');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Environment variable validation
if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}

if (!process.env.ASSEMBLYAI_API_KEY) {
    console.error('ASSEMBLYAI_API_KEY is not set in environment variables');
    process.exit(1);
}
