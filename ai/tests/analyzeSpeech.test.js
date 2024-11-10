const analyzeSpeech = require('../services/speechAnalyzer').analyzeSpeech;

describe('Speech Analysis Tests', () => {
    // Basic functionality tests
    test('detects "you know" filler phrase', () => {
        const words = [
            { text: 'You', start: 100, end: 300, confidence: 0.9 },
            { text: 'know', start: 300, end: 500, confidence: 0.95 },
            { text: 'that', start: 500, end: 700, confidence: 0.98 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toContainEqual({
            word: 'you know',
            start_time: 0.1,
            end_time: 0.5,
            type: 'filler phrase'
        });
    });

    test('detects single-word fillers like "um"', () => {
        const words = [
            { text: 'um', start: 100, end: 300, confidence: 0.9 },
            { text: 'hello', start: 300, end: 500, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toContainEqual({
            word: 'um',
            start_time: 0.1,
            end_time: 0.3,
            type: 'filler word'
        });
    });

    // Complex scenarios
    test('handles multiple filler phrases in sequence', () => {
        const words = [
            { text: 'you', start: 100, end: 200, confidence: 0.9 },
            { text: 'know', start: 200, end: 300, confidence: 0.95 },
            { text: 'um', start: 300, end: 400, confidence: 0.9 },
            { text: 'you', start: 400, end: 500, confidence: 0.9 },
            { text: 'know', start: 500, end: 600, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(3); // Two "you know"s and one "um"
    });

    // Performance test
    test('handles large input efficiently', () => {
        const words = Array(1000).fill().map((_, i) => ({
            text: i % 2 === 0 ? 'you' : 'know',
            start: i * 100,
            end: (i + 1) * 100,
            confidence: 0.9
        }));

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(500); // 500 "you know" phrases
        expect(result.transcription).toBeTruthy();
    });

    // Context-aware detection
    test('distinguishes between filler "like" and proper usage', () => {
        const words = [
            { text: 'I', start: 0, end: 100, confidence: 0.95 },
            { text: 'like', start: 100, end: 200, confidence: 0.95 }, // High confidence, proper usage
            { text: 'pizza', start: 200, end: 300, confidence: 0.95 },
            { text: 'like', start: 400, end: 500, confidence: 0.7 }  // Low confidence, filler usage
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(1);
        expect(result.disfluencies[0].start_time).toBe(0.4);
    });
});
