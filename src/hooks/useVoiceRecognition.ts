'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Voice Recognition Hook
 * 
 * Uses Web Speech API to convert speech to text in real-time.
 * Works like ChatGPT/Gemini voice input.
 */

interface UseVoiceRecognitionOptions {
    onResult?: (transcript: string) => void;
    onInterimResult?: (transcript: string) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
    language?: string;
    continuous?: boolean;
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    toggleListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

export function useVoiceRecognition(
    options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
    const {
        onResult,
        onInterimResult,
        onEnd,
        onError,
        language = 'pt-PT', // Portuguese Portugal by default
        continuous = true,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    // Check for Web Speech API support
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            setIsSupported(!!SpeechRecognition);

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = continuous;
                recognition.interimResults = true;
                recognition.lang = language;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    setIsListening(true);
                    setError(null);
                };

                recognition.onend = () => {
                    setIsListening(false);
                    onEnd?.();
                };

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = '';
                    let interimText = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        const text = result[0].transcript;

                        if (result.isFinal) {
                            finalTranscript += text;
                        } else {
                            interimText += text;
                        }
                    }

                    if (finalTranscript) {
                        setTranscript(prev => {
                            const newTranscript = prev + finalTranscript;
                            onResult?.(newTranscript);
                            return newTranscript;
                        });
                        setInterimTranscript('');
                    }

                    if (interimText) {
                        setInterimTranscript(interimText);
                        onInterimResult?.(interimText);
                    }
                };

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    let errorMessage = 'Erro de reconhecimento de voz';

                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'Nenhuma fala detectada';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Microfone não encontrado';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Permissão do microfone negada';
                            break;
                        case 'network':
                            errorMessage = 'Erro de conexão';
                            break;
                        case 'aborted':
                            // User aborted, not an error
                            return;
                        default:
                            errorMessage = `Erro: ${event.error}`;
                    }

                    setError(errorMessage);
                    setIsListening(false);
                    onError?.(errorMessage);
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }
        };
    }, [language, continuous, onResult, onInterimResult, onEnd, onError]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setError(null);
            setTranscript('');
            setInterimTranscript('');
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Recognition might already be running
                console.warn('Speech recognition start error:', e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn('Speech recognition stop error:', e);
            }
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        isSupported,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        toggleListening,
        resetTranscript,
        error,
    };
}

export default useVoiceRecognition;
