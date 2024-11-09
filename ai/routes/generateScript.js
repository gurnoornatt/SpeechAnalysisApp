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

        // Call OpenAI API using chat completions
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
            top_p: 1,
            n: 1
        });

        const script = response.data.choices[0].message.content.trim();

        // Respond with the generated script
        res.json({ script });
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code outside 2xx
            console.error('Error generating script:', error.response.status);
            console.error(error.response.data);
            res.status(error.response.status).json({ error: error.response.data.error.message });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            res.status(500).json({ error: 'No response received from OpenAI.' });
        } else {
            // Something happened in setting up the request
            console.error('Error setting up request:', error.message);
            res.status(500).json({ error: 'An error occurred while setting up the request.' });
        }
    }
});

module.exports = router;
