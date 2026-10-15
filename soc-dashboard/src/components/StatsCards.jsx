import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function StatsCards({ stats }) {
  const cardsRef = useRef(null);

  const cards = [
    { label: 'Total Alerts', value: stats.total },
    {
      label: 'High Severity',
      value: `${stats.total ? Math.round((stats.severityCounts.high / stats.total) * 100) : 0}%`,
    },
    { label: 'Top Threat', value: stats.topType?.type || '—', isText: true },
    { label: 'Active Source IPs', value: stats.uniqueIPs },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-card-item', {
        y: 32, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.1,
      });
    }, cardsRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="section" ref={cardsRef}>
      <div className="grid-4">
        {cards.map((s, i) => (
          <div className="card stat-card-item" key={i}>
            <div className="card-title">{s.label}</div>
            <div
              className="stat-value"
              style={{
                fontSize: s.isText ? '1.1rem' : undefined,
                fontFamily: s.isText ? 'var(--font-sans)' : undefined,
                wordBreak: s.isText ? 'break-word' : undefined,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
