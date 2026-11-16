// src/components/MessageBubble.jsx
import styles from "./MessageBubble.module.css";

function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.bot}`}>
        {text}
      </div>
    </div>
  );
}

export default MessageBubble;