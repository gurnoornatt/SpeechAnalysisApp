import React from 'react';
import './App.css';
import ScriptGenerator from './components/ScriptGenerator';
import SpeechAnalyzer from './components/SpeechAnalyzer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Speech Analysis App</h1>
        <ScriptGenerator />
        <SpeechAnalyzer />
      </header>
    </div>
  );
}

export default App;
