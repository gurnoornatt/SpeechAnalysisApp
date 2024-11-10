const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

let analyzer;

try {
    analyzer = new NaturalLanguageUnderstandingV1({
        version: '2022-04-07',
        authenticator: new IamAuthenticator({
            apikey: process.env.IBM_WATSON_API_KEY,
        }),
        serviceUrl: process.env.IBM_WATSON_URL,
        features: {
            sentiment: {},
            emotion: {},
            language: {},
            tone: {}
        }
    });
} catch (error) {
    console.error('Failed to initialize IBM Watson NLU:', error);
}

async function analyzeTone(text) {
    if (!analyzer) {
        return {
            raw_tones: [],
            interpretation: [{
                tone: 'Service Unavailable',
                score: 0,
                advice: 'Tone analysis is currently unavailable.'
            }]
        };
    }

    try {
        const analyzeParams = {
            text: text,
            features: {
                sentiment: {},
                emotion: {},
                language: {}
            }
        };

        const analysis = await analyzer.analyze(analyzeParams);
        return interpretNLUResults(analysis.result);
    } catch (error) {
        console.error('Error analyzing text:', error);
        throw error;
    }
}

function interpretNLUResults(results) {
    const interpretations = [];
    const raw_tones = [];

    // Process emotions with enhanced logic
    if (results.emotion?.document?.emotion) {
        const emotions = results.emotion.document.emotion;
        Object.entries(emotions).forEach(([emotion, score]) => {
            raw_tones.push({ tone: emotion, score });

            if (score > 0.5) {
                const interpretation = {
                    tone: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                    score: score,
                    advice: generateAdvice(emotion, score)
                };
                interpretations.push(interpretation);
            }
        });
    }

    // Add technical tone detection
    if (results.keywords?.some(k => k.text === 'technical' && k.relevance > 0.7)) {
        interpretations.push({
            tone: 'Technical',
            score: 0.9,
            advice: 'Technical language detected. Consider your audience\'s expertise level.'
        });
    }

    // Enhanced formality detection
    const formalityScore = calculateFormality(results);
    interpretations.push({
        tone: 'Formality',
        score: formalityScore,
        advice: formalityScore > 0.7
            ? 'Your tone is highly formal and professional.'
            : formalityScore > 0.4
                ? 'Your tone is moderately formal.'
                : 'Your tone is casual and conversational.'
    });

    return {
        raw_tones,
        interpretation: interpretations
    };
}

function generateAdvice(emotion, score) {
    const adviceMap = {
        joy: {
            high: 'Your enthusiasm comes through strongly.',
            medium: 'Your positive tone is appropriate.',
            low: 'Consider adding more positive elements.'
        },
        anger: {
            high: 'Your tone expresses strong disagreement.',
            medium: 'Consider tempering emotional language.',
            low: 'Your tone is measured and controlled.'
        },
        analytical: {
            high: 'Your analytical approach is very clear.',
            medium: 'Good use of analytical language.',
            low: 'Consider adding more analytical elements.'
        },
        confident: {
            high: 'Your confidence comes through clearly.',
            medium: 'Good balance of confidence.',
            low: 'Consider using more assertive language.'
        }
    };

    const level = score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low';
    return adviceMap[emotion]?.[level] || `${emotion} level: ${Math.round(score * 100)}%`;
}

function calculateFormality(results) {
    // Implement formality calculation based on various NLU features
    let formalityScore = 0.5; // Default neutral score

    // Adjust based on language features
    if (results.language) {
        // More formal languages tend to have more complex sentence structures
        // and professional terminology
        formalityScore += 0.1; // Adjust based on actual analysis
    }

    return Math.min(Math.max(formalityScore, 0), 1); // Ensure score is between 0 and 1
}

module.exports = { analyzeTone }; 