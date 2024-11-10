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

    // Add sentiment interpretation
    if (results.sentiment) {
        const sentimentScore = results.sentiment.document.score;
        interpretations.push({
            tone: 'Sentiment',
            score: (sentimentScore + 1) / 2, // Convert from [-1,1] to [0,1]
            advice: sentimentScore > 0.3
                ? 'Your tone is positive and engaging.'
                : sentimentScore < -0.3
                    ? 'Consider using more positive language.'
                    : 'Your tone is neutral and balanced.'
        });
    }

    // Add emotion interpretations
    if (results.emotion && results.emotion.document.emotion) {
        const emotions = results.emotion.document.emotion;
        Object.entries(emotions).forEach(([emotion, score]) => {
            let advice = '';
            switch (emotion) {
                case 'joy':
                    advice = score > 0.5 ? 'Your enthusiasm comes through well.' : 'Consider adding more positive elements.';
                    break;
                case 'confidence':
                    advice = score > 0.5 ? 'You project strong confidence.' : 'Consider using more assertive language.';
                    break;
                case 'analytical':
                    advice = score > 0.5 ? 'Your analytical approach is clear.' : 'Consider adding more logical structure.';
                    break;
                default:
                    advice = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} level: ${Math.round(score * 100)}%`;
            }

            interpretations.push({
                tone: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                score: score,
                advice: advice
            });
        });
    }

    // Add formality assessment based on language features
    const formalityScore = calculateFormality(results);
    interpretations.push({
        tone: 'Formality',
        score: formalityScore,
        advice: formalityScore > 0.5
            ? 'Your tone is formal and professional.'
            : 'Your tone is casual and conversational.'
    });

    return {
        raw_analysis: results,
        interpretation: interpretations
    };
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