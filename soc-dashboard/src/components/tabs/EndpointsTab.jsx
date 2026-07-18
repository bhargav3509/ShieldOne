import { useState, useEffect } from 'react';
import axios from 'axios';

export default function EndpointsTab() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchEndpoints = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://soc-dashboard-1-m5gr.onrender.com'}/endpoints`);
        if (active) {
          setEndpoints(res.data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) setLoading(false);
      }
    };

    fetchEndpoints();
    const interval = setInterval(fetchEndpoints, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="section card fade-in" style={{ padding: '24px' }}>
      <div className="card-header">
        <h2 className="card-title">Endpoint Health & Vulnerabilities</h2>
      </div>
      {loading ? (
        <p>Loading endpoints...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>OS</th>
              <th>Health Status</th>
              <th>Critical Vulns</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => (
              <tr key={ep.id}>
                <td style={{ fontWeight: 600 }}>{ep.id}</td>
                <td className="text-muted">{ep.os}</td>
                <td>
                  <span className={`badge badge-${ep.health === 'Healthy' ? 'success' : ep.health === 'Warning' ? 'warning' : 'danger'}`}>
                    {ep.health}
                  </span>
                </td>
                <td>
                  <span style={{ color: ep.vulns > 0 ? 'var(--live-color)' : 'var(--text-primary)', fontWeight: 'bold' }}>
                    {ep.vulns}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
