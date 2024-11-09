const { analyzeSpeech } = require('../routes/analyzeSpeech');

describe('Speech Analysis Tests', () => {
    // Basic functionality tests
    test('detects "you know" filler phrase', () => {
        const words = [
            { text: 'You', start: 100, end: 300, confidence: 0.9 },
            { text: 'know,', start: 300, end: 500, confidence: 0.95 },
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
            { text: 'um,', start: 100, end: 300, confidence: 0.9 },
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

    // Edge cases
    test('handles empty input array', () => {
        const result = analyzeSpeech([]);
        expect(result).toEqual({
            transcription: '',
            disfluencies: []
        });
    });

    test('handles null/undefined words', () => {
        const words = [
            null,
            { text: 'um', start: 100, end: 300, confidence: 0.9 },
            undefined,
            { text: 'hello', start: 300, end: 500, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(1);
        expect(result.transcription).toBeTruthy();
    });

    test('handles missing timestamps', () => {
        const words = [
            { text: 'um', confidence: 0.9 },
            { text: 'hello', start: 300, confidence: 0.95 },
            { text: 'you', start: 500, end: 600, confidence: 0.9 },
            { text: 'know', end: 800, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toBeDefined();
        expect(result.transcription).toBeTruthy();
    });

    // Validation tests
    test('validates audio format through timestamps', () => {
        const words = [
            { text: 'hello', start: -100, end: 300 }, // Invalid negative timestamp
            { text: 'world', start: 300, end: 200 }   // Invalid end before start
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(0);
    });

    // Complex scenarios
    test('handles multiple filler phrases in sequence', () => {
        const words = [
            { text: 'you', start: 100, end: 200, confidence: 0.9 },
            { text: 'know,', start: 200, end: 300, confidence: 0.95 },
            { text: 'um,', start: 300, end: 400, confidence: 0.9 },
            { text: 'you', start: 400, end: 500, confidence: 0.9 },
            { text: 'know', start: 500, end: 600, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(3); // Two "you know"s and one "um"
    });

    test('handles punctuation correctly', () => {
        const words = [
            { text: 'You', start: 100, end: 200, confidence: 0.9 },
            { text: 'know,', start: 200, end: 300, confidence: 0.95 },
            { text: 'like,', start: 300, end: 400, confidence: 0.8 },
            { text: 'um...', start: 400, end: 500, confidence: 0.9 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies.length).toBeGreaterThan(0);
        expect(result.transcription).toMatch(/[,.]/); // Should contain punctuation
    });

    // Performance tests
    test('handles large input efficiently', () => {
        const words = Array(1000).fill().map((_, i) => ({
            text: i % 2 === 0 ? 'you' : 'know',
            start: i * 100,
            end: (i + 1) * 100,
            confidence: 0.9
        }));

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(500);
        expect(result.transcription).toBeTruthy();
    });
});

describe('Advanced Speech Analysis Tests', () => {
    // Audio format validation
    test('handles different audio durations', () => {
        const words = [
            { text: 'you', start: 0, end: 1000, confidence: 0.9 },    // 1 second
            { text: 'know', start: 1000, end: 3000, confidence: 0.95 } // 2 seconds
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies[0].end_time).toBe(3.0);
    });

    // Context-aware detection
    test('distinguishes between filler "like" and proper usage', () => {
        const words = [
            { text: 'I', start: 0, end: 100, confidence: 0.95 },
            { text: 'like', start: 100, end: 200, confidence: 0.95 }, // Proper usage
            { text: 'pizza', start: 200, end: 300, confidence: 0.95 },
            { text: 'like,', start: 400, end: 500, confidence: 0.7 }  // Filler usage
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(1);
        expect(result.disfluencies[0].start_time).toBe(0.4);
    });

    // Multiple disfluencies close together
    test('handles rapid succession of disfluencies', () => {
        const words = [
            { text: 'um,', start: 0, end: 100, confidence: 0.9 },
            { text: 'like,', start: 100, end: 200, confidence: 0.7 },
            { text: 'you', start: 200, end: 300, confidence: 0.9 },
            { text: 'know', start: 300, end: 400, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies).toHaveLength(3);
    });

    // Malformed input handling
    test('handles malformed word objects', () => {
        const words = [
            { text: 'um', confidence: 0.9 }, // Missing timestamps
            { start: 100, end: 200 },        // Missing text
            { text: 'you' },                 // Missing everything else
            null,
            undefined,
            { text: 'know', start: 300, end: 400, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.transcription).toBeTruthy();
        expect(result.disfluencies).toBeDefined();
    });

    // Performance testing
    test('processes long transcripts efficiently', () => {
        const start = Date.now();
        const words = Array(10000).fill().map((_, i) => ({
            text: i % 3 === 0 ? 'um' : 'word',
            start: i * 100,
            end: (i + 1) * 100,
            confidence: 0.9
        }));

        const result = analyzeSpeech(words);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(1000); // Should process in less than 1 second
        expect(result.disfluencies.length).toBeGreaterThan(0);
    });

    // Boundary conditions
    test('handles words at transcript boundaries', () => {
        const words = [
            { text: 'you', start: 0, end: 100, confidence: 0.9 },
            { text: 'know', start: 100, end: 200, confidence: 0.95 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies[0].start_time).toBe(0);
    });

    // Special characters and formatting
    test('handles special characters and formatting', () => {
        const words = [
            { text: 'um...', start: 0, end: 100, confidence: 0.9 },
            { text: 'y\'know', start: 100, end: 200, confidence: 0.95 },
            { text: 'like!?', start: 200, end: 300, confidence: 0.7 }
        ];

        const result = analyzeSpeech(words);
        expect(result.disfluencies.length).toBeGreaterThan(0);
        expect(result.transcription).toMatch(/[.,'!?]/);
    });
});
