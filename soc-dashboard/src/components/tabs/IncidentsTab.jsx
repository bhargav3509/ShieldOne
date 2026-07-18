import { useState, useEffect } from 'react';
import axios from 'axios';

export default function IncidentsTab() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchIncidents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/incidents');
        if (active) {
          // Reverse so newest is first
          setIncidents([...res.data].reverse());
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) setLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="section card fade-in" style={{ padding: '24px' }}>
      <div className="card-header">
        <h2 className="card-title">Incident Workflow</h2>
      </div>
      {loading ? (
        <p>Loading incidents...</p>
      ) : incidents.length === 0 ? (
        <p className="text-muted">No incidents currently tracked.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Title</th>
              <th>Status</th>
              <th>Assigned Analyst</th>
              <th>MTTD</th>
              <th>MTTR</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id}>
                <td style={{ fontWeight: 600 }}>{inc.id}</td>
                <td className="text-muted">{inc.time}</td>
                <td>{inc.title}</td>
                <td>
                  <span className={`badge ${inc.status === 'Open' ? 'badge-danger' : 'badge-success'}`}>
                    {inc.status}
                  </span>
                </td>
                <td>{inc.analyst}</td>
                <td className="text-muted">{inc.mttd}</td>
                <td className="text-muted">{inc.mttr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
