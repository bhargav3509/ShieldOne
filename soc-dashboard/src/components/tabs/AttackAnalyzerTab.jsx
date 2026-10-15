import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../App';

export default function AttackAnalyzerTab() {
  const [indicator, setIndicator] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!indicator.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post(`${API_URL}/ai-attack-analyzer`, { indicator: indicator.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const exampleIndicators = [
    { label: 'IP Address', value: '185.220.101.45' },
    { label: 'CVE', value: 'CVE-2024-3400' },
    { label: 'Domain', value: 'malware-c2.example.com' },
  ];

  return (
    <div className="analyzer-container fade-in">
      {/* Header */}
      <div className="card section">
        <div className="analyzer-header">
          <div>
            <h2 className="analyzer-title">AI Attack Analyzer</h2>
            <p className="analyzer-subtitle">
              Submit an indicator of compromise — IP address, domain, CVE, or URL — for AI-assisted
              threat intelligence analysis using live feeds from Abuse.ch Feodo, ThreatFox,
              DShield/SANS ISC, and CISA KEV.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="analyzer-form" id="analyzer-form">
          <div className="analyzer-input-row">
            <input
              id="indicator-input"
              type="text"
              className="analyzer-input"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="e.g. 185.220.101.45, CVE-2024-3400, malicious-domain.com"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !indicator.trim()}
              id="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          <div className="analyzer-examples">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 10 }}>Examples:</span>
            {exampleIndicators.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="example-chip"
                onClick={() => setIndicator(ex.value)}
                id={`example-${ex.label.toLowerCase().replace(' ', '-')}`}
              >
                {ex.label}: {ex.value}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="anomaly-banner" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="analyzer-loading">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 12 }}>
              Checking threat intelligence feeds and running AI analysis...
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Indicator summary */}
          <div className="card section">
            <div className="card-title">Indicator</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <code className="indicator-display">{result.indicator}</code>
              <span
                className={`severity-badge ${
                  result.matches?.length > 0 ? 'severity-high' : 'severity-low'
                }`}
              >
                {result.matches?.length > 0
                  ? `${result.matches.length} TI Match${result.matches.length > 1 ? 'es' : ''}`
                  : 'No TI Matches'}
              </span>
            </div>
          </div>

          {/* Threat Intelligence Matches */}
          <div className="card section">
            <div className="card-title">
              Threat Intelligence Results
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Feeds checked: {result.feedsChecked || 'None loaded'}
              </span>
            </div>

            {result.matches && result.matches.length > 0 ? (
              <div className="ti-matches">
                {result.matches.map((match, idx) => (
                  <div key={idx} className="ti-match-item">
                    <div className="ti-match-source">{match.source}</div>
                    <div className="ti-match-type">{match.type}</div>
                    {match.detail && (
                      <div className="ti-match-detail">{match.detail}</div>
                    )}
                    <span className={`severity-badge severity-high`}>{match.confidence} Confidence</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ti-no-match">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  No matches found in currently loaded threat intelligence feeds.
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  The absence of a match does not indicate that an indicator is safe. Threat intelligence 
                  feeds have coverage gaps and may not include recently created malicious infrastructure.
                </p>
              </div>
            )}

            {/* Feed status */}
            {result.feedStatus && (
              <div className="feed-status-row">
                {[
                  { key: 'feodo', label: 'Feodo Tracker' },
                  { key: 'threatfox', label: 'ThreatFox' },
                  { key: 'dshield', label: 'DShield' },
                  { key: 'cisa_kev', label: 'CISA KEV' },
                ].map(f => (
                  <span
                    key={f.key}
                    className={`feed-status-badge ${result.feedStatus[f.key] ? 'feed-active' : 'feed-inactive'}`}
                    title={result.feedStatus[f.key] ? 'Feed loaded' : 'Feed not available'}
                  >
                    {f.label}: {result.feedStatus[f.key] ? 'Active' : 'Unavailable'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {result.analysis && (
            <div className="card section">
              <div className="card-title">AI Investigation Analysis</div>
              <div className="ai-analysis-body">
                {result.analysis.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <br key={i} />;
                  // Detect section headers (ends with : or is ALL CAPS short)
                  const isHeader = (trimmed.endsWith(':') && trimmed.length < 60) ||
                    (trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 2);
                  return isHeader ? (
                    <div key={i} className="ai-analysis-section-header">{trimmed}</div>
                  ) : (
                    <p key={i} className="ai-analysis-paragraph">{trimmed}</p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="card section analyzer-disclaimer">
              <div className="card-title">Important Limitations</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {result.disclaimer}
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="card analyzer-empty">
          <div className="analyzer-empty-title">Submit an indicator to begin analysis</div>
          <div className="analyzer-empty-body">
            <p>The AI Attack Analyzer cross-references your indicator against live threat intelligence feeds and generates a structured investigation report.</p>
            <div className="analyzer-capability-list">
              <div className="capability-item">
                <span className="capability-label">Abuse.ch Feodo Tracker</span>
                <span className="capability-detail">Active botnet command-and-control IPs</span>
              </div>
              <div className="capability-item">
                <span className="capability-label">Abuse.ch ThreatFox</span>
                <span className="capability-detail">IOCs with malware family associations (requires API key)</span>
              </div>
              <div className="capability-item">
                <span className="capability-label">DShield / SANS ISC</span>
                <span className="capability-detail">Top attacking IP addresses by report volume</span>
              </div>
              <div className="capability-item">
                <span className="capability-label">CISA KEV</span>
                <span className="capability-detail">Actively exploited CVEs with remediation deadlines</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
