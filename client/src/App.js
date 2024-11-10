import React from 'react';
import './App.css';
import SpeechAnalyzer from './components/SpeechAnalyzer';

function App() {
  const [audioUrl, setAudioUrl] = React.useState('');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Speech Analysis App</h1>
        <SpeechAnalyzer audioUrl={audioUrl} setAudioUrl={setAudioUrl} />
      </header>
    </div>
  );
}

export default App;
