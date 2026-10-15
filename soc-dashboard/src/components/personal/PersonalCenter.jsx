import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../App';

// ─────────────────────────────────────────────────────────────
// PERSONAL SECURITY CENTER
// Free tier — for students and everyday internet users
// ─────────────────────────────────────────────────────────────

// Sub-components
function ScamAnalyzer({ onSaveHistory }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/personal/analyze-message`, { message });
      setResult(res.data);
      if (onSaveHistory) {
        onSaveHistory({
          type: 'scam_analysis',
          input: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          verdict: res.data.verdict,
          riskLevel: res.data.riskLevel,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = (level) => {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l === 'high') return 'risk-high';
    if (l === 'medium') return 'risk-medium';
    return 'risk-low';
  };

  const sampleScams = [
    {
      label: ' Electricity Bill Fraud',
      text: 'Dear customer your electricity power will be disconnected tonight at 9:30 pm from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210.'
    },
    {
      label: ' Digital Arrest Scam',
      text: 'TRAI / Mumbai Cyber Crime Branch Notice: An illegal parcel booked with your Aadhaar containing prohibited contraband was intercepted at Delhi airport. An immediate digital arrest warrant has been issued against you. Connect to Skype video call immediately for clearance.'
    },
    {
      label: ' Part-Time Job Scam',
      text: 'Congratulations! Selected for YouTube video like & subscribe part-time job. Earn ₹3,500 to ₹8,000 daily from home. No deposit needed initially. Click t.me/fast_income_india to connect with HR manager.'
    },
    {
      label: ' SBI KYC Expiry Alert',
      text: 'Dear SBI User, your NetBanking access is blocked due to expired KYC documents. Update your PAN and Aadhaar immediately at http://sbi-kyc-update.online to reactivate your debit card.'
    }
  ];

  return (
    <div>
      <p className="personal-tool-desc">
        Paste a suspicious message — SMS, WhatsApp, email, or social media — and receive an
        AI-powered analysis of its warning signs tailored to Indian cyber threats.
      </p>

      {/* Quick Test Chips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Test with Real-World Scams:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sampleScams.map((scam, i) => (
            <button
              key={i}
              type="button"
              className="example-chip"
              onClick={() => setMessage(scam.text)}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {scam.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} id="scam-analyzer-form">
        <div className="personal-input-group">
          <label className="personal-label">Message to analyze</label>
          <textarea
            id="scam-message-input"
            className="personal-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste suspicious SMS, WhatsApp message, email, or Telegram invite..."
            rows={5}
            disabled={loading}
            maxLength={5000}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
            {message.length}/5000
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || message.trim().length < 10}
          id="analyze-message-btn"
        >
          {loading ? 'Analyzing with AI...' : 'Analyze Message'}
        </button>
      </form>

      {error && <div className="personal-error">{error}</div>}

      {loading && (
        <div className="personal-loading">
          <div className="loading-dots"><span></span><span></span><span></span></div>
          <span>Checking for warning signs...</span>
        </div>
      )}

      {result && (
        <div className="personal-result">
          {/* Verdict */}
          <div className={`verdict-card ${getRiskClass(result.riskLevel)}`}>
            <div className="verdict-label">Verdict</div>
            <div className="verdict-text">{result.verdict}</div>
            <div className="verdict-meta">
              Confidence: {result.confidence} · Risk Level: {result.riskLevel}
            </div>
          </div>

          {/* Warning Signs */}
          {result.warningSignsFound && result.warningSignsFound.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Warning Signs Found in This Message</div>
              <ul className="result-list result-list-warn">
                {result.warningSignsFound.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          {result.specificEvidence && result.specificEvidence.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Specific Evidence</div>
              <ul className="result-list result-list-evidence">
                {result.specificEvidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Legitimacy indicators */}
          {result.legitimacyIndicators && result.legitimacyIndicators.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Factors Suggesting Legitimacy</div>
              <ul className="result-list result-list-safe">
                {result.legitimacyIndicators.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* What they want */}
          {result.whatTheyWant && (
            <div className="result-section">
              <div className="result-section-title">What the Sender May Be Trying to Get</div>
              <p className="result-text">{result.whatTheyWant}</p>
            </div>
          )}

          {/* Recommendation */}
          <div className="result-section">
            <div className="result-section-title">Recommendation</div>
            <p className="result-text">{result.recommendation}</p>
          </div>

          {/* Uncertainty */}
          {result.uncertainty && (
            <div className="result-section result-uncertainty">
              <div className="result-section-title">What Cannot Be Determined</div>
              <p className="result-text">{result.uncertainty}</p>
            </div>
          )}

          {/* Indian Resources */}
          {result.indianResources && result.indianResources.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Indian Cybercrime Resources</div>
              <div className="resource-list">
                {result.indianResources.map((r, i) => (
                  <div key={i} className="resource-item">
                    <div className="resource-name">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                          {r.name}
                        </a>
                      ) : r.name}
                    </div>
                    <div className="resource-desc">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="result-disclaimer">{result.disclaimer}</div>
        </div>
      )}
    </div>
  );
}

function URLChecker({ onSaveHistory }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/personal/check-url`, { url });
      setResult(res.data);
      if (onSaveHistory) {
        onSaveHistory({
          type: 'url_check',
          input: url.substring(0, 100),
          verdict: res.data.overallStatus,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Check failed. Please verify the URL is valid.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'failed') return 'check-fail';
    if (s === 'warning') return 'check-warn';
    if (s === 'passed') return 'check-pass';
    return 'check-unavail';
  };

  const getOverallClass = (status) => {
    if (!status) return '';
    if (status.toLowerCase().includes('danger')) return 'risk-high';
    if (status.toLowerCase().includes('caution')) return 'risk-medium';
    return 'risk-low';
  };

  const sampleUrls = [
    { label: 'SBI KYC Phishing (Live Blocklist)', url: 'https://sbi-kyc-update-portal.top/login' },
    { label: 'Free Recharge Scam', url: 'http://jio-5g-free-recharge-offer.online' },
    { label: 'C2 Botnet IP (Abuse.ch)', url: 'http://185.220.101.45/bin.sh' },
    { label: 'Official Portal (Safe)', url: 'https://cybercrime.gov.in' }
  ];

  return (
    <div>
      <p className="personal-tool-desc">
        Enter a URL to check against threat intelligence feeds, known Indian phishing indicators,
        and domain structure.
      </p>

      {/* Quick Test Chips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Test with Sample URLs:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sampleUrls.map((s, i) => (
            <button
              key={i}
              type="button"
              className="example-chip"
              onClick={() => setUrl(s.url)}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} id="url-checker-form">
        <div className="personal-input-group">
          <label className="personal-label">URL to check</label>
          <input
            id="url-input"
            type="text"
            className="personal-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !url.trim()}
          id="check-url-btn"
        >
          {loading ? 'Checking...' : 'Check URL'}
        </button>
      </form>

      {error && <div className="personal-error">{error}</div>}

      {loading && (
        <div className="personal-loading">
          <div className="loading-dots"><span></span><span></span><span></span></div>
          <span>Running security checks...</span>
        </div>
      )}

      {result && (
        <div className="personal-result">
          {/* Overall status */}
          <div className={`verdict-card ${getOverallClass(result.overallStatus)}`}>
            <div className="verdict-label">Overall Status</div>
            <div className="verdict-text">{result.overallStatus}</div>
            <div className="verdict-meta">
              Domain: <code className="inline-mono">{result.domain}</code>
            </div>
          </div>

          {/* AI Summary */}
          {result.aiSummary && (
            <div className="result-section">
              <div className="result-section-title">Summary</div>
              <p className="result-text">{result.aiSummary}</p>
            </div>
          )}

          {/* Check results */}
          <div className="result-section">
            <div className="result-section-title">Security Checks</div>
            <div className="check-list">
              {result.checks.map((check, i) => (
                <div key={i} className={`check-item ${getStatusClass(check.status)}`}>
                  <div className="check-header">
                    <span className="check-name">{check.name}</span>
                    <span className={`check-status-badge check-status-${check.status}`}>
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="check-detail">{check.detail}</div>
                  <div className="check-source">Source: {check.source}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Indian Resources */}
          {result.indianResources && result.indianResources.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Report a Malicious URL</div>
              <div className="resource-list">
                {result.indianResources.map((r, i) => (
                  <div key={i} className="resource-item">
                    <div className="resource-name">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                          {r.name}
                        </a>
                      ) : r.name}
                    </div>
                    <div className="resource-desc">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="result-disclaimer">{result.disclaimer}</div>
        </div>
      )}
    </div>
  );
}

function AIAssistant() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "How do I know if my account has been hacked?",
    "What is phishing and how do I avoid it?",
    "How do I create a strong password?",
    "Someone called saying they're from my bank — what should I do?",
    "How do I report a cybercrime in India?",
  ];

  const sendMessage = async (msg) => {
    const text = (msg || message).trim();
    if (!text || loading) return;
    setMessage('');
    setChat(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/personal/assistant`, { message: text, history: chat });
      setChat(prev => [...prev, { role: 'ai', text: res.data.text }]);
    } catch {
      setChat(prev => [...prev, { role: 'ai', text: 'Unable to connect to the AI assistant. For cybercrime help, visit cybercrime.gov.in or call 1930.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <p className="personal-tool-desc">
        Ask any cybersecurity question in plain language. Get practical advice tailored for
        everyday internet users in India.
      </p>

      {chat.length === 0 && (
        <div className="suggested-questions">
          <div className="result-section-title" style={{ marginBottom: 12 }}>Suggested questions</div>
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              className="suggested-question-btn"
              onClick={() => sendMessage(q)}
              disabled={loading}
              id={`suggested-q-${i}`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="assistant-chat">
        {chat.map((c, i) => (
          <div key={i} className={`assistant-bubble ${c.role}`}>
            {c.text}
          </div>
        ))}
        {loading && (
          <div className="assistant-bubble ai">
            <div className="loading-dots"><span></span><span></span><span></span></div>
          </div>
        )}
      </div>

      <div className="assistant-input-row">
        <input
          id="assistant-input"
          type="text"
          className="personal-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a cybersecurity question..."
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={loading || !message.trim()}
          id="assistant-send-btn"
        >
          Ask
        </button>
      </div>
    </div>
  );
}

function ScamResponse() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const situations = [
    { id: 'clicked_link', label: 'I clicked a suspicious link', desc: 'You clicked a link in a suspicious message or email' },
    { id: 'shared_credentials', label: 'I shared my password or personal info', desc: 'You entered your details on a suspicious site or gave them to a caller' },
    { id: 'made_payment', label: 'I made a payment to a possible scam', desc: 'You sent money that may have been a scam' },
    { id: 'received_message', label: 'I received a suspicious message', desc: 'You got a message and want to know what to do' },
    { id: 'suspected_malware', label: 'I think my device is infected', desc: 'Your device is behaving unusually and you suspect malware' },
  ];

  const handleGet = async (situationId) => {
    setSelected(situationId);
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);
    try {
      const res = await axios.post(`${API_URL}/personal/scam-response`, { situation: situationId });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateText = () => {
    const sitName = situations.find(s => s.id === selected)?.label || 'Cyber Incident';
    return `INCIDENT REPORT / COMPLAINT DRAFT
To: National Cyber Crime Reporting Portal (cybercrime.gov.in) / Helpline 1930
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
Category: ${sitName}

1. INCIDENT OVERVIEW:
I am writing to report a suspected cyber fraud incident that occurred on ${new Date().toLocaleDateString('en-IN')}.
Incident Type: ${sitName}

2. DETAILS OF SUSPECT / OFFENDER:
- Phone / WhatsApp Number: [Enter suspect mobile number]
- UPI ID / Bank Account: [Enter recipient UPI/A/C if payment was attempted]
- URL / Website Link: [Enter fraudulent link received]

3. FINANCIAL IMPACT (If applicable):
- Amount Lost: Rs. [Enter amount or NIL]
- Transaction Ref (UTR / RRN): [Enter 12-digit transaction number]
- Bank Name: [Enter your bank name]

4. IMMEDIATE ACTIONS TAKEN:
- Reported immediately to 1930 / Bank Customer Care
- Blocked suspect contact and preserved screenshots of conversation

Requesting registration of this complaint and immediate lien/freeze on the fraudulent beneficiary account under the IT Act 2000.`;
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(getTemplateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <p className="personal-tool-desc">
        Select what happened to get immediate, specific guidance. All advice is practical and
        tailored for users in India.
      </p>

      <div className="situation-grid">
        {situations.map((s) => (
          <button
            key={s.id}
            className={`situation-btn ${selected === s.id ? 'active' : ''}`}
            onClick={() => handleGet(s.id)}
            disabled={loading}
            id={`situation-${s.id}`}
          >
            <div className="situation-label">{s.label}</div>
            <div className="situation-desc">{s.desc}</div>
          </button>
        ))}
      </div>

      {error && <div className="personal-error" style={{ marginTop: 16 }}>{error}</div>}

      {loading && (
        <div className="personal-loading">
          <div className="loading-dots"><span></span><span></span><span></span></div>
          <span>Getting guidance...</span>
        </div>
      )}

      {result && (
        <div className="personal-result">
          {/* Immediate steps */}
          {result.immediateSteps && result.immediateSteps.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Do This Now</div>
              <ol className="result-ordered-list">
                {result.immediateSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* What to document */}
          {result.whatToDocument && result.whatToDocument.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Evidence to Collect</div>
              <ul className="result-list">
                {result.whatToDocument.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Avoid doing */}
          {result.avoidDoing && result.avoidDoing.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Common Mistakes to Avoid</div>
              <ul className="result-list result-list-warn">
                {result.avoidDoing.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Short-term actions */}
          {result.shortTermActions && result.shortTermActions.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Over the Next Few Days</div>
              <ul className="result-list">
                {result.shortTermActions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reassurance */}
          {result.reassurance && (
            <div className="result-section">
              <div className="result-section-title">What to Know</div>
              <p className="result-text">{result.reassurance}</p>
            </div>
          )}

          {/* AI guidance fallback */}
          {result.aiGuidance && (
            <div className="result-section">
              <div className="result-section-title">Guidance</div>
              <p className="result-text">{result.aiGuidance}</p>
            </div>
          )}

          {/* Resources */}
          {result.resources && result.resources.length > 0 && (
            <div className="result-section">
              <div className="result-section-title">Report and Get Help</div>
              <div className="resource-list">
                {result.resources.map((r, i) => (
                  <div key={i} className="resource-item">
                    <div className="resource-name">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">{r.name}</a>
                      ) : r.name}
                    </div>
                    <div className="resource-desc">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Police / 1930 Incident Draft Template */}
          <div className="result-section" style={{ background: 'var(--bg-elevated)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div className="result-section-title" style={{ margin: 0, color: 'var(--text-primary)' }}>
                📋 Cybercrime Complaint Template (for 1930 / cybercrime.gov.in)
              </div>
              <button
                className="btn btn-ghost"
                onClick={handleCopyTemplate}
                id="copy-complaint-draft-btn"
                style={{ fontSize: '0.74rem', padding: '6px 14px', borderColor: 'var(--accent, #6366f1)', color: 'var(--accent, #6366f1)' }}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Complaint Draft'}
              </button>
            </div>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid var(--border-card)' }}>
              {getTemplateText()}
            </pre>
          </div>

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="result-disclaimer">{result.disclaimer}</div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisHistory({ history, onDelete }) {
  if (history.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '24px 0' }}>
        No analysis history yet. Use the Scam Analyzer or URL Checker to get started.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="personal-tool-desc" style={{ margin: 0 }}>
          Your recent analyses are stored locally in this browser session.
        </p>
        <button className="btn btn-ghost" onClick={() => onDelete(null)} id="clear-history-btn" style={{ fontSize: '0.72rem' }}>
          Clear All
        </button>
      </div>
      <div className="check-list">
        {[...history].reverse().map((item, i) => (
          <div key={i} className="check-item history-item">
            <div className="check-header">
              <span className="check-name" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {item.type === 'scam_analysis' ? 'Scam Analysis' : 'URL Check'}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {item.verdict && (
                  <span className={`severity-badge ${item.verdict.toLowerCase().includes('scam') || item.verdict.toLowerCase().includes('danger')
                    ? 'severity-high'
                    : item.verdict.toLowerCase().includes('caution') || item.riskLevel === 'Medium'
                      ? 'severity-medium'
                      : 'severity-low'
                    }`}>
                    {item.verdict}
                  </span>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => onDelete(history.length - 1 - i)}
                  style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="check-detail" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {item.input}
            </div>
            <div className="check-source">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main PersonalCenter Component ──────────────────────────
export default function PersonalCenter({ theme, onToggleTheme, userEmail, onLogout, onSwitchPlan }) {
  const [activeTab, setActiveTab] = useState('scam');
  const [history, setHistory] = useState([]);

  const tabs = [
    { id: 'scam', label: 'Scam Analyzer' },
    { id: 'url', label: 'URL Checker' },
    { id: 'assistant', label: 'AI Assistant' },
    { id: 'response', label: 'Scam Response' },
    { id: 'history', label: 'History' },
  ];

  const saveHistory = (item) => {
    setHistory(prev => [...prev.slice(-49), item]);
  };

  const deleteHistory = (index) => {
    if (index === null) {
      setHistory([]);
    } else {
      setHistory(prev => {
        const reversed = [...prev].reverse();
        reversed.splice(index, 1);
        return reversed.reverse();
      });
    }
  };

  return (
    <div className="personal-container">
      {/* Personal Header */}
      <header className="personal-header">
        <div className="personal-header-top">
          <div>
            <h1 className="personal-title">ShieldOne</h1>
            <p className="personal-subtitle">Personal Security Center — Free Plan</p>
          </div>
          <div className="personal-header-actions">
            {userEmail && (
              <span className="personal-user-email">{userEmail}</span>
            )}
            <button
              className="btn btn-ghost"
              onClick={onToggleTheme}
              id="personal-theme-btn"
              style={{ fontSize: '0.72rem' }}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {onSwitchPlan && (
              <button
                className="btn btn-ghost"
                onClick={() => onSwitchPlan('professional')}
                id="personal-switch-plan-btn"
                style={{ fontSize: '0.72rem', borderColor: 'var(--accent, #6366f1)', color: 'var(--accent, #6366f1)' }}
              >
                SOC Dashboard ↗
              </button>
            )}
            {onLogout && (
              <button
                className="btn btn-ghost"
                onClick={onLogout}
                id="personal-logout-btn"
                style={{ fontSize: '0.72rem' }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="personal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`personal-tab-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'history' && history.length > 0 && (
                <span className="history-count">{history.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="personal-main">
        <div className="personal-tool-card card">
          <div className="personal-tool-header">
            <h2 className="personal-tool-title">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {activeTab === 'scam' && <ScamAnalyzer onSaveHistory={saveHistory} />}
          {activeTab === 'url' && <URLChecker onSaveHistory={saveHistory} />}
          {activeTab === 'assistant' && <AIAssistant />}
          {activeTab === 'response' && <ScamResponse />}
          {activeTab === 'history' && <AnalysisHistory history={history} onDelete={deleteHistory} />}
        </div>

        {/* Sidebar */}
        <aside className="personal-sidebar">
          <div className="card personal-sidebar-card">
            <div className="card-title">Emergency Contacts</div>
            <div className="emergency-list">
              <div className="emergency-item">
                <div className="emergency-name">National Cybercrime Helpline</div>
                <div className="emergency-number">1930</div>
              </div>
              <div className="emergency-item">
                <div className="emergency-name">Cyber Crime Portal</div>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="emergency-link">
                  cybercrime.gov.in
                </a>
              </div>
              <div className="emergency-item">
                <div className="emergency-name">RBI Sachet (Financial Fraud)</div>
                <a href="https://sachet.rbi.org.in" target="_blank" rel="noopener noreferrer" className="emergency-link">
                  sachet.rbi.org.in
                </a>
              </div>
              <div className="emergency-item">
                <div className="emergency-name">TRAI Spam Report</div>
                <div className="emergency-number">Forward SMS to 1909</div>
              </div>
            </div>
          </div>

          <div className="card personal-sidebar-card">
            <div className="card-title">Quick Safety Tips</div>
            <ul className="safety-tips">
              <li>Never share OTPs or passwords with callers.</li>
              <li>Verify phone numbers and websites independently.</li>
              <li>Scammers use HTTPS too — look beyond padlock icons.</li>
              <li>Urgency and panic are the #1 red flags of fraud.</li>
              <li>Call 1930 immediately if money has been deducted.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
