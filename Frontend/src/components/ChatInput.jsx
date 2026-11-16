// src/components/ChatInput.jsx
import { useState, useRef, useEffect } from "react";
import styles from "./ChatInput.module.css";

// The browser's built-in speech-to-text tool.
// Chrome, Edge and Safari call it "webkitSpeechRecognition".
// Firefox doesn't have it, so this will be undefined there and we hide the mic button.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);   // remembers the speech tool between renders
  const inputRef = useRef(null);         // the text box

  // When the chat opens, and each time Tina finishes replying,
  // put the cursor in the text box so the user can type straight away
  useEffect(() => {
    if (!disabled) inputRef.current.focus();
  }, [disabled]);

  function handleSubmit(e) {
    e.preventDefault();              // stop the page from reloading
    if (!text.trim()) return;        // don't send empty messages
    recognitionRef.current?.abort(); // stop listening so late words don't land in the empty box
    onSend(text.trim());             // hand the text up to App
    setText("");                     // clear the box
  }

  function handleMicClick() {
    // 1. Already listening? Then this click means "stop".
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    // 2. Set up a new speech tool
    const recognition = new SpeechRecognition();
    recognition.lang = "en-NZ";          // NZ English accent

    // 3. When the browser has turned speech into words, add them to the box
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + spoken : spoken));
    };

    // 4. When it stops (user went quiet, clicked stop, or something went wrong)
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    // 5. Start listening
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        aria-label="Type your message"   // screen readers (and tests) need a name; the placeholder changes and isn't a label
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isListening ? "Listening... speak now" : "Type your answer..."}
        disabled={disabled}
      />

      {/* Only show the mic if this browser can do speech-to-text */}
      {SpeechRecognition && (
        <button
          className={`${styles.micButton} ${isListening ? styles.listening : ""}`}
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          aria-label={isListening ? "Stop listening" : "Speak your answer"}
          aria-pressed={isListening}
          title={isListening ? "Stop listening" : "Speak your answer"}
        >
          {/* Microphone icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </button>
      )}

      <button className={styles.button} type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}

export default ChatInput;
