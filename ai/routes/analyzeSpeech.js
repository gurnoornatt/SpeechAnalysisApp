const express = require('express');
const router = express.Router();
const { AssemblyAI } = require('assemblyai');

// Replace with your AssemblyAI API key in the .env file
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

const client = new AssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY, // Ensure this is set in your .env file
});

/**
 * POST /analyze-speech
 * Body Parameters:
 * - audio_url: URL to the audio file
 */
router.post('/', async (req, res) => {
    try {
        const { audio_url } = req.body;

        // Validate input
        if (!audio_url || typeof audio_url !== 'string') {
            return res.status(400).json({ error: "Invalid 'audio_url'. Must be a non-empty string." });
        }

        // Submit transcription request to AssemblyAI
        const transcript = await client.transcripts.transcribe({
            audio_url: audio_url,
            disfluencies: true,
        });

        console.log(`Submitted transcription job. ID: ${transcript.id}`);

        // Poll for transcription completion
        let transcriptionResult;
        while (true) {
            transcriptionResult = await client.transcripts.get(transcript.id);
            if (transcriptionResult.status === 'completed') {
                console.log('Transcription completed.');
                break;
            } else if (transcriptionResult.status === 'error') {
                console.error('Transcription failed:', transcriptionResult.error);
                return res.status(500).json({ error: 'Transcription failed.', details: transcriptionResult.error });
            }
            // Wait for a few seconds before next poll
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        // Extract disfluencies
        const disfluencies = transcriptionResult.words
            .filter(word => word.disfluency === true)
            .map(word => ({
                word: word.text,
                start_time: word.start_time,
                end_time: word.end_time,
            }));

        // Format the response
        const formattedResponse = {
            transcription: transcriptionResult.text,
            disfluencies: disfluencies,
        };

        res.json(formattedResponse);
    } catch (error) {
        console.error('Error analyzing speech:', error.message);
        res.status(500).json({ error: 'An error occurred while analyzing speech.' });
    }
});

module.exports = router;
