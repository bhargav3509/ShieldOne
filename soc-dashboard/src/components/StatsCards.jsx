import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function StatsCards({ stats }) {
  const cardsRef = useRef(null);

  const cards = [
    { icon: '🛡', label: 'Total Alerts', value: stats.total },
    {
      icon: '◆',
      label: 'High Severity',
      value: `${stats.total ? Math.round((stats.severityCounts.high / stats.total) * 100) : 0}%`,
    },
    { icon: '⚡', label: 'Top Threat', value: stats.topType?.type || '—', isText: true },
    { icon: '⬡', label: 'Active IPs', value: stats.uniqueIPs },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-card-item', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2,
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="section" ref={cardsRef}>
      <div className="grid-4">
        {cards.map((s, i) => (
          <div className="card stat-card-item" key={i}>
            <div className="card-title">
              <span className="icon">{s.icon}</span>
              {s.label}
            </div>
            <div
              className="stat-value"
              style={{
                fontSize: s.isText ? '1.2rem' : undefined,
                fontFamily: s.isText ? 'var(--font-sans)' : undefined,
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
