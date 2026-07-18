import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function RiskGauge({ riskScore, anomaly }) {
  const gaugeRef = useRef(null);
  const fillRef = useRef(null);
  const scoreRef = useRef(null);
  const bannerRef = useRef(null);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(riskScore, 100) / 100;
  const dashOffset = circumference * (1 - progress);

  const getRiskLabel = (score) => {
    if (score >= 70) return { level: 'Critical', desc: 'Multiple high-severity threats detected. Immediate action recommended.' };
    if (score >= 40) return { level: 'Elevated', desc: 'Moderate threat level. Monitor and investigate flagged events.' };
    return { level: 'Normal', desc: 'Low threat activity. Systems operating within expected parameters.' };
  };

  const { level, desc } = getRiskLabel(riskScore);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(fillRef.current, {
        strokeDashoffset: dashOffset,
        duration: 1.2,
        ease: 'power2.out',
      });

      gsap.to(scoreRef.current, {
        innerText: riskScore,
        duration: 1,
        ease: 'power2.out',
        snap: { innerText: 1 },
      });
    }, gaugeRef);

    return () => ctx.revert();
  }, [riskScore, dashOffset]);

  useEffect(() => {
    if (anomaly && bannerRef.current) {
      gsap.fromTo(
        bannerRef.current,
        { x: -8 },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
      );
    }
  }, [anomaly]);

  return (
    <div className="section risk-section" ref={gaugeRef}>
      <div className="card" style={{ padding: '28px 32px' }}>
        <div className="risk-container">
          <div className="risk-gauge">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle className="risk-gauge-bg" cx="70" cy="70" r={radius} />
              <circle
                ref={fillRef}
                className="risk-gauge-fill"
                cx="70" cy="70" r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
              />
            </svg>
            <div className="risk-score-label">
              <div className="risk-score-value" ref={scoreRef}>0</div>
              <div className="risk-score-text">Risk</div>
            </div>
          </div>

          <div className="risk-info">
            <div className="risk-level">● {level} Threat Level</div>
            <p className="risk-description">{desc}</p>
            {anomaly && (
              <div className="anomaly-banner" ref={bannerRef}>
                <span className="anomaly-icon">⚠</span>
                Anomaly Detected — Unusual spike in high-severity events
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
