// src/App.jsx
import { useState, useEffect, useRef } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import "./App.css";

// Relative URL: the request goes to the same server as the page (Vite),
// and Vite passes it on to the backend (see the proxy in vite.config.js).
const API_URL = "/api/chat";

// Tina's first question is hard-coded here (not fetched from Gemini),
// so it shows instantly and the wording is always exactly what the brief asks for.
const OPENING_QUESTION =
  "I'm Tina. I help you to choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?";

// Shown when something goes wrong and we don't have a better message
const FALLBACK_ERROR = "Tina is having trouble right now. Please try again.";

// Shown when the backend can't be reached at all (not running, wrong port)
const CANT_REACH = "I can't reach the server right now. Please try again in a moment.";

function App() {
  // The conversation starts with Tina's opening question already in it
  const [messages, setMessages] = useState([{ role: "model", text: OPENING_QUESTION }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);        // is the chat panel showing?
  const [showPopup, setShowPopup] = useState(false);  // is the little speech bubble showing?
  const [hasOpened, setHasOpened] = useState(false);  // has the user opened the chat yet?
  const launcherRef = useRef(null);                   // the round chat icon

  // 1. Three seconds after the page loads, pop up Tina's speech bubble
  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(timer);   // tidy up if the page goes away first
  }, []);   // [] = only run once, on first load

  // 2. Open and close the chat panel
  function openChat() {
    setIsOpen(true);
    setHasOpened(true);   // once opened, the speech bubble never comes back
  }

  function closeChat() {
    setIsOpen(false);
    launcherRef.current?.focus();   // keyboard users land back on the chat icon
  }

  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Pressing Escape closes the panel (we only listen while it's open)
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") closeChat();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);   // stop listening once closed
  }, [isOpen]);

  // Talks to your Express backend
  async function askTina(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 502 or 504 = the proxy (Vite) is up, but it couldn't reach the backend behind it
    if (res.status === 502 || res.status === 504) {
      throw new Error(CANT_REACH);
    }

    // Not every error comes back as JSON (e.g. a proxy or server crash),
    // so read it safely instead of letting res.json() blow up.
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.reply) {
      throw new Error(data.error || FALLBACK_ERROR);
    }
    return data.reply;
  }

  // 3. When the user sends a message
  async function handleSend(userText) {
    const history = messages;                          // conversation so far (starts with the opening question)
    const userMessage = { role: "user", text: userText };

    setMessages([...history, userMessage]);            // show it straight away
    setIsLoading(true);

    try {
      const reply = await askTina({ history, message: userText });
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      // fetch() throws a TypeError when the page's own server (Vite) isn't reachable at all.
      // Chrome calls it "Failed to fetch", Firefox "NetworkError when attempting to fetch resource",
      // Safari "Load failed", so we check the error type instead of the exact words.
      const friendly = err instanceof TypeError ? CANT_REACH : err.message || FALLBACK_ERROR;
      setMessages((prev) => [...prev, { role: "model", text: friendly }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      {/* Speech bubble: only before the user has ever opened the chat */}
      {showPopup && !hasOpened && (
        <div className="chat-popup">
          <button className="chat-popup-text" type="button" onClick={openChat}>
            <strong>Tina</strong>
            {OPENING_QUESTION}
          </button>
          <button
            className="chat-popup-close"
            type="button"
            onClick={() => setShowPopup(false)}
            aria-label="Hide message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat panel: only on the page while isOpen is true */}
      {isOpen && (
        <section
          id="chat-panel"
          className="chat-panel"
          aria-label="Chat with Tina"
        >
          <header className="chat-header">
            <div>
              <p className="chat-title">Tina</p>
              <p className="chat-subtitle">Car insurance helper</p>
            </div>
            <button className="chat-close" type="button" onClick={closeChat} aria-label="Close chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <ChatWindow messages={messages} isLoading={isLoading} />

          <div className="chat-footer">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </section>
      )}

      {/* Round chat icon, always in the bottom-right corner */}
      <button
        ref={launcherRef}
        className="chat-launcher"
        type="button"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Chat with Tina"}
        aria-expanded={isOpen}
        aria-controls="chat-panel"
      >
        {isOpen ? (
          // Down arrow = "hide the chat"
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          // Speech bubble = "open the chat"
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default App;