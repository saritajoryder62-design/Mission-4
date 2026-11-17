// src/components/ChatWindow.jsx
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import styles from "./ChatWindow.module.css";

function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  // Every time messages change, scroll to the bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={styles.window} role="log" aria-live="polite">
      {messages.map((msg, index) => (
        <MessageBubble key={index} role={msg.role} text={msg.text} />
      ))}

      {isLoading && <p className={styles.typing}>Tina is typing...</p>}

      {/* invisible marker at the bottom we scroll to */}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;