import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import axios from 'axios';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef(null);
  const messagesRef = useRef(null);
  const toggleRef = useRef(null);

  // Toggle animation
  useEffect(() => {
    if (!panelRef.current) return;

    if (open) {
      gsap.fromTo(
        panelRef.current,
        { y: 20, opacity: 0, scale: 0.95, display: 'none' },
        { y: 0, opacity: 1, scale: 1, display: 'flex', duration: 0.35, ease: 'power3.out' }
      );
    } else {
      gsap.to(panelRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.95,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          if (panelRef.current) panelRef.current.style.display = 'none';
        },
      });
    }
  }, [open]);

  // Toggle button entrance
  useEffect(() => {
    const el = toggleRef.current;
    if (!el) return;
    gsap.set(el, { scale: 0 });
    const tween = gsap.to(el, {
      scale: 1,
      duration: 0.5,
      delay: 1.2,
      ease: 'back.out(1.7)',
    });
    return () => {
      tween.kill();
      gsap.set(el, { scale: 1 });
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chat]);

  const askAI = async () => {
    if (!question.trim() || loading) return;

    const userQ = question.trim();
    setQuestion('');
    setChat((prev) => [...prev, { role: 'user', text: userQ }]);
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/chat`, {
        message: userQ,
        history: chat,
      });
      setChat((prev) => [...prev, { role: 'ai', text: res.data.text }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: 'ai', text: 'Connection failed. Please check the backend server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') askAI();
  };

  return (
    <div className="chatbot">
      {/* Panel */}
      <div className="chatbot-panel" ref={panelRef}>
        <div className="chatbot-header">
          <h4>
            <span>🤖</span> Security Assistant
          </h4>
          <button className="chatbot-close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="chatbot-messages" ref={messagesRef}>
          {chat.length === 0 && (
            <p className="chat-empty">
              Ask about threats, mitigations, or security best practices.
            </p>
          )}
          {chat.map((c, i) => (
            <div key={i} className={`chat-bubble ${c.role === 'user' ? 'user' : 'ai'}`}>
              {c.text}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        <div className="chatbot-input">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about attacks or mitigation..."
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={askAI} disabled={loading || !question.trim()}>
            Send
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button className="chatbot-toggle" ref={toggleRef} onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
