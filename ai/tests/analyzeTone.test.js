const { analyzeTone } = require('../services/toneAnalyzer');

describe('Tone Analysis Tests', () => {
    // Basic tone detection
    test('detects formal business tone', async () => {
        const text = "As per our previous discussion, I am writing to formally request a meeting with the board of directors to present our Q4 financial projections.";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Formality',
                    score: expect.any(Number),
                    advice: expect.stringContaining('formal')
                })
            ])
        );
    });

    test('detects casual social media tone', async () => {
        const text = "OMG can't wait to share this amazing news with y'all! 🎉 So excited rn!!!";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Formality',
                    score: expect.any(Number),
                    advice: expect.stringContaining('casual')
                })
            ])
        );
    });

    // Emotional tones
    test('detects angry tone', async () => {
        const text = "This is absolutely unacceptable! I demand an immediate refund for this terrible service. I am furious!";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Anger',
                    score: expect.any(Number)
                })
            ])
        );
    });

    test('detects joyful tone', async () => {
        const text = "I'm thrilled to announce that we've achieved our goals! This is a wonderful day for our team!";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Joy',
                    score: expect.any(Number)
                })
            ])
        );
    });

    // Professional contexts
    test('detects academic writing tone', async () => {
        const text = "The study demonstrates a statistically significant correlation between the variables, suggesting that further research in this domain may yield valuable insights.";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Analytical',
                    score: expect.any(Number)
                })
            ])
        );
    });

    test('detects marketing tone', async () => {
        const text = "Don't miss out on this incredible, limited-time offer! Transform your life today with our revolutionary product!";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Confident',
                    score: expect.any(Number)
                })
            ])
        );
    });

    // Mixed tones
    test('detects multiple tones in complex text', async () => {
        const text = "While I appreciate your prompt response, I must express my disappointment with the proposed solution. However, I remain optimistic that we can find a mutually beneficial arrangement.";
        const result = await analyzeTone(text);
        expect(result.raw_tones.length).toBeGreaterThan(2);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ tone: 'Formality' }),
                expect.objectContaining({ tone: 'Tentative' }),
                expect.objectContaining({ tone: 'Sadness' })
            ])
        );
    });

    // Edge cases
    test('handles very short input', async () => {
        const text = "Thanks!";
        const result = await analyzeTone(text);
        expect(result.interpretation.length).toBeGreaterThan(0);
    });

    test('handles input with special characters', async () => {
        const text = "📊 Q4 results look great! 🎯 Target achieved @ 120% efficiency rate. #Success";
        const result = await analyzeTone(text);
        expect(result.interpretation).toBeDefined();
    });

    test('handles technical jargon', async () => {
        const text = "The API endpoint implements OAuth2 authentication with JWT tokens, ensuring secure data transmission over HTTPS.";
        const result = await analyzeTone(text);
        expect(result.interpretation).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tone: 'Technical',
                    score: expect.any(Number)
                })
            ])
        );
    });
}); 