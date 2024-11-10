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