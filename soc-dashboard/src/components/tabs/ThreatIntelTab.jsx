import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ThreatIntelTab() {
  const [intel, setIntel] = useState([]);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [intelRes, netRes] = await Promise.all([
          axios.get('http://localhost:5000/threat-intel'),
          axios.get('http://localhost:5000/network')
        ]);
        if (active) {
          setIntel(intelRes.data);
          setNetwork(netRes.data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // refresh every 3s
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="grid-2 fade-in">
      {/* Network Traffic */}
      <div className="section card">
        <div className="card-header">
          <h2 className="card-title">Network Traffic Monitoring</h2>
        </div>
        {loading || !network ? (
          <p>Loading network data...</p>
        ) : (
          <div className="network-grid">
            <div className="stat-card">
              <div className="stat-label">Bandwidth In</div>
              <div className="stat-value">{network.bandwidthIn}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bandwidth Out</div>
              <div className="stat-value">{network.bandwidthOut}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Dropped Packets</div>
              <div className="stat-value">{network.droppedPackets}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Conns</div>
              <div className="stat-value">{network.activeConnections}</div>
            </div>
          </div>
        )}
      </div>

      {/* Threat Intel Feed */}
      <div className="section card">
        <div className="card-header">
          <h2 className="card-title">Global Threat Intelligence</h2>
        </div>
        {loading ? (
          <p>Loading intel...</p>
        ) : (
          <div className="alert-list">
            {intel.map((item, idx) => (
              <div key={idx} className={`alert-item border-${item.severity.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>{item.cve}</strong>
                  <span className={`badge badge-${item.severity === 'Critical' ? 'danger' : 'warning'}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="alert-body">{item.threat}</div>
                <div className="alert-time">Published: {item.published}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
