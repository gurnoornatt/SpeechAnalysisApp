import React, { useState } from 'react';
import ScriptRecorder from './ScriptRecorder';

function ScriptGenerator() {
    const [type, setType] = useState('casual');
    const [topic, setTopic] = useState('');
    const [script, setScript] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateScript = async () => {
        setLoading(true);
        setError(null);
        setScript('');

        try {
            const response = await fetch('http://localhost:5000/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, topic }),
            });

            const data = await response.json();

            if (response.ok) {
                setScript(data.script);
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
            <h2>Generate Script</h2>
            <div>
                <label>Type:</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                </select>
            </div>
            <div>
                <label>Topic:</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic"
                />
            </div>
            <button onClick={generateScript} disabled={loading}>
                {loading ? 'Generating...' : 'Generate'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Show ScriptRecorder when script is generated */}
            {script && <ScriptRecorder script={script} />}
        </div>
    );
}

export default ScriptGenerator;
