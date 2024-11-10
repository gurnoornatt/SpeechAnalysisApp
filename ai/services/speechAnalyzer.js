const analyzeSpeech = (words) => {
    try {
        // Validate input
        if (!Array.isArray(words)) {
            console.error('Invalid input: words must be an array');
            return { transcription: '', disfluencies: [] };
        }

        const fillerPhrases = [
            "you know", "i mean", "sort of", "kind of", "you see",
            "basically", "actually", "literally", "like basically"
        ];

        const fillerWords = [
            "um", "uh", "er", "ah", "like", "well", "so", "right",
            "okay", "yeah", "mhm", "hmm"
        ];

        // Stutter patterns
        const stutterPatterns = {
            soundRepetition: /^([a-z])\1+/i,  // Detects repeated sounds like "s-s-sorry"
            wordRepetition: /^(\w+)\s+\1$/i,  // Detects repeated words like "the the"
            syllableRepetition: /^([a-z]{1,3})-\1/i  // Detects repeated syllables like "ta-ta"
        };

        let transcription = "";
        const disfluencies = [];
        const n = words.length;
        let stats = {
            fillerCount: 0,
            stutterCount: 0,
            repetitionCount: 0,
            totalPauseDuration: 0,
            wordsPerMinute: 0
        };

        // Helper function to clean word text
        const cleanText = (text) => {
            try {
                return text.replace(/[.,!?;:]+$/, '')
                    .replace(/^[.,!?;:]+/, '')
                    .toLowerCase()
                    .trim();
            } catch (error) {
                console.error('Error cleaning text:', error);
                return text ? text.toLowerCase().trim() : '';
            }
        };

        // Helper function to detect stutters
        const detectStutter = (current, next, prev) => {
            if (!current?.text) return null;

            const currentWord = current.text.toLowerCase();
            const prevWord = prev?.text?.toLowerCase();

            // Check for word repetition
            if (prevWord && currentWord === prevWord) {
                return {
                    word: `${currentWord} ${currentWord}`,
                    start_time: Math.round((prev.start / 1000) * 10) / 10,
                    end_time: Math.round((current.end / 1000) * 10) / 10,
                    type: "word repetition",
                    severity: "moderate"
                };
            }

            // Check for sound blocks
            if (current.confidence < 0.75 &&
                (stutterPatterns.soundRepetition.test(currentWord) ||
                    currentWord.includes('-'))) {
                return {
                    word: currentWord,
                    start_time: Math.round((current.start / 1000) * 10) / 10,
                    end_time: Math.round((current.end / 1000) * 10) / 10,
                    type: "sound block",
                    severity: "high"
                };
            }

            return null;
        };

        // Build transcription and analyze
        for (let i = 0; i < n; i++) {
            const word = words[i];
            const nextWord = i < n - 1 ? words[i + 1] : null;
            const prevWord = i > 0 ? words[i - 1] : null;

            // Add to transcription with proper spacing
            if (word?.text) {
                if (i === 0 || /^[.,!?;:]/.test(word.text)) {
                    transcription += word.text;
                } else {
                    transcription += ' ' + word.text;
                }
            }

            // Check for stutters
            const stutterResult = detectStutter(word, nextWord, prevWord);
            if (stutterResult) {
                disfluencies.push(stutterResult);
                stats.stutterCount++;
                continue;
            }

            // Check for filler phrases
            if (nextWord) {
                const phrase = `${word.text} ${nextWord.text}`.toLowerCase();
                if (fillerPhrases.includes(phrase)) {
                    disfluencies.push({
                        word: phrase,
                        start_time: Math.round((word.start / 1000) * 10) / 10,
                        end_time: Math.round((nextWord.end / 1000) * 10) / 10,
                        type: "filler phrase"
                    });
                    stats.fillerCount++;
                    i++;
                    continue;
                }
            }

            // Check for filler words
            if (word?.text) {
                const cleanedWord = cleanText(word.text);
                if (fillerWords.includes(cleanedWord)) {
                    if (cleanedWord === "like") {
                        if (word.confidence < 0.8) {
                            disfluencies.push({
                                word: cleanedWord,
                                start_time: Math.round((word.start / 1000) * 10) / 10,
                                end_time: Math.round((word.end / 1000) * 10) / 10,
                                type: "filler word"
                            });
                            stats.fillerCount++;
                        }
                    } else {
                        disfluencies.push({
                            word: cleanedWord,
                            start_time: Math.round((word.start / 1000) * 10) / 10,
                            end_time: Math.round((word.end / 1000) * 10) / 10,
                            type: "filler word"
                        });
                        stats.fillerCount++;
                    }
                }
            }

            // Track pauses
            if (nextWord && (nextWord.start - word.end) > 500) {
                stats.totalPauseDuration += (nextWord.start - word.end) / 1000;
            }
        }

        // Calculate final statistics
        stats.totalDuration = Math.max((words[n - 1]?.end - words[0]?.start) / 1000, 0.1);
        stats.wordsPerMinute = Math.round((n / stats.totalDuration) * 60);

        return {
            transcription: transcription.trim(),
            disfluencies,
            statistics: {
                ...stats,
                totalDuration: stats.totalDuration,
                fluencyScore: calculateFluencyScore(stats, n)
            }
        };
    } catch (error) {
        console.error('Error in analyzeSpeech:', error);
        return {
            transcription: '',
            disfluencies: [],
            statistics: {
                fillerCount: 0,
                stutterCount: 0,
                repetitionCount: 0,
                totalPauseDuration: 0,
                wordsPerMinute: 0,
                fluencyScore: 0
            }
        };
    }
};

const calculateFluencyScore = (stats, totalWords) => {
    if (!totalWords || totalWords === 0) return 0;
    if (!stats.totalDuration) return 0;

    const baseScore = 100;
    let deductions = 0;

    // Normalize values to prevent NaN
    const fillerRatio = Math.min(stats.fillerCount / totalWords, 1);
    const stutterRatio = Math.min(stats.stutterCount / totalWords, 1);
    const pauseRatio = Math.min(stats.totalPauseDuration / stats.totalDuration, 1);

    deductions += fillerRatio * 30;
    deductions += stutterRatio * 40;
    deductions += pauseRatio * 20;

    return Math.max(Math.round(baseScore - deductions), 0);
};

module.exports = { analyzeSpeech }; 