const analyzeSpeech = (words) => {
    const fillerPhrases = ["you know", "i mean"];
    const fillerWords = ["um", "uh", "er", "ah"];
    const disfluencies = [];
    let transcription = "";

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        transcription += word.text + " ";

        // Check for filler phrases
        if (i < words.length - 1) {
            const phrase = `${word.text} ${words[i + 1].text}`.toLowerCase();
            if (fillerPhrases.includes(phrase)) {
                disfluencies.push({
                    word: phrase,
                    start_time: word.start / 1000,
                    end_time: words[i + 1].end / 1000,
                    type: 'filler phrase'
                });
                i++;
                continue;
            }
        }

        // Special handling for "like"
        if (word.text.toLowerCase() === 'like') {
            // Consider it a filler only if confidence is low or it's isolated
            if (word.confidence < 0.8 ||
                (i > 0 && !['i', 'we', 'they'].includes(words[i - 1].text.toLowerCase()))) {
                disfluencies.push({
                    word: word.text,
                    start_time: word.start / 1000,
                    end_time: word.end / 1000,
                    type: 'filler word'
                });
            }
            continue;
        }

        // Check for other filler words
        if (fillerWords.includes(word.text.toLowerCase())) {
            disfluencies.push({
                word: word.text,
                start_time: word.start / 1000,
                end_time: word.end / 1000,
                type: 'filler word'
            });
        }
    }

    return {
        transcription: transcription.trim(),
        disfluencies
    };
};

module.exports = { analyzeSpeech }; 