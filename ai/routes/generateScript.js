const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * POST /generate-script
 * Body Parameters:
 * - type: 'casual' or 'formal'
 * - topic: The topic of the script
 */
router.post('/', async (req, res) => {
    try {
        const { type, topic } = req.body;

        // Validate input
        if (!type || !['casual', 'formal'].includes(type)) {
            return res.status(400).json({ error: "Invalid 'type'. Must be 'casual' or 'formal'." });
        }

        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: "Invalid 'topic'. Must be a non-empty string." });
        }

        // Define the prompt based on type
        const prompt = `Write a ${type} script about ${topic}. It should be concise and suitable for a speech practice exercise.`;

        // Call OpenAI API
        const response = await openai.createCompletion({
            model: 'text-davinci-004', // GPT-4 model identifier; adjust if necessary
            prompt: prompt,
            max_tokens: 500, // Adjust based on desired script length
            temperature: 0.7, // Controls randomness; adjust as needed
            top_p: 1,
            n: 1,
            stop: null,
        });

        const script = response.data.choices[0].text.trim();

        // Respond with the generated script
        res.json({ script });
    } catch (error) {
        console.error('Error generating script:', error.message);
        res.status(500).json({ error: 'An error occurred while generating the script.' });
    }
});

module.exports = router;
