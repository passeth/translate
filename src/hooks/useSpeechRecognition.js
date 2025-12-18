import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (language, isMicOn, onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const isMicOnRef = useRef(isMicOn); // To access latest value in callbacks
    const onResultRef = useRef(onResult);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        isMicOnRef.current = isMicOn;
        if (isMicOn && recognitionRef.current && !isListening) {
            try { recognitionRef.current.start(); } catch (e) { }
        } else if (!isMicOn && recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isMicOn, isListening]);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.error("Browser not supported");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => setIsListening(true);

        recognition.onend = () => {
            setIsListening(false);
            // Auto-restart logic
            if (isMicOnRef.current) {
                // Small delay to prevent tight loops if errors occur
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, 300);
            }
        };

        recognition.onresult = (event) => {
            let final = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (final || interim) {
                if (onResultRef.current) onResultRef.current({ final, interim });
            }
        };

        recognitionRef.current = recognition;

        // Initial start if needed
        if (isMicOnRef.current) {
            try { recognition.start(); } catch (e) { }
        }

        return () => {
            recognition.onend = null; // Prevent restart
            recognition.stop();
        };
    }, [language]); // Re-create if language changes.

    return { isListening };
};
