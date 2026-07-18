import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ComplianceTab() {
  const [compliance, setCompliance] = useState(null);
  const [ueba, setUeba] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [compRes, uebaRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'https://soc-dashboard-1-m5gr.onrender.com'}/compliance`),
          axios.get(`${import.meta.env.VITE_API_URL || 'https://soc-dashboard-1-m5gr.onrender.com'}/ueba`)
        ]);
        if (active) {
          setCompliance(compRes.data);
          setUeba(uebaRes.data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="grid-2 fade-in">
      {/* Compliance */}
      <div className="section card">
        <div className="card-header">
          <h2 className="card-title">Compliance Status</h2>
        </div>
        {loading || !compliance ? (
          <p>Loading compliance...</p>
        ) : (
          <div className="compliance-wrapper">
            <div style={{ marginBottom: '24px' }}>
              <div className="stat-label">Overall Readiness Score</div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${compliance.overallScore}%`, background: compliance.overallScore > 80 ? 'var(--live-color)' : 'var(--text-primary)' }}
                ></div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{compliance.overallScore}%</div>
            </div>
            
            <table className="data-table">
              <tbody>
                {compliance.frameworks.map((fw, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{fw.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${fw.status === 'Compliant' ? 'success' : fw.status === 'Audit Pending' ? 'warning' : 'danger'}`}>
                        {fw.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UEBA */}
      <div className="section card">
        <div className="card-header">
          <h2 className="card-title">User Behavior Analytics (UEBA)</h2>
        </div>
        {loading ? (
          <p>Loading anomalies...</p>
        ) : (
          <div className="alert-list">
            {ueba.map((anomaly, idx) => (
              <div key={idx} className={`alert-item border-${anomaly.risk.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>User: {anomaly.user}</strong>
                  <span className={`badge badge-${anomaly.risk === 'Critical' ? 'danger' : 'warning'}`}>
                    {anomaly.risk} Risk
                  </span>
                </div>
                <div className="alert-body">Anomaly: {anomaly.action}</div>
                <div className="alert-time">{anomaly.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
