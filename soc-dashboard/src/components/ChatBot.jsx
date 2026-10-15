import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import axios from 'axios';
import { API_URL } from '../App';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef(null);
  const messagesRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.fromTo(
        panelRef.current,
        { y: 20, opacity: 0, scale: 0.95, display: 'none' },
        { y: 0, opacity: 1, scale: 1, display: 'flex', duration: 0.3, ease: 'power3.out' }
      );
    } else {
      gsap.to(panelRef.current, {
        y: 20, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in',
        onComplete: () => { if (panelRef.current) panelRef.current.style.display = 'none'; },
      });
    }
  }, [open]);

  useEffect(() => {
    const el = toggleRef.current;
    if (!el) return;
    gsap.set(el, { scale: 0 });
    const tween = gsap.to(el, { scale: 1, duration: 0.5, delay: 1.2, ease: 'back.out(1.7)' });
    return () => { tween.kill(); gsap.set(el, { scale: 1 }); };
  }, []);

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
      const res = await axios.post(`${API_URL}/chat`, { message: userQ, history: chat });
      setChat((prev) => [...prev, { role: 'ai', text: res.data.text }]);
    } catch {
      setChat((prev) => [...prev, { role: 'ai', text: 'Connection failed. Please check the backend server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') askAI(); };

  return (
    <div className="chatbot">
      <div className="chatbot-panel" ref={panelRef}>
        <div className="chatbot-header">
          <h4>SOC Assistant</h4>
          <button className="chatbot-close" onClick={() => setOpen(false)} id="chatbot-close-btn">Close</button>
        </div>

        <div className="chatbot-messages" ref={messagesRef}>
          {chat.length === 0 && (
            <p className="chat-empty">
              Ask about threats, mitigations, CVEs, or security procedures.
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
            placeholder="Ask a security question..."
            disabled={loading}
            id="chatbot-input-field"
          />
          <button
            className="btn btn-primary"
            onClick={askAI}
            disabled={loading || !question.trim()}
            id="chatbot-send-btn"
          >
            Send
          </button>
        </div>
      </div>

      <button
        className="chatbot-toggle"
        ref={toggleRef}
        onClick={() => setOpen(!open)}
        id="chatbot-toggle-btn"
        title="SOC Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="2.5" />
            <line x1="12" y1="6" x2="12" y2="7" />
          </svg>
        )}
      </button>
    </div>
  );
}
