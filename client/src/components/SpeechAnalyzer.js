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
            console.log('Received data:', data);

            if (response.ok) {
                setTranscription(data.transcription);
                setDisfluencies(data.disfluencies || []);
            } else {
                setError(data.error || 'An error occurred.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ color: 'black', padding: '20px' }}>
            <h2>Analyze Speech</h2>
            <div style={{ marginBottom: '20px' }}>
                <label>Audio URL:</label>
                <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Enter audio URL"
                    style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '5px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    }}
                />
            </div>
            <button
                onClick={analyzeSpeech}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'Analyzing...' : 'Analyze'}
            </button>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            {transcription && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Transcription:</h3>
                    <p style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '4px',
                        lineHeight: '1.5'
                    }}>{transcription}</p>

                    <h3>Detected Disfluencies:</h3>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '4px'
                    }}>
                        {disfluencies.length > 0 ? (
                            <ul style={{
                                listStyleType: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                {disfluencies.map((d, index) => (
                                    <li key={index} style={{
                                        marginBottom: '10px',
                                        padding: '10px',
                                        backgroundColor: '#fff',
                                        borderLeft: `4px solid ${d.type === 'filler word' ? '#007bff' : '#28a745'}`,
                                        borderRadius: '4px'
                                    }}>
                                        <strong>"{d.word}"</strong> at {d.start_time}s - {d.end_time}s
                                        <span style={{
                                            marginLeft: '10px',
                                            padding: '2px 6px',
                                            backgroundColor: d.type === 'filler word' ? '#cce5ff' : '#d4edda',
                                            borderRadius: '3px',
                                            fontSize: '0.9em'
                                        }}>
                                            {d.type}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: '#666' }}>
                                {loading ? 'Analyzing speech patterns...' : 'No disfluencies detected'}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SpeechAnalyzer;
