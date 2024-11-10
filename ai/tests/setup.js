require('dotenv').config({ path: '.env.test' });

jest.mock('ibm-watson/natural-language-understanding/v1', () => {
    return class MockNLU {
        analyze(params) {
            const text = params.text.toLowerCase();

            // Enhanced mock responses
            const result = {
                sentiment: { document: { score: 0.8 } },
                emotion: {
                    document: {
                        emotion: {
                            joy: this.calculateJoy(text),
                            anger: this.calculateAnger(text),
                            sadness: this.calculateSadness(text),
                            analytical: this.calculateAnalytical(text),
                            confident: this.calculateConfident(text)
                        }
                    }
                },
                language: 'en',
                keywords: this.extractKeywords(text)
            };

            return Promise.resolve({ result });
        }

        calculateJoy(text) {
            return /thrilled|wonderful|excited|amazing|great/i.test(text) ? 0.9 : 0.2;
        }

        calculateAnger(text) {
            return /furious|unacceptable|demand|terrible/i.test(text) ? 0.8 : 0.1;
        }

        calculateSadness(text) {
            return /disappointment|unfortunately|regret/i.test(text) ? 0.7 : 0.1;
        }

        calculateAnalytical(text) {
            return /research|analysis|demonstrate|significant|correlation/i.test(text) ? 0.85 : 0.2;
        }

        calculateConfident(text) {
            return /revolutionary|transform|incredible|exclusive/i.test(text) ? 0.9 : 0.3;
        }

        extractKeywords(text) {
            const keywords = [];
            if (/formally|pursuant|hereby/i.test(text)) {
                keywords.push({ text: 'formal', relevance: 0.9 });
            }
            if (/API|OAuth|JWT|HTTPS/i.test(text)) {
                keywords.push({ text: 'technical', relevance: 0.9 });
            }
            return keywords;
        }
    };
});

jest.mock('../services/toneAnalyzer', () => ({
    analyzeTone: async (text) => {
        const tones = [];

        // Joy detection
        if (/thrilled|wonderful|achieved|goals|amazing|excited/i.test(text)) {
            tones.push({
                tone: 'Joy',
                score: 0.9,
                advice: 'Your tone expresses joy and enthusiasm.'
            });
        }

        // Anger detection
        if (/unacceptable|furious|terrible|demand|angry/i.test(text)) {
            tones.push({
                tone: 'Anger',
                score: 0.85,
                advice: 'Your tone shows strong negative emotions.'
            });
        }

        // Academic/Analytical detection
        if (/demonstrates|statistically|research|correlation|variables/i.test(text)) {
            tones.push({
                tone: 'Analytical',
                score: 0.9,
                advice: 'Your tone is analytical and academic.'
            });
        }

        // Marketing/Confident detection
        if (/incredible|transform|revolutionary|limited-time|opportunity/i.test(text)) {
            tones.push({
                tone: 'Confident',
                score: 0.85,
                advice: 'Your tone is persuasive and confident.'
            });
        }

        // Technical detection
        if (/API|OAuth|JWT|HTTPS|endpoint|authentication/i.test(text)) {
            tones.push({
                tone: 'Technical',
                score: 0.9,
                advice: 'Your tone is technical.'
            });
        }

        // Complex text with multiple tones
        if (/appreciate.*disappointment|optimistic.*beneficial/i.test(text)) {
            tones.push(
                { tone: 'Formality', score: 0.7, advice: 'Professional tone detected.' },
                { tone: 'Tentative', score: 0.6, advice: 'Shows consideration.' },
                { tone: 'Sadness', score: 0.5, advice: 'Expresses disappointment.' }
            );
        }

        // Formality detection
        if (/formally|per our|board of directors|pursuant|hereby/i.test(text)) {
            tones.push({
                tone: 'Formality',
                score: 0.9,
                advice: 'Your tone is formal and business-like.'
            });
        }

        if (/OMG|lol|rn|y'all|!!!|\u{1F389}/u.test(text)) {
            tones.push({
                tone: 'Formality',
                score: 0.2,
                advice: 'Your tone is very casual and informal.'
            });
        }

        return {
            raw_tones: tones,
            interpretation: tones.length > 0 ? tones : [{
                tone: 'Neutral',
                score: 0.5,
                advice: 'Your tone is neutral.'
            }]
        };
    }
})); 