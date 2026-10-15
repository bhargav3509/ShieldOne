require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { URL } = require("url");

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
      : "*"
  }
});
const PORT = process.env.PORT || 5001;

// --- Initialize OpenRouter API ---
let openai = null;
if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
} else {
  console.warn("WARNING: OPENROUTER_API_KEY is not set. AI features will run in fallback mode.");
}

const OPENROUTER_MODEL = "google/gemini-2.5-flash";

// --- Middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
      : "*",
  })
);
app.use(express.json({ limit: "50kb" }));

// ─────────────────────────────────────────────────────────────
// SIMPLE IN-MEMORY RATE LIMITER
// ─────────────────────────────────────────────────────────────
const rateLimitStore = new Map();

function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimitStore.set(key, entry);
  return entry.count <= maxRequests;
}

function rateLimitMiddleware(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    if (!rateLimit(key, maxRequests, windowMs)) {
      return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
    }
    next();
  };
}

// Clean up old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 600000);

// ─────────────────────────────────────────────────────────────
// SSRF PROTECTION — block private/internal IPs for URL checking
// ─────────────────────────────────────────────────────────────
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,   // Link-local
  /^::1$/,         // IPv6 loopback
  /^fc00:/i,       // IPv6 ULA
  /^fe80:/i,       // IPv6 link-local
  /^0\./,
  /^metadata\.google\.internal/i,
  /^169\.254\.169\.254/,  // AWS/GCP metadata
  /^100\.64\./,    // CGNAT
];

function isPrivateOrDangerous(hostname) {
  if (!hostname) return true;
  // Block cloud metadata endpoints
  const lower = hostname.toLowerCase();
  if (lower === "metadata.google.internal" || lower === "metadata.aws.internal") return true;
  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(hostname)) return true;
  }
  return false;
}

function isSafeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return { safe: false, reason: "Only HTTP and HTTPS URLs are supported." };
    if (isPrivateOrDangerous(parsed.hostname)) return { safe: false, reason: "URL targets a private or reserved network address." };
    return { safe: true };
  } catch {
    return { safe: false, reason: "Invalid URL format." };
  }
}

// ─────────────────────────────────────────────────────────────
// REAL-TIME THREAT INTELLIGENCE DATA POOLS
// ─────────────────────────────────────────────────────────────
let threatIntelPool = [];       // Abuse.ch Feodo: botnet C2 IPs
let urlhausPool = [];           // Abuse.ch MalwareBazaar: real malware
let threatFoxPool = [];         // Abuse.ch ThreatFox: IOCs with geo
let cisaKevPool = [];           // CISA KEV: actively exploited CVEs
let dshieldPool = [];           // DShield/SANS ISC: top attacking IPs
let dynamicThreatIntel = [];    // Rendered threat-intel panel
let dynamicUeba = [];           // Rendered UEBA panel

// Sets for fast O(1) indicator lookups
const feodoIPSet = new Set();
const threatFoxIPSet = new Set();
const threatFoxDomainSet = new Set();
const threatFoxURLSet = new Set();
const dshieldIPSet = new Set();

const COUNTRY_GEO = {
  CN: { lat: 35.86, lng: 104.19 }, RU: { lat: 61.52, lng: 105.31 },
  US: { lat: 37.09, lng: -95.71 }, DE: { lat: 51.16, lng: 10.45 },
  NL: { lat: 52.13, lng: 5.29 },  BR: { lat: -14.23, lng: -51.92 },
  IN: { lat: 20.59, lng: 78.96 }, FR: { lat: 46.22, lng: 2.21 },
  GB: { lat: 55.37, lng: -3.43 }, KR: { lat: 35.90, lng: 127.76 },
  JP: { lat: 36.20, lng: 138.25 }, UA: { lat: 48.37, lng: 31.16 },
  IR: { lat: 32.42, lng: 53.68 }, PK: { lat: 30.37, lng: 69.34 },
  VN: { lat: 14.05, lng: 108.27 }, TR: { lat: 38.96, lng: 35.24 },
};

function countryToGeo(cc) {
  if (!cc) return null;
  return COUNTRY_GEO[cc.toUpperCase()] || null;
}

// ── 1. Abuse.ch Feodo Tracker — Active Botnet C2 IPs ──────────
async function fetchFeodoTracker() {
  try {
    const res = await axios.get("https://feodotracker.abuse.ch/downloads/ipblocklist.json", { timeout: 10000 });
    if (res.data && Array.isArray(res.data)) {
      threatIntelPool = res.data;
      feodoIPSet.clear();
      res.data.forEach(e => e.ip_address && feodoIPSet.add(e.ip_address));
      console.log(`[TI] Feodo Tracker: loaded ${threatIntelPool.length} botnet C2 IPs`);
    }
  } catch (err) {
    console.warn("[TI] Feodo Tracker unavailable:", err.message);
  }
}

// ── 2. Abuse.ch MalwareBazaar — Recent Malware Samples ────
let malwareBazaarPool = [];
async function fetchMalwareBazaar() {
  try {
    const res = await axios.post(
      "https://mb-api.abuse.ch/api/v1/",
      "query=get_recent&selector=time",
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 12000 }
    );
    if (res.data && res.data.data) {
      malwareBazaarPool = res.data.data.filter(s => s.signature && s.origin_country);
      urlhausPool = malwareBazaarPool;
      console.log(`[TI] MalwareBazaar: loaded ${malwareBazaarPool.length} malware samples`);
    }
  } catch (err) {
    console.warn("[TI] MalwareBazaar unavailable:", err.message);
  }
}

// ── 3. Abuse.ch ThreatFox — IOCs ──
async function fetchThreatFox() {
  if (!process.env.ABUSE_CH_API_KEY) {
    console.log("[TI] ThreatFox skipped — set ABUSE_CH_API_KEY in .env for this feed");
    return;
  }
  try {
    const headers = { 'Content-Type': 'application/json', 'Auth-Key': process.env.ABUSE_CH_API_KEY };
    const res = await axios.post(
      "https://threatfox-api.abuse.ch/api/v1/",
      JSON.stringify({ query: "get_iocs", days: 1 }),
      { headers, timeout: 10000 }
    );
    if (res.data && res.data.data) {
      threatFoxPool = res.data.data.filter(ioc => ioc.ioc_type === 'ip:port');
      threatFoxIPSet.clear();
      threatFoxDomainSet.clear();
      threatFoxURLSet.clear();
      res.data.data.forEach(ioc => {
        if (ioc.ioc_type === 'ip:port') threatFoxIPSet.add(ioc.ioc.split(':')[0]);
        if (ioc.ioc_type === 'domain') threatFoxDomainSet.add(ioc.ioc);
        if (ioc.ioc_type === 'url') threatFoxURLSet.add(ioc.ioc);
      });
      console.log(`[TI] ThreatFox: loaded ${threatFoxPool.length} IOCs`);
    }
  } catch (err) {
    console.warn("[TI] ThreatFox unavailable:", err.message);
  }
}

// ── 4. CISA KEV — Real Actively Exploited CVEs ────────────────
async function fetchCISAKev() {
  try {
    const res = await axios.get("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", { timeout: 15000 });
    if (res.data && res.data.vulnerabilities) {
      const vulns = res.data.vulnerabilities.slice(-30);
      cisaKevPool = vulns;
      dynamicThreatIntel = vulns.slice(-8).reverse().map(v => ({
        cve: v.cveID,
        threat: `${v.vendorProject} ${v.product}: ${v.shortDescription}`.substring(0, 90),
        severity: v.knownRansomwareCampaignUse === 'Known' ? 'Critical' : 'High',
        published: new Date(v.dateAdded).toLocaleDateString()
      }));
      console.log(`[TI] CISA KEV: loaded ${cisaKevPool.length} exploited CVEs`);
    }
  } catch (err) {
    console.warn("[TI] CISA KEV unavailable:", err.message);
    if (dynamicThreatIntel.length === 0) {
      dynamicThreatIntel = [
        { cve: "CVE-2024-21762", threat: "Fortinet FortiOS: Out-of-bound write in SSL-VPN", severity: "Critical", published: "2024-02-09" },
        { cve: "CVE-2024-3400", threat: "Palo Alto Networks: OS command injection in GlobalProtect", severity: "Critical", published: "2024-04-12" },
        { cve: "CVE-2023-46805", threat: "Ivanti Connect Secure: Authentication bypass", severity: "High", published: "2024-01-10" },
      ];
    }
  }
}

// ── 5. DShield / SANS ISC — Live Top Attacking IPs ────────────
async function fetchDShield() {
  try {
    const res = await axios.get("https://isc.sans.edu/api/topips/sources/20/json", {
      timeout: 10000,
      responseType: 'json'
    });
    let entries = [];
    if (Array.isArray(res.data)) {
      entries = res.data;
    } else if (res.data && typeof res.data === 'object') {
      entries = res.data.item || Object.values(res.data).filter(v => typeof v === 'object' && v !== null);
    }
    dshieldPool = entries.filter(e => e && (e.ipaddr || e.ip)).map(e => ({ ...e, ipaddr: e.ipaddr || e.ip }));
    dshieldIPSet.clear();
    dshieldPool.forEach(e => dshieldIPSet.add(e.ipaddr));
    if (dshieldPool.length > 0) {
      dynamicUeba = dshieldPool.slice(0, 8).map((e) => ({
        user: e.ipaddr,
        action: `${e.reports || e.count || '?'} attack reports from ${e.country || 'Unknown'}`,
        risk: (parseInt(e.reports || e.count) || 0) > 5000 ? 'Critical' : (parseInt(e.reports || e.count) || 0) > 1000 ? 'High' : 'Medium',
        time: `${Math.floor(Math.random() * 59 + 1)}m ago`
      }));
      console.log(`[TI] DShield: loaded ${dshieldPool.length} top attacking IPs`);
    } else {
      throw new Error("Empty response");
    }
  } catch (err) {
    console.warn("[TI] DShield unavailable:", err.message);
    if (dynamicUeba.length === 0) {
      dynamicUeba = [
        { user: "185.220.101.45", action: "Tor Exit Node — brute force SSH", risk: "Critical", time: "2m ago" },
        { user: "45.141.84.120", action: "Port scanning (RU ASN)", risk: "High", time: "8m ago" },
        { user: "192.42.116.16", action: "Malware C2 callback", risk: "High", time: "15m ago" },
      ];
    }
  }
}

// ── Bootstrap: fetch all feeds on startup ─────────────────────
async function fetchAllThreatFeeds() {
  console.log("[TI] Fetching all real-time threat intelligence feeds...");
  await Promise.allSettled([
    fetchFeodoTracker(),
    fetchMalwareBazaar(),
    fetchThreatFox(),
    fetchCISAKev(),
    fetchDShield(),
  ]);
  console.log("[TI] All feeds loaded.");
}
fetchAllThreatFeeds();
setInterval(fetchAllThreatFeeds, 30 * 60 * 1000);

// ─────────────────────────────────────────────────────────────
// IN-MEMORY STORES
// ─────────────────────────────────────────────────────────────
let attacks = [];
let idCounter = 1;
let incidents = [];
let incidentCounter = 1000;
const analysts = ["Alex T.", "Sam R.", "Jordan K.", "Unassigned"];

const endpointsStatus = [
  { id: "WKST-001", os: "Windows 11", health: "Healthy", vulns: 0 },
  { id: "WKST-002", os: "Windows 11", health: "Critical", vulns: 3 },
  { id: "SRV-DB-01", os: "Linux Ubuntu", health: "Warning", vulns: 1 },
  { id: "SRV-WEB-02", os: "Linux Debian", health: "Healthy", vulns: 0 },
  { id: "MAC-EXEC-01", os: "macOS Sonoma", health: "Healthy", vulns: 0 }
];

const complianceData = {
  overallScore: 82,
  frameworks: [
    { name: "SOC 2 Type II", status: "Compliant" },
    { name: "ISO 27001", status: "Audit Pending" },
    { name: "GDPR", status: "Compliant" },
    { name: "PCI DSS", status: "Non-Compliant" }
  ]
};

const getNetworkData = () => ({
  bandwidthIn: (Math.random() * 2 + 0.5).toFixed(2) + " Gbps",
  bandwidthOut: (Math.random() * 800 + 200).toFixed(0) + " Mbps",
  droppedPackets: Math.floor(Math.random() * 5000 + 10000).toLocaleString(),
  activeConnections: Math.floor(Math.random() * 2000 + 3000)
});

function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// ─────────────────────────────────────────────────────────────
// ATTACK GENERATOR — uses real threat data when available
// ─────────────────────────────────────────────────────────────
function generateAttack() {
  let ip = randomIP();
  let type = "Port Scan";
  let severity = "low";
  let lat = Math.random() * 160 - 80;
  let lng = Math.random() * 360 - 180;
  let country = null;

  const roll = Math.random();
  const totalPool = threatFoxPool.length + threatIntelPool.length + urlhausPool.length + dshieldPool.length;

  if (totalPool === 0 || roll < 0.1) {
    const fallbackTypes = ["DDoS", "Brute Force", "Port Scan", "Phishing", "Firewall Block"];
    type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
    severity = ["low", "medium", "high"][Math.floor(Math.random() * 3)];
  } else if (roll < 0.35 && threatFoxPool.length > 0) {
    const ioc = threatFoxPool[Math.floor(Math.random() * threatFoxPool.length)];
    ip = ioc.ioc.split(':')[0];
    type = ioc.malware_printable || ioc.threat_type_desc || "Malware C2";
    severity = "high";
    country = ioc.reporter_country;
    const geo = countryToGeo(country);
    if (geo) { lat = geo.lat + (Math.random() - 0.5) * 5; lng = geo.lng + (Math.random() - 0.5) * 5; }
  } else if (roll < 0.65 && threatIntelPool.length > 0) {
    const c2 = threatIntelPool[Math.floor(Math.random() * threatIntelPool.length)];
    ip = c2.ip_address;
    type = c2.malware || "Botnet C2";
    severity = "high";
    country = c2.country;
    const geo = countryToGeo(country);
    if (geo) { lat = geo.lat + (Math.random() - 0.5) * 4; lng = geo.lng + (Math.random() - 0.5) * 4; }
  } else if (roll < 0.80 && urlhausPool.length > 0) {
    const sample = urlhausPool[Math.floor(Math.random() * urlhausPool.length)];
    ip = randomIP();
    type = sample.signature || sample.tags?.[0] || "Malware Distribution";
    severity = "high";
    country = sample.origin_country;
    const geo = countryToGeo(country);
    if (geo) { lat = geo.lat + (Math.random() - 0.5) * 3; lng = geo.lng + (Math.random() - 0.5) * 3; }
  } else if (dshieldPool.length > 0) {
    const attacker = dshieldPool[Math.floor(Math.random() * dshieldPool.length)];
    ip = attacker.ipaddr;
    type = attacker.maxrisk > 7 ? "Brute Force" : "Port Scan";
    severity = attacker.maxrisk > 7 ? "high" : "medium";
    country = attacker.country;
    const geo = countryToGeo(country);
    if (geo) { lat = geo.lat + (Math.random() - 0.5) * 3; lng = geo.lng + (Math.random() - 0.5) * 3; }
  }

  const attack = {
    id: idCounter++,
    type,
    ip,
    severity,
    time: new Date().toLocaleTimeString(),
    lat,
    lng,
    country: country || undefined,
  };

  attacks.push(attack);
  if (attacks.length > 50) attacks.shift();

  if (severity === 'high' && Math.random() > 0.6) {
    incidents.push({
      id: `INC-${incidentCounter++}`,
      title: `Escalation: ${type} from ${ip}`,
      status: Math.random() > 0.7 ? "Closed" : "Open",
      analyst: analysts[Math.floor(Math.random() * analysts.length)],
      mttd: `${Math.floor(Math.random() * 10 + 1)}m`,
      mttr: `${Math.floor(Math.random() * 45 + 15)}m`,
      time: attack.time
    });
    if (incidents.length > 20) incidents.shift();
  }

  io.emit('dashboardData', { attacks, stats: getStats() });
}

setInterval(generateAttack, 2000);

// --- SOC Routes ---
app.get("/attacks", (req, res) => res.json(attacks));
app.get("/incidents", (req, res) => res.json(incidents));
app.get("/threat-intel", (req, res) => res.json(dynamicThreatIntel));
app.get("/endpoints", (req, res) => res.json(endpointsStatus));
app.get("/compliance", (req, res) => res.json(complianceData));
app.get("/ueba", (req, res) => res.json(dynamicUeba));
app.get("/network", (req, res) => res.json(getNetworkData()));
app.get("/feed-status", (req, res) => res.json({
  feodo:     { loaded: threatIntelPool.length,  label: "Abuse.ch Feodo (Botnet C2 IPs)" },
  urlhaus:   { loaded: urlhausPool.length,       label: "Abuse.ch MalwareBazaar (Malware Samples)" },
  threatfox: { loaded: threatFoxPool.length,     label: "Abuse.ch ThreatFox (IOCs)" },
  cisa_kev:  { loaded: cisaKevPool.length,       label: "CISA Known Exploited Vulnerabilities" },
  dshield:   { loaded: dshieldPool.length,       label: "DShield/SANS ISC (Top Attacking IPs)" },
}));

function getStats() {
  const total = attacks.length;
  const severityCounts = { low: 0, medium: 0, high: 0 };
  const typeCounts = {};
  attacks.forEach((a) => {
    severityCounts[a.severity] = (severityCounts[a.severity] || 0) + 1;
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    total,
    severityCounts,
    typeCounts,
    topType: topType ? { type: topType[0], count: topType[1] } : null,
    uniqueIPs: new Set(attacks.map((a) => a.ip)).size,
  };
}

app.get("/stats", (req, res) => res.json(getStats()));

// POST /ai-explain — SOC AI explain for a specific attack event
app.post("/ai-explain", rateLimitMiddleware(20, 60000), async (req, res) => {
  const { attack } = req.body;
  if (!attack || !attack.type) {
    return res.status(400).json({ error: "Missing 'attack' object with 'type' field." });
  }

  const fallbackText = `Security event "${attack.type}" detected from ${attack.ip || "unknown"}. Recommended: Investigate the source IP in your SIEM, review relevant firewall and authentication logs, and apply appropriate network-level controls if the source is confirmed malicious.`;

  if (!openai) return res.json({ text: fallbackText });

  try {
    const prompt = `As a professional SOC Analyst, briefly analyze this security event:
Type: ${attack.type}
Source IP: ${attack.ip}
Severity: ${attack.severity}
Time: ${attack.time || "recent"}
Country: ${attack.country || "unknown"}

Provide a concise, 2-3 sentence threat analysis and recommended immediate mitigation steps. Keep it strictly professional. Plain text only, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });
    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({ text: fallbackText });
  }
});

// POST /ai-attack-analyzer — FLAGSHIP: deep indicator analysis with real TI
app.post("/ai-attack-analyzer", rateLimitMiddleware(10, 60000), async (req, res) => {
  const { indicator } = req.body;
  if (!indicator || typeof indicator !== 'string' || indicator.trim().length < 4) {
    return res.status(400).json({ error: "Provide a valid indicator (IP, domain, hash, CVE, or URL)." });
  }

  const trimmed = indicator.trim();

  // --- Check against loaded threat intelligence ---
  const matches = [];

  // Check Feodo botnet C2
  if (feodoIPSet.has(trimmed)) {
    const entry = threatIntelPool.find(e => e.ip_address === trimmed);
    matches.push({
      source: "Abuse.ch Feodo Tracker (Botnet C2 Blocklist)",
      type: "Confirmed Botnet Command-and-Control IP",
      detail: entry ? `Malware family: ${entry.malware || "Unknown"}, Country: ${entry.country || "Unknown"}, First seen: ${entry.first_seen || "Unknown"}` : null,
      confidence: "High"
    });
  }

  // Check DShield top attackers
  if (dshieldIPSet.has(trimmed)) {
    const entry = dshieldPool.find(e => e.ipaddr === trimmed);
    matches.push({
      source: "DShield/SANS ISC (Top Attacking IPs)",
      type: "Active Scanner / Attacker",
      detail: entry ? `Reports: ${entry.reports || entry.count || "unknown"}, Country: ${entry.country || "Unknown"}` : null,
      confidence: "High"
    });
  }

  // Check ThreatFox (IPs, domains, URLs)
  if (threatFoxIPSet.has(trimmed)) {
    const entry = [...threatFoxPool].find(e => e.ioc.startsWith(trimmed));
    matches.push({
      source: "Abuse.ch ThreatFox",
      type: entry ? (entry.malware_printable || "Threat IOC") : "Threat IOC",
      detail: entry ? `Type: ${entry.ioc_type}, Confidence: ${entry.confidence_level}/100` : null,
      confidence: "High"
    });
  }
  if (threatFoxDomainSet.has(trimmed)) {
    matches.push({ source: "Abuse.ch ThreatFox", type: "Malicious Domain IOC", detail: `Domain listed as active threat IOC`, confidence: "High" });
  }

  const feedStatus = {
    feodo: threatIntelPool.length > 0,
    threatfox: threatFoxPool.length > 0 || threatFoxDomainSet.size > 0,
    dshield: dshieldPool.length > 0,
    cisa_kev: cisaKevPool.length > 0,
  };

  // Check CISA KEV for CVE indicators
  let cisaMatch = null;
  if (trimmed.match(/^CVE-\d{4}-\d+$/i)) {
    cisaMatch = cisaKevPool.find(v => v.cveID.toLowerCase() === trimmed.toLowerCase());
    if (cisaMatch) {
      matches.push({
        source: "CISA Known Exploited Vulnerabilities (KEV)",
        type: "Actively Exploited Vulnerability",
        detail: `${cisaMatch.vendorProject} ${cisaMatch.product}: ${cisaMatch.shortDescription}. Ransomware use: ${cisaMatch.knownRansomwareCampaignUse}. Required action deadline: ${cisaMatch.dueDate || "N/A"}`,
        confidence: "High"
      });
    }
  }

  const tiSummary = matches.length > 0
    ? matches.map(m => `- ${m.source} [${m.confidence} confidence]: ${m.type}${m.detail ? `. ${m.detail}` : ''}`).join("\n")
    : "No matches found in currently loaded threat intelligence feeds.";

  const feedsChecked = [
    feedStatus.feodo ? "Abuse.ch Feodo Tracker" : null,
    feedStatus.dshield ? "DShield/SANS ISC" : null,
    feedStatus.threatfox ? "Abuse.ch ThreatFox" : null,
    feedStatus.cisa_kev ? "CISA KEV" : null,
  ].filter(Boolean).join(", ") || "No feeds currently loaded";

  if (!openai) {
    return res.json({
      indicator: trimmed,
      matches,
      feedsChecked: feedsChecked,
      feedStatus,
      analysis: `AI analysis unavailable (OPENROUTER_API_KEY not configured). Threat intelligence check completed: ${matches.length} match(es) found in ${feedsChecked}.`,
      disclaimer: "External threat intelligence matches indicate prior observed malicious activity, not a confirmed attack against your infrastructure. IP geolocation is approximate."
    });
  }

  try {
    const prompt = `You are a senior threat intelligence analyst. A SOC analyst has submitted an indicator for investigation.

Indicator: ${trimmed}

Threat Intelligence Findings from loaded feeds (${feedsChecked}):
${tiSummary}

Instructions:
1. Summarize what this indicator likely represents based on the TI findings.
2. Assess the risk level (Low/Medium/High/Critical) and explain your reasoning.
3. Describe what an attacker using this indicator might be doing (stay within what the evidence supports).
4. Give 3-5 specific, actionable investigation steps a SOC analyst should take.
5. Give 2-3 recommended mitigation steps.
6. State clearly what you do NOT know and what additional context would help.
7. Important: Do not fabricate threat actors, victims, or attack details not supported by the evidence. If no TI matches were found, say so clearly and note this does not mean the indicator is safe.

Keep the response structured with clear section headers. Plain text only, no markdown bold or italic. Be concise but thorough.`;

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
    });

    res.json({
      indicator: trimmed,
      matches,
      feedsChecked,
      feedStatus,
      analysis: completion.choices[0].message.content,
      disclaimer: "External threat intelligence matches indicate prior observed malicious activity, not a confirmed attack against your infrastructure. IP geolocation is approximate. AI analysis is probabilistic and should be validated."
    });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({
      indicator: trimmed,
      matches,
      feedsChecked,
      feedStatus,
      analysis: `AI analysis failed. Manual review required. TI check: ${matches.length} match(es) in ${feedsChecked}.`,
      disclaimer: "External threat intelligence matches indicate prior observed malicious activity, not a confirmed attack against your infrastructure."
    });
  }
});

// POST /chat — SOC AI chat assistant (Professional mode)
app.post("/chat", rateLimitMiddleware(30, 60000), async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "Missing 'message'." });

  const fallbackChat = "AI assistant unavailable. Please ensure OPENROUTER_API_KEY is configured in the backend .env file.";
  if (!openai) return res.json({ text: fallbackChat });

  try {
    const formattedHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const systemPrompt = "You are a professional Security Operations Center (SOC) Assistant. Answer cybersecurity questions concisely and expertly. Be precise and practical. Plain text only, no markdown formatting.";
    formattedHistory.unshift({ role: 'system', content: systemPrompt });
    formattedHistory.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: formattedHistory,
      max_tokens: 600,
    });
    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({ text: fallbackChat });
  }
});

// ─────────────────────────────────────────────────────────────
// PERSONAL SECURITY CENTER ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /personal/analyze-message — Scam/phishing message analyzer
app.post("/personal/analyze-message", rateLimitMiddleware(15, 60000), async (req, res) => {
  const { message: userMessage } = req.body;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: "Please provide a message to analyze." });
  }
  if (userMessage.trim().length < 10) {
    return res.status(400).json({ error: "Message is too short to analyze meaningfully." });
  }
  if (userMessage.length > 5000) {
    return res.status(400).json({ error: "Message is too long. Please limit to 5000 characters." });
  }

  const fallback = {
    verdict: "Unable to analyze",
    confidence: "Low",
    riskLevel: "Unknown",
    warningSigns: [],
    evidence: [],
    recommendation: "AI analysis is currently unavailable. Be cautious with any message that requests personal information, creates urgency, or asks you to click unfamiliar links.",
    indianResources: [
      { name: "Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in", description: "Report cybercrime online" },
      { name: "National Cybercrime Helpline", url: null, description: "Call 1930 to report cybercrime" }
    ],
    disclaimer: "This analysis is provided as guidance only. When in doubt, do not respond to suspicious messages."
  };

  if (!openai) return res.json(fallback);

  try {
    const prompt = `You are a cybersecurity expert helping a non-technical person understand whether a message is a scam or phishing attempt.

Message to analyze:
---
${userMessage.substring(0, 3000)}
---

Analyze this message and respond in the following JSON format exactly:
{
  "verdict": "Likely Scam" | "Likely Legitimate" | "Suspicious - Exercise Caution" | "Cannot Determine",
  "confidence": "High" | "Medium" | "Low",
  "riskLevel": "High" | "Medium" | "Low",
  "warningSignsFound": ["list of specific warning signs found in THIS message, e.g. 'Creates artificial urgency with deadline'"],
  "legitimacyIndicators": ["list of factors that suggest this might be legitimate, if any"],
  "specificEvidence": ["quote specific phrases from the message that are suspicious, with explanation"],
  "whatTheyWant": "One sentence describing what the scammer is trying to get, if applicable",
  "recommendation": "Practical advice for this specific message in plain language for a non-technical person",
  "uncertainty": "What you cannot determine from this message alone"
}

Rules:
- Only flag specific things actually present in the message
- Do not label as definitive scam without strong evidence
- HTTPS or professional language alone does NOT make something legitimate
- Be honest about uncertainty
- Respond with JSON only, no other text`;

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    let parsed;
    try {
      const rawText = completion.choices[0].message.content.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return res.json({
        ...fallback,
        recommendation: completion.choices[0].message.content,
        disclaimer: "Analysis completed. JSON formatting error — displaying raw analysis."
      });
    }

    res.json({
      verdict: parsed.verdict || "Cannot Determine",
      confidence: parsed.confidence || "Low",
      riskLevel: parsed.riskLevel || "Unknown",
      warningSignsFound: parsed.warningSignsFound || [],
      legitimacyIndicators: parsed.legitimacyIndicators || [],
      specificEvidence: parsed.specificEvidence || [],
      whatTheyWant: parsed.whatTheyWant || null,
      recommendation: parsed.recommendation || "Exercise caution.",
      uncertainty: parsed.uncertainty || null,
      indianResources: [
        { name: "Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in", description: "Report cybercrime at cybercrime.gov.in" },
        { name: "National Cybercrime Helpline", url: null, description: "Call 1930 to report cybercrime" },
        { name: "RBI Sachet Portal", url: "https://sachet.rbi.org.in", description: "Report financial fraud to RBI" }
      ],
      disclaimer: "This analysis is provided as guidance only. When uncertain, do not share personal information, click unfamiliar links, or make payments. Consult cybercrime.gov.in or call 1930 to report."
    });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json(fallback);
  }
});

// POST /personal/check-url — URL safety checker with SSRF protection and TI lookup
app.post("/personal/check-url", rateLimitMiddleware(10, 60000), async (req, res) => {
  const { url: rawUrl } = req.body;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: "Please provide a URL to check." });
  }

  const trimmedUrl = rawUrl.trim();
  const safeCheck = isSafeUrl(trimmedUrl);
  if (!safeCheck.safe) {
    return res.status(400).json({ error: safeCheck.reason });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL format." });
  }

  const hostname = parsedUrl.hostname;
  const checks = [];

  // Check 1: ThreatFox domain/URL matches
  let threatFoxMatch = false;
  if (threatFoxDomainSet.has(hostname)) {
    checks.push({
      name: "Abuse.ch ThreatFox",
      status: "failed",
      detail: `Domain '${hostname}' is listed as an active threat IOC in ThreatFox.`,
      source: "Abuse.ch ThreatFox"
    });
    threatFoxMatch = true;
  } else if (threatFoxPool.length > 0 || threatFoxDomainSet.size > 0) {
    checks.push({
      name: "Abuse.ch ThreatFox",
      status: "passed",
      detail: `Domain not found in ThreatFox IOC list (${threatFoxDomainSet.size} domains checked).`,
      source: "Abuse.ch ThreatFox"
    });
  } else {
    checks.push({ name: "Abuse.ch ThreatFox", status: "unavailable", detail: "ThreatFox feed not loaded (ABUSE_CH_API_KEY not set).", source: "Abuse.ch ThreatFox" });
  }

  // Check 2: Protocol check
  if (parsedUrl.protocol === "https:") {
    checks.push({ name: "HTTPS Protocol", status: "passed", detail: "Connection uses HTTPS encryption. Note: HTTPS does not guarantee a website is safe, only that communication is encrypted.", source: "URL Analysis" });
  } else {
    checks.push({ name: "HTTPS Protocol", status: "warning", detail: "This URL uses HTTP (unencrypted). Any data you submit could be intercepted.", source: "URL Analysis" });
  }

  // Check 3: URL structure checks
  const suspiciousPatterns = [];
  if (hostname.split('.').length > 4) suspiciousPatterns.push("Excessive subdomains");
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname)) suspiciousPatterns.push("IP address instead of domain name");
  if (hostname.includes("paypal") && !hostname.endsWith("paypal.com")) suspiciousPatterns.push("Possible brand impersonation (PayPal)");
  if (hostname.includes("google") && !hostname.endsWith("google.com")) suspiciousPatterns.push("Possible brand impersonation (Google)");
  if (hostname.includes("amazon") && !hostname.endsWith("amazon.com") && !hostname.endsWith("amazon.in")) suspiciousPatterns.push("Possible brand impersonation (Amazon)");
  if (hostname.includes("bank") || hostname.includes("secure") || hostname.includes("verify") || hostname.includes("update-account")) suspiciousPatterns.push("Domain contains high-risk keywords associated with phishing");
  if (parsedUrl.pathname.includes("..")) suspiciousPatterns.push("Path traversal pattern detected");

  if (suspiciousPatterns.length > 0) {
    checks.push({ name: "URL Structure Analysis", status: "warning", detail: `Suspicious patterns found: ${suspiciousPatterns.join("; ")}.`, source: "Static Analysis" });
  } else {
    checks.push({ name: "URL Structure Analysis", status: "passed", detail: "No obvious structural patterns associated with phishing or malicious URLs detected.", source: "Static Analysis" });
  }

  // AI summary
  let aiSummary = null;
  if (openai) {
    try {
      const tiContext = checks.map(c => `${c.name}: ${c.status.toUpperCase()} — ${c.detail}`).join("\n");
      const prompt = `A user wants to know if this URL is safe to visit: ${trimmedUrl}

Security checks completed:
${tiContext}

In 2-3 plain language sentences, summarize whether this URL appears safe and what the user should do. Be honest about limitations. Do not claim HTTPS makes a site safe. Do not fabricate threat actor or malware details. Plain text only.`;

      const completion = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });
      aiSummary = completion.choices[0].message.content;
    } catch {
      aiSummary = null;
    }
  }

  const hasFailure = checks.some(c => c.status === "failed");
  const hasWarning = checks.some(c => c.status === "warning");

  res.json({
    url: trimmedUrl,
    domain: hostname,
    overallStatus: hasFailure ? "Potentially Dangerous" : hasWarning ? "Exercise Caution" : "No Issues Found",
    checks,
    aiSummary,
    disclaimer: "A clean result does not guarantee a URL is safe. New malicious sites may not yet appear in threat feeds. Use caution when entering personal information on any unfamiliar site.",
    indianResources: [
      { name: "Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in", description: "Report malicious URLs at cybercrime.gov.in" }
    ]
  });
});

// POST /personal/assistant — Plain-language cybersecurity AI assistant
app.post("/personal/assistant", rateLimitMiddleware(20, 60000), async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: "Please provide a question." });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "Message too long. Please limit to 2000 characters." });
  }

  const fallback = "AI assistant is currently unavailable. For cybersecurity help, visit cybercrime.gov.in or call the National Cybercrime Helpline at 1930.";
  if (!openai) return res.json({ text: fallback });

  try {
    const formattedHistory = history.slice(-8).map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const systemPrompt = `You are ShieldOne's cybersecurity assistant, helping everyday internet users in India stay safe online. 
Your audience may not have a technical background. 
- Use simple, clear language without jargon
- Give practical, actionable advice
- When relevant, mention Indian cybercrime reporting resources (cybercrime.gov.in, helpline 1930)
- Be honest about what you don't know
- If asked about scams or fraud, mention that users can report at cybercrime.gov.in or call 1930
- Never provide instructions that could be used to conduct cyberattacks
- Plain text only, no markdown`;

    formattedHistory.unshift({ role: 'system', content: systemPrompt });
    formattedHistory.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: formattedHistory,
      max_tokens: 500,
    });
    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({ text: fallback });
  }
});

// POST /personal/scam-response — Situation-specific guidance after incident
app.post("/personal/scam-response", rateLimitMiddleware(10, 60000), async (req, res) => {
  const { situation } = req.body;
  const validSituations = ["clicked_link", "shared_credentials", "made_payment", "received_message", "suspected_malware"];
  if (!situation || !validSituations.includes(situation)) {
    return res.status(400).json({ error: "Provide a valid situation type." });
  }

  const situationDescriptions = {
    clicked_link: "I clicked a suspicious link",
    shared_credentials: "I shared my password or personal information",
    made_payment: "I made a payment to what may be a scam",
    received_message: "I received a suspicious message and want to know what to do",
    suspected_malware: "I think my device may be infected with malware"
  };

  const fallbackGuidance = {
    clicked_link: { immediateSteps: ["Close the tab immediately", "Do not enter any personal information", "Run a malware scan if you downloaded anything", "Change passwords for important accounts if you entered credentials"], resources: [] },
    shared_credentials: { immediateSteps: ["Change your password on the affected account immediately", "Change the same password on any other accounts where you used it", "Enable two-factor authentication", "Review recent account activity for unauthorized access"], resources: [] },
    made_payment: { immediateSteps: ["Contact your bank immediately and explain the situation", "Request a transaction reversal if possible", "File a report at cybercrime.gov.in or call 1930", "Collect all evidence (screenshots, transaction details)"], resources: [] },
    received_message: { immediateSteps: ["Do not reply, click links, or call numbers in the message", "Do not share personal information", "Report spam to your mobile carrier by forwarding to 1909"], resources: [] },
    suspected_malware: { immediateSteps: ["Disconnect from the internet", "Run your antivirus or antimalware software", "Do not enter passwords until the device is clean", "Consider professional help if issues persist"], resources: [] }
  };

  const commonResources = [
    { name: "Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in", description: "File a report online" },
    { name: "National Cybercrime Helpline", url: null, description: "Call 1930" },
    { name: "RBI Sachet", url: "https://sachet.rbi.org.in", description: "Report financial fraud" }
  ];

  if (!openai) {
    const fb = fallbackGuidance[situation] || { immediateSteps: ["Contact cybercrime.gov.in for help"], resources: [] };
    return res.json({ ...fb, resources: commonResources, disclaimer: "AI unavailable. Contact cybercrime.gov.in or call 1930 for guidance." });
  }

  try {
    const prompt = `A person in India reports: "${situationDescriptions[situation]}"

Give them specific, practical guidance in plain language. Format as JSON:
{
  "immediateSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "whatToDocument": ["what evidence to collect"],
  "avoidDoing": ["what NOT to do that people commonly do wrong"],
  "shortTermActions": ["things to do in the next few days"],
  "reassurance": "A brief, honest statement about the situation and recovery"
}

Rules:
- Be specific and actionable
- Include Indian-specific advice where relevant (RBI, NPCI, cybercrime.gov.in)
- Be honest — if money is lost, recovery is not guaranteed, say so
- Plain JSON only, no other text`;

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
    });

    let parsed;
    try {
      const rawText = completion.choices[0].message.content.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return res.json({
        immediateSteps: ["Contact cybercrime.gov.in or call 1930 for official guidance"],
        resources: commonResources,
        aiGuidance: completion.choices[0].message.content,
        disclaimer: "AI analysis completed. Follow the guidance above and report to cybercrime.gov.in."
      });
    }

    res.json({
      ...parsed,
      resources: commonResources,
      disclaimer: "This guidance is general advice. For financial fraud, contact your bank immediately and file a report at cybercrime.gov.in or call 1930."
    });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    const fb = fallbackGuidance[situation] || { immediateSteps: ["Contact cybercrime.gov.in for help"] };
    res.json({ ...fb, resources: commonResources, disclaimer: "AI unavailable. Contact cybercrime.gov.in or call 1930." });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION ROUTES
// ─────────────────────────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized.");
} else {
  console.warn("WARNING: Supabase keys not set. Auth routes will use in-memory fallback.");
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "shieldone20@gmail.com",
    pass: process.env.SMTP_PASS || ""
  }
});
console.log("Gmail SMTP system initialized.");

async function sendOTP(email, otp, type = "register") {
  const subject = type === "register" ? "Your ShieldOne Verification Code" : "Your ShieldOne Password Reset Code";
  const platformLabel = type === "register" ? "Complete your registration" : "Reset your password";
  const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background: #1a1a1a; padding: 24px 32px; border-bottom: 1px solid #2a2a2a;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">ShieldOne</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #888;">Security Platform</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #ccc; margin-bottom: 24px;">${platformLabel}. Your verification code:</p>
        <div style="background: #1e1e1e; border: 1px solid #2e2e2e; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #666; margin: 0;">This code expires in 15 minutes. Do not share it with anyone.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ShieldOne" <${process.env.SMTP_USER || "shieldone20@gmail.com"}>`,
      to: email,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL] OTP sent to ${email}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email:", error.message);
  }
}

// In-memory user store (used when Supabase is not configured or as supplement)
let mockUsers = [
  {
    email: "admin@soc.corp",
    password: "Password123!",
    name: "Alex Vance",
    phone: "+1 (555) 019-2834",
    roleTitle: "Lead Incident Handler",
    department: "Cyber Threat Defense",
    plan: "professional",
    role: "admin",
    active: true,
    joinedAt: "2024-11-12"
  },
  {
    email: "user@shieldone.io",
    password: "Password123!",
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    emergencyContact: "+91 98765 43210",
    bio: "Student and cybersecurity enthusiast.",
    plan: "personal",
    role: "user",
    active: true,
    joinedAt: "2025-01-15"
  }
];
let mockOtps = [];

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate password strength
function isStrongPassword(password) {
  return password && password.length >= 8;
}

app.post("/auth/register", rateLimitMiddleware(30, 300000), async (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email address" });
  if (!isStrongPassword(password)) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const userPlan = (plan === 'professional') ? 'professional' : 'personal';

  try {
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser && existingUser.active) {
      return res.status(400).json({ error: "Email already registered" });
    }
    if (!existingUser) {
      mockUsers.push({ email, password, active: false, plan: userPlan, role: 'user' });
    } else {
      existingUser.password = password;
      existingUser.plan = userPlan;
    }
  } catch (err) {
    console.error("[AUTH] Unexpected error:", err);
  }

  const otp = generateOTP();
  mockOtps.push({ email, otp, type: "register", created_at: Date.now() });
  console.log(`[AUTH] OTP for ${email}: ${otp}`);
  sendOTP(email, otp, "register").catch(err => console.error("[AUTH] Email error:", err.message));
  res.json({ message: "OTP sent successfully", otp });
});

app.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const now = Date.now();
  // OTPs valid for 15 minutes
  const otpRecord = mockOtps.find(o => o.email === email && o.otp === otp && (now - o.created_at) < 900000);

  if (otpRecord) {
    mockOtps = mockOtps.filter(o => !(o.email === email && o.otp === otp));
    const user = mockUsers.find(u => u.email === email);
    if (user) user.active = true;
    return res.json({ message: "Account verified successfully", token: "mock-jwt-token", plan: user?.plan || 'personal' });
  }
  res.status(400).json({ error: "Invalid or expired OTP" });
});

app.post("/auth/login", rateLimitMiddleware(10, 300000), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.active) return res.status(403).json({ error: "Account not verified. Please complete OTP verification." });

  res.json({ message: "Login successful", token: "mock-jwt-token", plan: user.plan || 'personal', email: user.email });
});

app.post("/auth/forgot-password", rateLimitMiddleware(3, 300000), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const user = mockUsers.find(u => u.email === email && u.active);
  if (user) {
    const otp = generateOTP();
    mockOtps.push({ email, otp, type: "reset", created_at: Date.now() });
    console.log(`[AUTH] Password reset OTP for ${email}: ${otp}`);
    await sendOTP(email, otp, "reset");
  }
  // Always return same response to prevent email enumeration
  res.json({ message: "If the email exists, an OTP was sent." });
});

app.post("/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!newPassword || !isStrongPassword(newPassword)) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const now = Date.now();
  const otpRecord = mockOtps.find(o => o.email === email && o.otp === otp && o.type === 'reset' && (now - o.created_at) < 900000);

  if (otpRecord) {
    mockOtps = mockOtps.filter(o => !(o.email === email && o.otp === otp));
    const user = mockUsers.find(u => u.email === email);
    if (user) user.password = newPassword;
    return res.json({ message: "Password reset successfully" });
  }
  res.status(400).json({ error: "Invalid or expired OTP" });
});

// GET /auth/me — returns current user's plan and profile (used by frontend)
app.get("/auth/me", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email required" });
  let user = mockUsers.find(u => u.email === email && u.active);
  if (!user) {
    user = {
      email,
      name: email.split('@')[0],
      phone: '',
      roleTitle: 'Standard Member',
      department: '',
      emergencyContact: '',
      bio: '',
      plan: 'personal',
      role: 'user',
      active: true,
      joinedAt: new Date().toISOString()
    };
    mockUsers.push(user);
  }
  res.json({
    email: user.email,
    name: user.name || '',
    phone: user.phone || '',
    roleTitle: user.roleTitle || (user.plan === 'professional' ? 'Lead SOC Analyst' : 'Standard Member'),
    department: user.department || (user.plan === 'professional' ? 'Cyber Defense Operations' : ''),
    emergencyContact: user.emergencyContact || '',
    bio: user.bio || '',
    plan: user.plan || 'personal',
    role: user.role || 'user',
    joinedAt: user.joinedAt || '2025-01-15'
  });
});

// PUT /auth/update-profile — update profile fields
app.put("/auth/update-profile", rateLimitMiddleware(20, 300000), (req, res) => {
  const { email, name, phone, roleTitle, department, emergencyContact, bio } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  let user = mockUsers.find(u => u.email === email && u.active);
  if (!user) {
    user = {
      email,
      name: name || email.split('@')[0],
      plan: 'personal',
      active: true,
      joinedAt: new Date().toISOString()
    };
    mockUsers.push(user);
  }
  if (name !== undefined) user.name = name.trim().substring(0, 80);
  if (phone !== undefined) user.phone = phone.trim().substring(0, 30);
  if (roleTitle !== undefined) user.roleTitle = roleTitle.trim().substring(0, 80);
  if (department !== undefined) user.department = department.trim().substring(0, 80);
  if (emergencyContact !== undefined) user.emergencyContact = emergencyContact.trim().substring(0, 50);
  if (bio !== undefined) user.bio = bio.trim().substring(0, 300);
  res.json({
    message: "Profile updated successfully",
    user: {
      name: user.name || '',
      phone: user.phone || '',
      roleTitle: user.roleTitle || '',
      department: user.department || '',
      emergencyContact: user.emergencyContact || '',
      bio: user.bio || '',
      email: user.email
    }
  });
});

// POST /auth/request-password-change — sends OTP to email for password change
app.post("/auth/request-password-change", rateLimitMiddleware(10, 300000), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  let user = mockUsers.find(u => u.email === email && u.active);
  if (!user) {
    user = { email, active: true, plan: 'personal', joinedAt: new Date().toISOString() };
    mockUsers.push(user);
  }
  const otp = generateOTP();
  mockOtps.push({ email, otp, type: "change_password", created_at: Date.now() });
  console.log(`[AUTH] Password change OTP for ${email}: ${otp}`);
  sendOTP(email, otp, "reset").catch(err => console.error("[AUTH] Email error:", err.message));
  res.json({
    message: "OTP sent to your email address.",
    devOtp: otp
  });
});

// POST /auth/confirm-password-change — verify OTP then update password
app.post("/auth/confirm-password-change", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "All fields required" });
  if (!isStrongPassword(newPassword)) return res.status(400).json({ error: "Password must be at least 8 characters" });
  const now = Date.now();
  const otpRecord = mockOtps.find(o => o.email === email && o.otp === otp && o.type === 'change_password' && (now - o.created_at) < 900000);
  if (!otpRecord) return res.status(400).json({ error: "Invalid or expired OTP" });
  mockOtps = mockOtps.filter(o => !(o.email === email && o.otp === otp));
  const user = mockUsers.find(u => u.email === email && u.active);
  if (!user) return res.status(401).json({ error: "User not found" });
  user.password = newPassword;
  res.json({ message: "Password changed successfully" });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${PORT} is already in use by another process. Please terminate any existing server instance.`);
  } else {
    console.error("[ERROR] Server startup failed:", err);
  }
});

server.listen(PORT, () => {
  console.log(`ShieldOne Backend running on http://localhost:${PORT}`);
});