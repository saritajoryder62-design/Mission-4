// src/App.jsx
import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import "./App.css";

const API_URL = "http://localhost:5000/api/chat";

function App() {
  const [messages, setMessages] = useState([]);   // the whole conversation
  const [isLoading, setIsLoading] = useState(false);

  // Talks to your Express backend
  async function askTina(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data.reply;
  }

  // 1. When the page first loads, get Tina's opening question
  useEffect(() => {
    async function start() {
      setIsLoading(true);
      try {
        const reply = await askTina({});   // empty body = opening question
        setMessages([{ role: "model", text: reply }]);
      } catch (err) {
        setMessages([{ role: "model", text: err.message }]);
      } finally {
        setIsLoading(false);
      }
    }
    start();
  }, []);   // [] = only run once, on first load

  // 2. When the user sends a message
  async function handleSend(userText) {
    const history = messages;                          // conversation so far
    const userMessage = { role: "user", text: userText };

    setMessages([...history, userMessage]);            // show it straight away
    setIsLoading(true);

    try {
      const reply = await askTina({ history, message: userText });
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "model", text: err.message }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <ChatWindow messages={messages} isLoading={isLoading} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default App;