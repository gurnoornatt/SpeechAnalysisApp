const express = require('express');
const router = express.Router();
const { AssemblyAI } = require('assemblyai');
const { analyzeTone } = require('../services/toneAnalyzer');

let client = null;

// Enhanced error types
class AnalysisError extends Error {
    constructor(message, type, details = {}) {
        super(message);
        this.type = type;
        this.details = details;
    }
}

// Validation function
const validateAudioUrl = (url) => {
    if (!url || typeof url !== 'string') {
        throw new AnalysisError(
            'Invalid audio URL',
            'VALIDATION_ERROR',
            { provided: typeof url }
        );
    }
    try {
        new URL(url);
    } catch {
        throw new AnalysisError(
            'Malformed URL',
            'VALIDATION_ERROR',
            { url }
        );
    }
};

router.post('/', async (req, res) => {
    try {
        validateAudioUrl(req.body.audio_url);

        const client = initializeClient();
        const startTime = Date.now();
        const TIMEOUT = 30 * 1000; // 30 seconds for testing
        let pollCount = 0;

        // Create transcript
        const transcript = await client.transcripts.create({
            audio_url: req.body.audio_url
        });

        while (true) {
            // Check timeout first
            if (Date.now() - startTime > TIMEOUT || pollCount >= 30) {
                return res.status(504).json({
                    error: 'Transcription timed out',
                    type: 'TIMEOUT_ERROR',
                    details: { elapsed: Date.now() - startTime }
                });
            }

            try {
                const result = await client.transcripts.get(transcript.id);
                pollCount++;

                if (result.status === 'completed' && result.words) {
                    const speechAnalysis = analyzeSpeech(result.words);
                    const toneAnalysis = await analyzeTone(speechAnalysis.transcription);

                    return res.status(200).json({
                        transcription: speechAnalysis.transcription,
                        disfluencies: speechAnalysis.disfluencies,
                        tone_analysis: toneAnalysis,
                        metadata: {
                            processingTime: Date.now() - startTime,
                            wordCount: result.words.length || 0
                        }
                    });
                }

                if (result.status === 'error') {
                    throw new AnalysisError('Transcription failed', 'TRANSCRIPTION_ERROR');
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                throw new AnalysisError(
                    'Failed to poll transcript status',
                    'TRANSCRIPTION_ERROR',
                    { original: error.message }
                );
            }
        }
    } catch (error) {
        console.error('Analysis error:', error);

        const statusCode = {
            VALIDATION_ERROR: 400,
            TRANSCRIPTION_ERROR: 500,
            TIMEOUT_ERROR: 504
        }[error.type] || 500;

        return res.status(statusCode).json({
            error: error.message,
            type: error.type,
            details: error.details
        });
    }
});

// Add this test route right after the main route
router.post('/test', async (req, res) => {
    try {
        const { scenario } = req.body;

        switch (scenario) {
            case 'valid':
                return res.status(200).json({
                    transcription: 'Test transcription',
                    disfluencies: [],
                    tone_analysis: { tone: 'neutral' },
                    metadata: {
                        processingTime: 1000,
                        wordCount: 2
                    }
                });

            case 'timeout':
                return res.status(504).json({
                    error: 'Transcription timed out',
                    type: 'TIMEOUT_ERROR',
                    details: { elapsed: 30000 }
                });

            default:
                return res.status(500).json({
                    error: 'Unknown scenario',
                    type: 'TRANSCRIPTION_ERROR'
                });
        }
    } catch (error) {
        return res.status(500).json({
            error: error.message,
            type: 'TRANSCRIPTION_ERROR'
        });
    }
});

// Add this route to verify API key
router.get('/verify-key', (req, res) => {
    try {
        const keyStatus = {
            keyPresent: !!process.env.ASSEMBLYAI_API_KEY,
            keyLength: process.env.ASSEMBLYAI_API_KEY?.length,
            keyPrefix: process.env.ASSEMBLYAI_API_KEY?.slice(0, 5) + '...',
            timestamp: new Date().toISOString()
        };
        res.json(keyStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify key' });
    }
});

// Define the speech analysis function with error handling
function analyzeSpeech(words) {
    try {
        // Validate input
        if (!Array.isArray(words)) {
            console.error('Invalid input: words must be an array');
            return { transcription: '', disfluencies: [] };
        }

        const fillerPhrases = ["you know", "i mean"];
        const fillerWords = ["um", "uh", "er", "ah", "like"];
        let transcription = "";
        const disfluencies = [];
        const n = words.length;

        // Helper function to clean word text
        const cleanText = (text) => {
            try {
                // Improved text cleaning
                return text.replace(/[.,!?;:]+$/, '')
                    .replace(/^[.,!?;:]+/, '')
                    .toLowerCase()
                    .trim();
            } catch (error) {
                console.error('Error cleaning text:', error);
                return text ? text.toLowerCase().trim() : '';
            }
        };

        // Build transcription with improved spacing
        for (let i = 0; i < n; i++) {
            try {
                const currentWord = words[i]?.text || '';
                const previousWord = i > 0 ? (words[i - 1]?.text || '') : "";

                // Improved spacing around punctuation
                if (/^[.,!?;:]+/.test(currentWord)) {
                    transcription += currentWord;
                } else if (i === 0) {
                    transcription += currentWord;
                } else {
                    transcription += /[.,!?;:]+$/.test(previousWord) ? ' ' + currentWord : ' ' + currentWord;
                }
            } catch (error) {
                console.error('Error building transcription at index', i, ':', error);
                continue;
            }
        }

        // Detect disfluencies with error handling
        let i = 0;
        while (i < n) {
            try {
                let matched = false;

                // Check for filler phrases
                for (const phrase of fillerPhrases) {
                    const phraseWords = phrase.split(' ');
                    const phraseLength = phraseWords.length;

                    if (i + phraseLength <= n) {
                        let isMatch = true;
                        for (let j = 0; j < phraseLength; j++) {
                            const word = words[i + j];
                            if (!word || !word.text) {
                                isMatch = false;
                                break;
                            }
                            const wordText = cleanText(word.text.replace(/,$/, '')); // Remove trailing comma

                            if (wordText !== phraseWords[j]) {
                                isMatch = false;
                                break;
                            }
                        }

                        if (isMatch) {
                            const startWord = words[i];
                            const endWord = words[i + phraseLength - 1];

                            if (startWord?.start != null && endWord?.end != null) {
                                disfluencies.push({
                                    word: phrase,
                                    start_time: Math.round((startWord.start / 1000) * 10) / 10,
                                    end_time: Math.round((endWord.end / 1000) * 10) / 10,
                                    type: "filler phrase"
                                });
                            }
                            i += phraseLength;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    const word = words[i];
                    if (word && word.text) {
                        const currentWordClean = cleanText(word.text.replace(/,$/, '')); // Remove trailing comma

                        if (fillerWords.includes(currentWordClean)) {
                            if (currentWordClean === "like") {
                                const confidenceThreshold = 0.8;
                                if (word.confidence < confidenceThreshold) {
                                    if (word.start != null && word.end != null) {
                                        disfluencies.push({
                                            word: currentWordClean,
                                            start_time: Math.round((word.start / 1000) * 10) / 10,
                                            end_time: Math.round((word.end / 1000) * 10) / 10,
                                            type: "filler word"
                                        });
                                    }
                                }
                            } else {
                                if (word.start != null && word.end != null) {
                                    disfluencies.push({
                                        word: currentWordClean,
                                        start_time: Math.round((word.start / 1000) * 10) / 10,
                                        end_time: Math.round((word.end / 1000) * 10) / 10,
                                        type: "filler word"
                                    });
                                }
                            }
                        }
                    }
                    i++;
                }
            } catch (error) {
                console.error('Error processing word at index', i, ':', error);
                i++;
            }
        }

        return {
            transcription: transcription || '',
            disfluencies: disfluencies || []
        };
    } catch (error) {
        console.error('Error in analyzeSpeech:', error);
        return {
            transcription: '',
            disfluencies: []
        };
    }
}

// Export both the router and the analyzeSpeech function
module.exports = {
    router,
    analyzeSpeech
};

const initializeClient = () => {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('AssemblyAI API key not found');
    }
    return new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY
    });
};