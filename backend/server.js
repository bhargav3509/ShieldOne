require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const nodemailer = require("nodemailer");

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
const PORT = process.env.PORT || 5000;

// --- Initialize OpenRouter API ---
let openai = null;
if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
} else {
  console.warn("WARNING: OPENROUTER_API_KEY is not set in .env. AI features will run in fallback mode.");
}

// Ensure we use a standard model on OpenRouter
const OPENROUTER_MODEL = "google/gemini-2.5-flash";

// --- Middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"] 
      : "*",
  })
);
app.use(express.json());

let threatIntelPool = [];

async function fetchThreatIntel() {
  try {
    const res = await axios.get("https://feodotracker.abuse.ch/downloads/ipblocklist.json");
    if (res.data && Array.isArray(res.data)) {
      threatIntelPool = res.data;
      console.log(`Loaded ${threatIntelPool.length} real threat IPs from Abuse.ch`);
    }
  } catch (err) {
    console.error("Failed to load Abuse.ch threat intel:", err.message);
  }
}
fetchThreatIntel();

// --- In-Memory Stores & Mock Data ---
let attacks = [];
let idCounter = 1;

const attackTypes = ["DDoS", "Brute Force", "Port Scan", "Malware", "Suspicious Login", "Phishing", "Firewall Block", "IDS/IPS Alert"];
const severities = ["low", "medium", "high"];

// Incidents
let incidents = [];
let incidentCounter = 1000;
const analysts = ["Alex T.", "Sam R.", "Jordan K.", "Unassigned"];

// Endpoints
const endpointsStatus = [
  { id: "WKST-001", os: "Windows 11", health: "Healthy", vulns: 0 },
  { id: "WKST-002", os: "Windows 11", health: "Critical", vulns: 3 },
  { id: "SRV-DB-01", os: "Linux Ubuntu", health: "Warning", vulns: 1 },
  { id: "SRV-WEB-02", os: "Linux Debian", health: "Healthy", vulns: 0 },
  { id: "MAC-EXEC-01", os: "macOS Sonoma", health: "Healthy", vulns: 0 }
];

// Threat Intel
const threatIntel = [
  { cve: "CVE-2026-1029", threat: "Zero-day in popular VPN client", severity: "Critical", published: "2h ago" },
  { cve: "APT29", threat: "Targeting financial sector via spearphishing", severity: "High", published: "5h ago" },
  { cve: "CVE-2026-0911", threat: "RCE in internal CRM software", severity: "Medium", published: "1d ago" }
];

// Compliance
const complianceData = {
  overallScore: 82,
  frameworks: [
    { name: "SOC 2 Type II", status: "Compliant" },
    { name: "ISO 27001", status: "Audit Pending" },
    { name: "GDPR", status: "Compliant" },
    { name: "PCI DSS", status: "Non-Compliant" }
  ]
};

// UEBA
const uebaData = [
  { user: "j.doe", action: "Bulk file download", risk: "High", time: "10m ago" },
  { user: "a.smith", action: "Login from new country", risk: "Critical", time: "1h ago" },
  { user: "admin", action: "Privilege escalation detected", risk: "Medium", time: "2h ago" }
];

// Network
const getNetworkData = () => ({
  bandwidthIn: (Math.random() * 2 + 0.5).toFixed(2) + " Gbps",
  bandwidthOut: (Math.random() * 800 + 200).toFixed(0) + " Mbps",
  droppedPackets: Math.floor(Math.random() * 5000 + 10000).toLocaleString(),
  activeConnections: Math.floor(Math.random() * 2000 + 3000)
});

function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateAttack() {
  let severity = severities[Math.floor(Math.random() * severities.length)];
  let type = attackTypes[Math.floor(Math.random() * attackTypes.length)];
  let ip = randomIP();

  if (threatIntelPool.length > 0 && Math.random() > 0.3) {
    // 70% chance to use real botnet data
    const realThreat = threatIntelPool[Math.floor(Math.random() * threatIntelPool.length)];
    ip = realThreat.ip_address;
    type = realThreat.malware || "Malware C2";
    severity = "high";
  }

  const attack = {
    id: idCounter++,
    type,
    ip,
    severity,
    time: new Date().toLocaleTimeString(),
    lat: Math.random() * 160 - 80,
    lng: Math.random() * 360 - 180,
  };

  attacks.push(attack);
  if (attacks.length > 50) attacks.shift();

  // Escalate high severity attacks to incidents randomly
  if (severity === 'high' && Math.random() > 0.6) {
    incidents.push({
      id: `INC-${incidentCounter++}`,
      title: `Escalation: ${type}`,
      status: Math.random() > 0.7 ? "Closed" : "Open",
      analyst: analysts[Math.floor(Math.random() * analysts.length)],
      mttd: `${Math.floor(Math.random() * 10 + 1)}m`,
      mttr: `${Math.floor(Math.random() * 45 + 15)}m`,
      time: attack.time
    });
    if (incidents.length > 20) incidents.shift();
  }

  io.emit('dashboardData', {
    attacks,
    stats: getStats()
  });
}

setInterval(generateAttack, 2000);

// --- Routes ---
app.get("/attacks", (req, res) => res.json(attacks));
app.get("/incidents", (req, res) => res.json(incidents));
app.get("/threat-intel", (req, res) => res.json(threatIntel));
app.get("/endpoints", (req, res) => res.json(endpointsStatus));
app.get("/compliance", (req, res) => res.json(complianceData));
app.get("/ueba", (req, res) => res.json(uebaData));
app.get("/network", (req, res) => res.json(getNetworkData()));



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

app.get("/stats", (req, res) => {
  res.json(getStats());
});

// POST /ai-explain — OpenRouter integration
app.post("/ai-explain", async (req, res) => {
  const { attack } = req.body;

  if (!attack || !attack.type) {
    return res.status(400).json({ error: "Missing 'attack' object with 'type' field." });
  }

  const fallbackText = `[Fallback] Security event "${attack.type}" detected from ${attack.ip || "unknown"}. Recommended: Investigate the source, review logs, and apply appropriate security controls.`;

  if (!openai) {
    return res.json({ text: fallbackText });
  }

  try {
    const prompt = `As a professional SOC Analyst, briefly analyze this security event:
Type: ${attack.type}
Source IP: ${attack.ip}
Severity: ${attack.severity}
Time: ${attack.time || "recent"}

Provide a concise, 2-3 sentence threat analysis and recommended immediate mitigation steps. Keep it strictly professional and do not use markdown formatting like bold or italics if possible, just plain text.`;
    
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({ text: fallbackText });
  }
});

// POST /chat — OpenRouter integration
app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message'." });
  }

  const fallbackChat = "[Fallback] I am your offline SOC Assistant. Please provide a valid OPENROUTER_API_KEY in the backend .env file.";

  if (!openai) {
    return res.json({ text: fallbackChat });
  }

  try {
    // Map frontend history to OpenAI schema
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const systemPrompt = "You are a professional Security Operations Center (SOC) Assistant. Answer the user's cybersecurity questions concisely and expertly. Do not use markdown formatting like bold or italics, just plain text.";
    
    // Add system instruction at the beginning
    formattedHistory.unshift({ role: 'system', content: systemPrompt });
    
    // Append the current message
    formattedHistory.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: formattedHistory,
      max_tokens: 1000,
    });

    res.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenRouter API Error:", error.message);
    res.json({ text: fallbackChat });
  }
});

// --- AUTHENTICATION ROUTES (Supabase) ---
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized.");
} else {
  console.warn("WARNING: Supabase keys not set. Auth routes will fail.");
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Nodemailer Gmail SMTP Setup ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Must be a 16-character App Password
  }
});
console.log("Gmail SMTP system initialized. Waiting for credentials in .env...");

async function sendOTP(email, otp, type = "register") {
  const subject = type === "register" ? "Your SOC Dashboard Verification Code" : "Your SOC Dashboard Password Reset Code";
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>SOC Dashboard</h2>
      <p>Here is your 6-digit verification code:</p>
      <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
      <p>Please enter this code in the dashboard to continue.</p>
    </div>
  `;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER.includes('your_brevo_account_email')) {
    console.log(`[MOCK EMAIL BACKUP - SMTP NOT CONFIGURED] OTP for ${email} is ${otp}`);
    return null;
  }

  try {
    let info = await transporter.sendMail({
      from: `"SOC Dashboard" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    console.log("-----------------------------------------");
    console.log(`✉️ Email successfully sent via Gmail SMTP to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log("-----------------------------------------");
    return null; // Brevo doesn't return a preview URL
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email:", error.message);
    return null;
  }
}

app.post("/auth/register", async (req, res) => {
  console.log(`[AUTH] Received register request for: ${req.body.email}`);
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
  if (!supabase) return res.status(500).json({ error: "Database not configured" });
  
  try {
    const { data: existingUsers, error: fetchErr } = await supabase.from('users').select('*').eq('email', email);
    if (fetchErr) {
      console.error("[SUPABASE ERROR] Failed to fetch user:", fetchErr);
      return res.status(500).json({ error: "Database fetch error" });
    }
    
    if (existingUsers && existingUsers.length > 0 && existingUsers[0].active) {
      console.log(`[AUTH] Email already registered: ${email}`);
      return res.status(400).json({ error: "Email already registered" });
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log(`[AUTH] Creating new user: ${email}`);
      const { error: insertErr } = await supabase.from('users').insert({ email, password, active: false });
      if (insertErr) console.error("[SUPABASE ERROR] Insert user failed:", insertErr);
    } else {
      console.log(`[AUTH] Updating existing pending user: ${email}`);
      const { error: updateErr } = await supabase.from('users').update({ password }).eq('email', email);
      if (updateErr) console.error("[SUPABASE ERROR] Update user failed:", updateErr);
    }
  } catch (err) {
    console.error("[AUTH] Unexpected error:", err);
  }

  const otp = generateOTP();
  await supabase.from('otps').delete().eq('email', email);
  await supabase.from('otps').insert({ email, otp, type: "register" });
  
  console.log(`[MOCK EMAIL BACKUP] OTP for ${email} is ${otp}`);
  
  // Send email asynchronously and wait for URL
  const previewUrl = await sendOTP(email, otp, "register");

  res.json({ message: "OTP sent successfully", previewUrl });
});

app.post("/auth/verify-otp", async (req, res) => {
  console.log(`[AUTH] Received verify-otp request for: ${req.body.email} with OTP: ${req.body.otp}`);
  const { email, otp } = req.body;
  if (!supabase) return res.status(500).json({ error: "Database not configured" });
  
  const { data: otpsData } = await supabase.from('otps').select('*').eq('email', email).eq('otp', otp).order('created_at', { ascending: false });
  
  if (otpsData && otpsData.length > 0) {
    await supabase.from('otps').delete().eq('email', email);
    
    await supabase.from('users').update({ active: true }).eq('email', email);
    return res.json({ message: "Account verified successfully", token: "mock-jwt-token" });
  }
  
  res.status(400).json({ error: "Invalid or expired OTP" });
});

app.post("/auth/login", async (req, res) => {
  console.log(`[AUTH] Received login request for: ${req.body.email}`);
  const { email, password } = req.body;
  if (!supabase) return res.status(500).json({ error: "Database not configured" });
  
  const { data: usersData } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
  const user = usersData && usersData.length > 0 ? usersData[0] : null;
  
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  if (!user.active) {
    return res.status(403).json({ error: "Account not verified. Please complete OTP verification." });
  }

  res.json({ message: "Login successful", token: "mock-jwt-token" });
});

app.post("/auth/forgot-password", async (req, res) => {
  console.log(`[AUTH] Received forgot-password request for: ${req.body.email}`);
  const { email } = req.body;
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { data: usersData } = await supabase.from('users').select('*').eq('email', email).eq('active', true);
  const user = usersData && usersData.length > 0 ? usersData[0] : null;
  
  if (!user) {
    // Return success anyway for security (don't reveal if email exists)
    return res.json({ message: "If the email exists, an OTP was sent." });
  }

  const otp = generateOTP();
  await supabase.from('otps').delete().eq('email', email);
  await supabase.from('otps').insert({ email, otp, type: "reset" });
  
  console.log(`[MOCK EMAIL BACKUP] Password Reset OTP for ${email} is ${otp}`);

  // Send email asynchronously and wait for URL
  const previewUrl = await sendOTP(email, otp, "reset");

  res.json({ message: "If the email exists, an OTP was sent.", previewUrl });
});

app.post("/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!supabase) return res.status(500).json({ error: "Database not configured" });
  
  const { data: otpsData } = await supabase.from('otps').select('*').eq('email', email).eq('otp', otp).eq('type', 'reset').order('created_at', { ascending: false });
  
  if (otpsData && otpsData.length > 0) {
    await supabase.from('otps').delete().eq('email', email);
    await supabase.from('users').update({ password: newPassword }).eq('email', email);
    return res.json({ message: "Password reset successfully" });
  }
  
  res.status(400).json({ error: "Invalid OTP" });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

server.listen(PORT, () => {
  console.log(`SOC Backend running on http://localhost:${PORT}`);
});