# Speech Analysis Backend API

## Overview
This API provides speech analysis capabilities, including transcription and disfluency detection using AssemblyAI.

## Features
- Speech-to-text transcription
- Disfluency detection ("um", "uh", "you know", etc.)
- Timestamp mapping for each detected disfluency
- Error handling and input validation

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with your API keys:
   ```
   ASSEMBLYAI_API_KEY=your_assemblyai_key_here
   OPENAI_API_KEY=your_openai_key_here
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /analyze-speech
Analyzes speech from an audio URL for disfluencies.

**Request Body:**
```json
{
    "audio_url": "https://example.com/audio-file.mp3"
}
```

**Response:**
```json
{
    "transcription": "You know, this is an example transcription",
    "disfluencies": [
        {
            "word": "you know",
            "start_time": 0.1,
            "end_time": 0.5,
            "type": "filler phrase"
        }
    ]
}
```

**Error Response:**
```json
{
    "error": "Error message",
    "details": "Detailed error description"
}
```

## Supported Audio Formats
- MP3
- WAV
- M4A
- FLAC
- Maximum file size: 100MB
- Maximum duration: 2 hours

## Testing
1. Run unit tests:
   ```bash
   npm test
   ```

2. Run specific test suites:
   ```bash
   npm test -- -t "Speech Analysis Tests"
   ```

3. Test with sample audio:
   ```bash
   curl -X POST http://localhost:5000/analyze-speech \
   -H "Content-Type: application/json" \
   -d '{"audio_url":"https://example.com/sample.mp3"}'
   ```

## Error Codes
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid API key)
- 413: Payload Too Large (file size > 100MB)
- 415: Unsupported Media Type
- 500: Internal Server Error

## Development
1. Start in development mode:
   ```bash
   npm run dev
   ```

2. Watch logs:
   ```bash
   tail -f logs/app.log
   ```

## Best Practices
1. Audio Quality:
   - Use clear audio recordings
   - Minimize background noise
   - Maintain consistent volume levels

2. URL Requirements:
   - Must be publicly accessible
   - Direct link to audio file
   - HTTPS preferred

## Troubleshooting
Common issues and solutions:

1. **Connection Errors**
   - Check API keys in .env
   - Verify server is running
   - Check network connectivity

2. **Transcription Issues**
   - Verify audio URL is accessible
   - Check audio format compatibility
   - Ensure file size < 100MB

3. **Performance Issues**
   - Monitor server resources
   - Check network latency
   - Verify audio file length

## Rate Limits
- 100 requests per hour per IP
- 1000 requests per day per API key
- Maximum concurrent requests: 5

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
MIT License