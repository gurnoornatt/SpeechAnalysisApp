import React, { useState } from 'react';

function SpeechAnalyzer() {
    const [audioUrl, setAudioUrl] = useState('');
    const [transcription, setTranscription] = useState('');
    const [disfluencies, setDisfluencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeSpeech = async () => {
        setLoading(true);
        setError(null);
        setTranscription('');
        setDisfluencies([]);

        try {
            const response = await fetch('http://localhost:5000/analyze-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_url: audioUrl }),
            });

            const data = await response.json();

            if (response.ok) {
                setTranscription(data.transcription);
                setDisfluencies(data.disfluencies);
            } else {
                setError(data.error || 'An error occurred.');
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Analyze Speech</h2>
            <div>
                <label>Audio URL:</label>
                <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Enter audio URL"
                />
            </div>
            <button onClick={analyzeSpeech} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {transcription && (
                <div>
                    <h3>Transcription:</h3>
                    <p>{transcription}</p>
                </div>
            )}
            {disfluencies.length > 0 && (
                <div>
                    <h3>Detected Disfluencies:</h3>
                    <ul>
                        {disfluencies.map((d, index) => (
                            <li key={index}>
                                "{d.word}" at {d.start_time}s - {d.end_time}s
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default SpeechAnalyzer;
