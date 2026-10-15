import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { API_URL } from '../App';

export default function AlertFeed({ attacks, onExplain }) {
  const feedRef = useRef(null);
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const prevCountRef = useRef(0);
  const [explanation, setExplanation] = useState(null);

  // Stagger-in animation for new items
  useEffect(() => {
    if (attacks.length > prevCountRef.current) {
      const newItems = listRef.current?.querySelectorAll('.alert-item');
      if (newItems?.length) {
        const newCount = attacks.length - prevCountRef.current;
        const toAnimate = Array.from(newItems).slice(0, newCount);
        gsap.from(toAnimate, { x: -24, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
      }
    }
    prevCountRef.current = attacks.length;
  }, [attacks]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(feedRef.current, { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.5 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    if (explanation) {
      gsap.fromTo(panelRef.current, { x: 360, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    }
  }, [explanation]);

  const handleExplain = async (attack) => {
    setExplanation({ loading: true, text: '', attack });
    try {
      const result = await onExplain(attack);
      setExplanation({ loading: false, text: result, attack });
    } catch {
      setExplanation({ loading: false, text: 'Failed to get AI explanation.', attack });
    }
  };

  const closePanel = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        x: 360, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => setExplanation(null),
      });
    } else {
      setExplanation(null);
    }
  };

  const sortedAttacks = [...attacks].reverse();

  return (
    <>
      <div className="card" ref={feedRef} style={{ gridColumn: '1 / -1' }}>
        <div className="card-title">
          Live Alert Feed
          <span
            className="text-mono"
            style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)' }}
          >
            {attacks.length} events
          </span>
        </div>

        <div className="alert-feed" ref={listRef}>
          {sortedAttacks.map((a) => (
            <div className="alert-item" key={a.id}>
              <span className={`alert-icon alert-icon-${a.severity}`}></span>
              <div className="alert-content">
                <div className="alert-type">{a.type}</div>
                <div className="alert-meta text-mono">{a.ip}{a.country ? ` · ${a.country}` : ''} · {a.time}</div>
              </div>
              <span className={`severity-badge severity-${a.severity}`}>{a.severity}</span>
              <button className="btn btn-ghost" onClick={() => handleExplain(a)} id={`explain-${a.id}`}>
                Explain
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed AI analysis panel */}
      {explanation && (
        <div className="ai-side-panel" ref={panelRef}>
          <div className="ai-side-panel-header">
            <h4>AI Analysis</h4>
            <button className="chatbot-close" onClick={closePanel} id="close-ai-panel">Close</button>
          </div>
          <div className="ai-side-panel-threat">
            <span className={`alert-icon alert-icon-${explanation.attack?.severity}`}></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{explanation.attack?.type}</div>
              <div className="text-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {explanation.attack?.ip} · {explanation.attack?.time}
              </div>
            </div>
            <span className={`severity-badge severity-${explanation.attack?.severity}`}>
              {explanation.attack?.severity}
            </span>
          </div>
          <div className="ai-side-panel-body">
            {explanation.loading ? (
              <div className="loading-dots" style={{ padding: '20px 0' }}>
                <span></span><span></span><span></span>
              </div>
            ) : (
              <p>{explanation.text}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
