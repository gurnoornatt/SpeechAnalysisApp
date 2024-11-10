const express = require('express');
const router = express.Router();
const { AssemblyAI } = require('assemblyai');

// Initialize AssemblyAI client with error handling
let client;
try {
    client = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY
    });
} catch (error) {
    console.error('Failed to initialize AssemblyAI client:', error);
    process.exit(1);
}

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

// Express route handler with error handling
router.post('/', async (req, res) => {
    try {
        const { audio_url } = req.body;

        if (!audio_url || typeof audio_url !== 'string') {
            return res.status(400).json({
                error: "Invalid audio_url",
                details: "Must provide a valid audio URL string"
            });
        }

        console.log('Processing audio URL:', audio_url);

        const transcript = await client.transcripts.create({
            audio_url: audio_url,
            language_code: 'en_us'
        });

        if (!transcript || !transcript.id) {
            throw new Error('Failed to create transcript');
        }

        console.log('Transcript created, ID:', transcript.id);

        let transcriptionResult;
        let attempts = 0;
        const maxAttempts = 30; // Maximum polling attempts

        while (attempts < maxAttempts) {
            try {
                transcriptionResult = await client.transcripts.get(transcript.id);

                if (transcriptionResult.status === 'completed') {
                    console.log('Transcription completed successfully');
                    break;
                } else if (transcriptionResult.status === 'error') {
                    throw new Error(`Transcription failed: ${transcriptionResult.error}`);
                }

                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Error polling transcript:', error);
                throw error;
            }
        }

        if (!transcriptionResult || attempts >= maxAttempts) {
            throw new Error('Transcription timed out');
        }

        const result = analyzeSpeech(transcriptionResult.words || []);
        res.json(result);

    } catch (error) {
        console.error('Route handler error:', error);
        res.status(500).json({
            error: 'Failed to process audio',
            details: error.message
        });
    }
});

// Export both the router and the analyzeSpeech function
module.exports = {
    router,
    analyzeSpeech
};