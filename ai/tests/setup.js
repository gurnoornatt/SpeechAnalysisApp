require('dotenv').config({ path: '.env.test' });

jest.mock('ibm-watson/natural-language-understanding/v1', () => {
    return class MockNLU {
        analyze(params) {
            const text = params.text.toLowerCase();

            // Basic tone detection logic
            const result = {
                sentiment: { document: { score: 0.8 } },
                emotion: {
                    document: {
                        emotion: {
                            joy: text.includes('thrilled') || text.includes('wonderful') ? 0.9 : 0.2,
                            anger: text.includes('furious') || text.includes('unacceptable') ? 0.8 : 0.1,
                            sadness: text.includes('disappointment') ? 0.7 : 0.1
                        }
                    }
                },
                language: 'en',
                keywords: [
                    {
                        text: 'formal',
                        relevance: text.includes('formally') ? 0.9 : 0.2
                    }
                ]
            };

            return Promise.resolve({ result });
        }
    };
}); 