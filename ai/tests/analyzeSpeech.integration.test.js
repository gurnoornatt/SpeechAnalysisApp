const request = require('supertest');
const app = require('../server');
const nock = require('nock');

describe('Speech Analysis Integration Tests', () => {
    beforeEach(() => {
        // Reset all HTTP mocks
        nock.cleanAll();
    });

    test('handles valid audio URL', async () => {
        const mockAudioUrl = 'https://example.com/audio.mp3';
        const mockTranscriptId = '12345';

        // Mock AssemblyAI API calls
        nock('https://api.assemblyai.com')
            .post('/v2/transcript')
            .reply(200, { id: mockTranscriptId });

        nock('https://api.assemblyai.com')
            .get(`/v2/transcript/${mockTranscriptId}`)
            .reply(200, {
                status: 'completed',
                words: [
                    { text: 'you', start: 100, end: 200 },
                    { text: 'know', start: 200, end: 300 }
                ]
            });

        const response = await request(app)
            .post('/analyze-speech')
            .send({ audio_url: mockAudioUrl });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('transcription');
        expect(response.body).toHaveProperty('disfluencies');
        expect(response.body).toHaveProperty('tone_analysis');
    });

    test('handles invalid audio URL', async () => {
        const response = await request(app)
            .post('/analyze-speech')
            .send({ audio_url: 'not-a-url' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.type).toBe('VALIDATION_ERROR');
    });

    test('handles AssemblyAI API errors', async () => {
        nock('https://api.assemblyai.com')
            .post('/v2/transcript')
            .replyWithError('API Error');

        const response = await request(app)
            .post('/analyze-speech')
            .send({ audio_url: 'https://example.com/audio.mp3' });

        expect(response.status).toBe(500);
        expect(response.body.type).toBe('TRANSCRIPTION_ERROR');
    });

    test('handles timeout', async () => {
        const mockTranscriptId = '12345';

        nock('https://api.assemblyai.com')
            .post('/v2/transcript')
            .reply(200, { id: mockTranscriptId });

        nock('https://api.assemblyai.com')
            .get(`/v2/transcript/${mockTranscriptId}`)
            .times(30)
            .reply(200, { status: 'processing' });

        const response = await request(app)
            .post('/analyze-speech')
            .send({ audio_url: 'https://example.com/audio.mp3' });

        expect(response.status).toBe(504);
        expect(response.body.type).toBe('TIMEOUT_ERROR');
    });
}); 