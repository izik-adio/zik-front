import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // Base speed in milliseconds per character
  startDelay?: number; // Delay before starting to type
  onComplete?: () => void;
  naturalPauses?: boolean; // Add natural pauses for punctuation
}

export function useTypewriter({
  text,
  speed = 25,
  startDelay = 200,
  naturalPauses = true,
  onComplete,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const previousTextRef = useRef('');

  // Calculate typing speed with natural variations
  const getTypingDelay = (char: string, nextChar?: string) => {
    if (!naturalPauses) return speed;

    // Longer pauses for sentence endings
    if (char === '.' || char === '!' || char === '?') {
      return speed * 8; // Longer pause after sentences
    }

    // Medium pauses for commas and semicolons
    if (char === ',' || char === ';' || char === ':') {
      return speed * 4;
    }

    // Slight pause after words (spaces)
    if (char === ' ') {
      return speed * 1.5;
    }

    // Faster for common letter combinations
    if (nextChar && isCommonCombination(char + nextChar)) {
      return speed * 0.8;
    }

    // Random variation for natural feel
    return speed + (Math.random() - 0.5) * speed * 0.4;
  };

  const isCommonCombination = (combo: string) => {
    const common = [
      'th',
      'he',
      'in',
      'er',
      'an',
      'ed',
      'nd',
      'to',
      'en',
      'ti',
      'es',
      'or',
      'te',
      'of',
      'be',
      'ha',
      'as',
      'hi',
      'is',
    ];
    return common.includes(combo.toLowerCase());
  };
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If text hasn't changed significantly, don't restart typing
    if (text === previousTextRef.current) {
      return;
    }

    // If the new text is just an extension of the previous text, continue from where we left off
    if (
      text.startsWith(previousTextRef.current) &&
      previousTextRef.current.length > 0
    ) {
      previousTextRef.current = text;
      if (indexRef.current < text.length) {
        setIsTyping(true);
        typeCharacter();
      }
      return;
    }

    // Reset state for completely new text
    previousTextRef.current = text;
    indexRef.current = 0;
    setDisplayText('');
    setIsTyping(true); // Start typing after delay
    timeoutRef.current = setTimeout(() => {
      typeCharacter();
    }, startDelay) as any;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay]);
  const typeCharacter = () => {
    if (indexRef.current < text.length) {
      const newDisplayText = text.slice(0, indexRef.current + 1);
      setDisplayText(newDisplayText);

      const currentChar = text[indexRef.current];
      const nextChar = text[indexRef.current + 1];
      const delay = getTypingDelay(currentChar, nextChar);

      indexRef.current++;
      timeoutRef.current = setTimeout(typeCharacter, delay) as any;
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  };

  const skipToEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText(text);
    setIsTyping(false);
    indexRef.current = text.length;
    onComplete?.();
  };

  const pause = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTyping(false);
  };

  const resume = () => {
    if (indexRef.current < text.length) {
      setIsTyping(true);
      typeCharacter();
    }
  };

  return {
    displayText,
    isTyping,
    skipToEnd,
    pause,
    resume,
    progress: text.length > 0 ? indexRef.current / text.length : 0,
  };
}
