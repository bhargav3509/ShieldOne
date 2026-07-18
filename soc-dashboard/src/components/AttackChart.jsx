import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const BAR_SHADES = [
  'var(--chart-bar-1)',
  'var(--chart-bar-2)',
  'var(--chart-bar-3)',
  'var(--chart-bar-4)',
  'var(--chart-bar-5)',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: '0.78rem',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 2 }}>{payload[0].payload.type}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        Count: <span style={{ fontWeight: 700 }}>{payload[0].value}</span>
      </p>
    </div>
  );
}

export default function AttackChart({ data }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 30,
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.5,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="card" ref={cardRef}>
      <div className="card-title">
        <span className="icon">▤</span>
        Attack Analytics
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="type"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-subtle)', opacity: 0.3 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_SHADES[i % BAR_SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
