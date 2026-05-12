import { useState, useEffect, useRef, useCallback } from "react";
import api from './api/client';
import { downloadCSV } from './utils/exportCSV';
import FeedbackPage from './pages/Feedback';
import OKRPage from './pages/OKR';
import ProjectsPage from './pages/Projects';
import OnboardingPage from './pages/Onboarding';
import ReportsPageFull from './pages/Reports';
import NotificationPanel from './components/NotificationPanel';

// --- Styles ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0b0f;
    --bg2: #12141a;
    --bg3: #1a1d26;
    --bg4: #222535;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #f0f0f0;
    --text2: #9096a8;
    --text3: #5c6278;
    --accent: #6c63ff;
    --accent2: #a78bfa;
    --teal: #00d4aa;
    --amber: #f59e0b;
    --red: #f87171;
    --green: #34d399;
    --pink: #f472b6;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }
  html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; }
  body { font-family: var(--font-body); background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.6; -webkit-font-smoothing: antialiased; }

  .app { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

  /* Sidebar */
  .sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
  .sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid var(--border); }
  .logo-mark { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .logo-icon svg { width: 18px; height: 18px; }
  .logo-text { font-family: var(--font-head); font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent2); }

  .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .nav-section { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); font-weight: 500; padding: 12px 8px 6px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; color: var(--text2); font-size: 13.5px; font-weight: 400; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: rgba(108,99,255,0.15); color: var(--accent2); font-weight: 500; }
  .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; }
  .nav-item.active svg { opacity: 1; }
  .nav-badge { margin-left: auto; background: var(--accent); color: white; font-size: 10px; padding: 1px 6px; border-radius: 20px; font-weight: 500; }

  .sidebar-user { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg3); border-radius: 10px; border: 1px solid var(--border); }
  .avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), var(--pink)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; font-family: var(--font-head); }
  .avatar.teal { background: linear-gradient(135deg, var(--teal), var(--accent)); }
  .avatar.amber { background: linear-gradient(135deg, var(--amber), var(--red)); }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--text3); text-transform: capitalize; }
  .role-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  .role-admin { background: rgba(244, 114, 182, 0.15); color: var(--pink); }
  .role-manager { background: rgba(0,212,170,0.12); color: var(--teal); }
  .role-employee { background: rgba(108,99,255,0.15); color: var(--accent2); }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; width: calc(100vw - 240px); }
  .topbar { padding: 16px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(10,11,15,0.85); backdrop-filter: blur(12px); flex-shrink: 0; }
  .topbar-left h1 { font-family: var(--font-head); font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .topbar-left p { font-size: 12.5px; color: var(--text3); margin-top: 1px; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; font-family: var(--font-body); }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #7c74ff; }
  .btn-ghost { background: var(--bg3); color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { background: var(--bg4); color: var(--text); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-teal { background: rgba(0,212,170,0.15); color: var(--teal); border: 1px solid rgba(0,212,170,0.25); }
  .btn-teal:hover { background: rgba(0,212,170,0.25); }
  .btn-red { background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }

  .content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 28px 32px; width: 100%; }

  /* Cards */
  .card { background: rgba(18,20,26,0.8); border: 1px solid var(--border); border-radius: 14px; padding: 22px; backdrop-filter: blur(8px); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .card:hover { border-color: var(--border2); box-shadow: 0 4px 24px rgba(108,99,255,0.04); }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-family: var(--font-head); font-size: 14px; font-weight: 600; letter-spacing: -0.2px; }
  .card-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

  /* Metrics */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .metric-card { background: rgba(18,20,26,0.8); border: 1px solid var(--border); border-radius: 14px; padding: 22px; position: relative; overflow: hidden; backdrop-filter: blur(8px); transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
  .metric-card:hover { transform: translateY(-2px); border-color: var(--border2); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
  .metric-card.accent::after { background: var(--accent); }
  .metric-card.teal::after { background: var(--teal); }
  .metric-card.amber::after { background: var(--amber); }
  .metric-card.green::after { background: var(--green); }
  .metric-label { font-size: 11.5px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500; }
  .metric-value { font-family: var(--font-head); font-size: 32px; font-weight: 800; margin: 6px 0 4px; letter-spacing: -1px; }
  .metric-value.accent { color: var(--accent2); }
  .metric-value.teal { color: var(--teal); }
  .metric-value.amber { color: var(--amber); }
  .metric-value.green { color: var(--green); }
  .metric-delta { font-size: 12px; display: flex; align-items: center; gap: 4px; }
  .delta-up { color: var(--green); }
  .delta-down { color: var(--red); }

  /* Grid layouts */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .col-span-2 { grid-column: span 2; }
  .mb16 { margin-bottom: 16px; }
  .mb24 { margin-bottom: 24px; }
  .flex { display: flex; }
  .flex-center { display: flex; align-items: center; }
  .gap8 { gap: 8px; }
  .gap12 { gap: 12px; }
  .ml-auto { margin-left: auto; }

  /* Chart containers */
  .chart-wrap { position: relative; width: 100%; }

  /* Table */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text3); border-bottom: 1px solid var(--border); font-weight: 600; }
  tbody td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: var(--bg3); }
  .td-name { display: flex; align-items: center; gap: 10px; }

  /* Progress bars */
  .progress-bar { height: 6px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .fill-accent { background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .fill-teal { background: linear-gradient(90deg, var(--teal), #00b8d9); }
  .fill-amber { background: linear-gradient(90deg, var(--amber), #fbbf24); }
  .fill-green { background: linear-gradient(90deg, var(--green), #6ee7b7); }
  .fill-red { background: linear-gradient(90deg, var(--red), #fca5a5); }

  /* Stat pill */
  .stat-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; gap: 4px; }
  .pill-green { background: rgba(52,211,153,0.12); color: var(--green); }
  .pill-amber { background: rgba(245,158,11,0.12); color: var(--amber); }
  .pill-red { background: rgba(248,113,113,0.12); color: var(--red); }
  .pill-accent { background: rgba(108,99,255,0.12); color: var(--accent2); }

  /* Stars */
  .stars { display: flex; gap: 2px; }
  .star { color: var(--amber); font-size: 13px; }
  .star.empty { color: var(--bg4); }

  /* Login screen */
  .login-screen { display: flex; height: 100vh; align-items: center; justify-content: center; background: var(--bg); }
  .login-card { background: var(--bg2); border: 1px solid var(--border2); border-radius: 20px; padding: 40px; width: 400px; }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .login-logo-icon { width: 44px; height: 44px; background: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .login-title { font-family: var(--font-head); font-size: 22px; font-weight: 800; }
  .login-sub { font-size: 13px; color: var(--text3); margin-top: 4px; }
  .input-group { margin-bottom: 16px; }
  .input-label { font-size: 12px; color: var(--text2); margin-bottom: 6px; display: block; font-weight: 500; }
  .input-field { width: 100%; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 13.5px; outline: none; transition: border 0.15s; font-family: var(--font-body); }
  .input-field:focus { border-color: var(--accent); }
  .login-roles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 24px; }
  .role-btn { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 12px 8px; text-align: center; cursor: pointer; transition: all 0.15s; }
  .role-btn:hover, .role-btn.selected { border-color: var(--accent); background: rgba(108,99,255,0.1); }
  .role-btn-icon { font-size: 20px; margin-bottom: 4px; }
  .role-btn-name { font-size: 12px; font-weight: 500; color: var(--text2); }
  .role-btn.selected .role-btn-name { color: var(--accent2); }

  /* Prediction card */
  .pred-card { background: linear-gradient(135deg, rgba(108,99,255,0.15), rgba(167,139,250,0.08)); border: 1px solid rgba(108,99,255,0.25); border-radius: 14px; padding: 20px; }
  .pred-score { font-family: var(--font-head); font-size: 48px; font-weight: 800; color: var(--accent2); letter-spacing: -2px; }
  .pred-bar-track { height: 8px; background: var(--bg4); border-radius: 4px; margin: 12px 0; overflow: hidden; }
  .pred-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2), var(--pink)); border-radius: 4px; }

  /* Tag */
  .tag { display: inline-flex; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: var(--bg4); color: var(--text2); }

  /* Select */
  select { background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 8px 12px; color: var(--text); font-size: 13px; outline: none; cursor: pointer; font-family: var(--font-body); }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: var(--bg2); border: 1px solid var(--border2); border-radius: 18px; padding: 28px; width: 500px; max-width: 95vw; }
  .modal-title { font-family: var(--font-head); font-size: 17px; font-weight: 700; margin-bottom: 20px; }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }

  /* Form row */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .form-col { display: flex; flex-direction: column; gap: 6px; }

  /* Range input */
  input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; background: var(--bg4); border-radius: 2px; outline: none; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; }
  .range-val { font-size: 13px; font-weight: 600; color: var(--accent2); min-width: 32px; text-align: right; }

  /* Insight card */
  .insight { display: flex; gap: 12px; padding: 14px; background: var(--bg3); border-radius: 10px; border-left: 3px solid var(--accent); margin-bottom: 10px; }
  .insight-icon { font-size: 20px; flex-shrink: 0; }
  .insight-text { font-size: 13px; line-height: 1.5; color: var(--text2); }
  .insight-text strong { color: var(--text); }

  /* Dot indicator */
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
  .dot-amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .dot-red { background: var(--red); box-shadow: 0 0 8px var(--red); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }

  /* Responsive */
  @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } .grid-3 { grid-template-columns: 1fr; } }
  @media (max-width: 600px) { .sidebar { display: none; } .main { width: 100vw; } .metrics-grid { grid-template-columns: 1fr 1fr; } .content { padding: 16px; } }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .card, .metric-card { animation: fadeIn 0.3s ease; }
  .modal-overlay { animation: fadeIn 0.15s ease; }
  .btn { transition: all 0.15s ease; }
  .btn:active { transform: scale(0.97); }
  .nav-item { transition: all 0.15s ease; }

  /* Glassmorphism accents */
  .pred-card { backdrop-filter: blur(12px); }
  .modal { backdrop-filter: blur(20px); background: rgba(18,20,26,0.95); }
`;

// --- Icon Component ---
const ICON_PATHS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  file: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  people: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  plus: "M12 4v16m8-8H4",
  trending: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  brain: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  target: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  briefcase: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  message: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  flag: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z",
  box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const Icon = ({ name, size = 18, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {(ICON_PATHS[name] || "").split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
  </svg>
);

const ScorePill = ({ score }) => {
  const cls = score >= 90 ? 'pill-green' : score >= 75 ? 'pill-amber' : 'pill-red';
  return <span className={`stat-pill ${cls}`}>{score}%</span>;
};

const Stars = ({ rating }) => (
  <div className="stars">
    {[1,2,3,4,5].map(n => <span key={n} className={`star ${n <= Math.round(rating) ? '' : 'empty'}`}>&#9733;</span>)}
  </div>
);

// --- Chart Components ---
const LineChart = ({ data, labels, colors = ['#6c63ff','#00d4aa','#f59e0b'], height = 200 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: data.map((d, i) => ({
          label: d.label, data: d.values, borderColor: colors[i],
          backgroundColor: colors[i] + '18', borderWidth: 2, pointRadius: 4,
          pointHoverRadius: 6, tension: 0.4, fill: true,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1d26', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#f0f0f0', bodyColor: '#9096a8', padding: 10, cornerRadius: 8 } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c6278', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c6278', font: { size: 11 }, callback: v => v + '%' }, min: 0, max: 100 },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, labels]);

  return <div className="chart-wrap" style={{ height }}><canvas ref={canvasRef} /></div>;
};

const BarChart = ({ data, labels, height = 200 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: data.map((d, i) => ({
          label: d.label, data: d.values,
          backgroundColor: ['#6c63ff', '#00d4aa', '#f59e0b', '#f472b6'][i] + 'bb',
          borderColor: ['#6c63ff', '#00d4aa', '#f59e0b', '#f472b6'][i],
          borderWidth: 1, borderRadius: 6, borderSkipped: false,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1d26', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#f0f0f0', bodyColor: '#9096a8', padding: 10, cornerRadius: 8 } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c6278', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c6278', font: { size: 11 } }, min: 0, max: 100 },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, labels]);

  return <div className="chart-wrap" style={{ height }}><canvas ref={canvasRef} /></div>;
};

const RadarChart = ({ metrics, height = 220 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Tasks', 'Productivity', 'Attendance', 'Rating', 'Quality'],
        datasets: [{
          label: 'Score',
          data: [metrics.tasks, metrics.productivity, metrics.attendance, metrics.rating * 20, 88],
          backgroundColor: 'rgba(108,99,255,0.15)', borderColor: '#6c63ff',
          borderWidth: 2, pointBackgroundColor: '#6c63ff', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
            ticks: { display: false },
            pointLabels: { color: '#9096a8', font: { size: 11 } },
            suggestedMin: 0, suggestedMax: 100,
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [metrics]);

  return <div className="chart-wrap" style={{ height }}><canvas ref={canvasRef} /></div>;
};

// --- Login Screen ---
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'admin', label: 'Admin', icon: 'shield' },
    { id: 'manager', label: 'Manager', icon: 'briefcase' },
    { id: 'employee', label: 'Employee', icon: 'user' },
  ];

  const credentials = {
    admin:    { email: 'admin@acme.com',   password: 'Admin@123' },
    manager:  { email: 'marcus@acme.com',  password: 'Manager@123' },
    employee: { email: 'jordan@acme.com',  password: 'Employee@123' },
  };

  useEffect(() => {
    const c = credentials[role];
    if (c) { setEmail(c.email); setPassword(c.password); }
  }, [role]);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('pt_access', access);
      localStorage.setItem('pt_refresh', refresh);
      onLogin(userData);
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Icon name="trending" size={24} color="white" /></div>
          <div><div className="login-title">Perf<span style={{color:'var(--accent2)'}}>Track</span></div><div className="login-sub">HR Performance Analytics</div></div>
        </div>

        <div className="login-roles">
          {roles.map(r => (
            <div key={r.id} className={`role-btn ${role === r.id ? 'selected' : ''}`} onClick={() => setRole(r.id)}>
              <div className="role-btn-icon"><Icon name={r.icon} size={20} color={role === r.id ? 'var(--accent2)' : 'var(--text3)'} /></div>
              <div className="role-btn-name">{r.label}</div>
            </div>
          ))}
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {error && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'var(--red)' }}>{error}</div>}

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 0', fontSize:14 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

// --- Admin Dashboard ---
const AdminDashboard = ({ user }) => {
  const [summary, setSummary] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, compRes] = await Promise.all([
          api.get('/dashboard/summary/'),
          api.get('/reports/company/'),
        ]);
        setSummary(sumRes.data);
        setCompanyData(compRes.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading dashboard...</div>;

  const s = summary || {};
  const deptStats = companyData?.department_stats || [];
  const topPerformers = companyData?.top_performers || [];
  const needsAttention = companyData?.needs_attention || [];
  const periodTrend = companyData?.period_trend || [];
  const avgTask = deptStats.length > 0 ? deptStats.reduce((a,d) => a + (d.avg_task||0), 0) / deptStats.length : 0;
  const avgAttend = deptStats.length > 0 ? Math.round(deptStats.reduce((a,d) => a + (d.avg_attend||0), 0) / deptStats.length) : 0;

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-label">Total Employees</div>
          <div className="metric-value accent">{s.total_employees||0}</div>
          <div className="metric-delta" style={{color:'var(--text3)'}}>Active workforce</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">Avg Task Score</div>
          <div className="metric-value teal">{Math.round(avgTask)}%</div>
          <div className="metric-delta delta-up">Company average</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Evaluations</div>
          <div className="metric-value amber">{s.total_evaluations||0}</div>
          <div className="metric-delta" style={{color:'var(--text3)'}}>Total records</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Departments</div>
          <div className="metric-value green">{deptStats.length}</div>
          <div className="metric-delta" style={{color:'var(--text3)'}}>Active teams</div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="grid-2 mb24">
        <div className="card">
          <div className="card-header"><div className="card-title">Department Scores</div></div>
          {deptStats.length > 0 ? (
            <BarChart data={[{label:'Task Completion',values:deptStats.map(d=>Math.round(d.avg_task||0))},{label:'Productivity',values:deptStats.map(d=>Math.round(d.avg_prod||0))}]} labels={deptStats.map(d=>d.department__name||'N/A')} height={200}/>
          ) : <div style={{padding:20,color:'var(--text3)'}}>No department data</div>}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Performance Distribution</div></div>
          {deptStats.map(d => (
            <div key={d.department__name} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,color:'var(--text2)'}}>{d.department__name||'N/A'}</span>
                <span style={{fontSize:13,fontWeight:600,color:'var(--accent2)'}}>{Math.round(d.avg_task||0)}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fill-accent" style={{width:`${d.avg_task||0}%`}}></div></div>
            </div>
          ))}
          {deptStats.length === 0 && <div style={{padding:20,color:'var(--text3)'}}>No data yet</div>}
        </div>
      </div>

      {/* Top Performers + Attendance */}
      <div className="grid-2 mb24">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Performers</div>
            <span className="tag">{topPerformers.length}</span>
          </div>
          {topPerformers.length === 0 && <div style={{padding:16,color:'var(--text3)',textAlign:'center'}}>No data yet</div>}
          {topPerformers.slice(0,5).map((p,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<Math.min(topPerformers.length,5)-1?'1px solid var(--border)':'none'}}>
              <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:i===0?'var(--amber)':i===1?'#888':'var(--bg4)',color:'white'}}>{i+1}</div>
              <div className="avatar teal" style={{width:30,height:30,fontSize:10}}>{p.employee__avatar_initials||(p.employee__first_name||'?')[0]}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{p.employee__first_name} {p.employee__last_name||''}</div></div>
              <span className="stat-pill pill-green">{Math.round(p.avg_task||0)}%</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Attendance by Period</div></div>
          {periodTrend.length > 0 ? (
            <BarChart data={[{label:'Attendance',values:periodTrend.map(p=>Math.round(p.avg_attend||0))}]} labels={periodTrend.map(p=>p.period__name||'-')} height={180}/>
          ) : <div style={{padding:20,color:'var(--text3)'}}>No attendance data</div>}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="card mb24">
        <div className="card-header">
          <div className="card-title">Needs Attention</div>
          <span className="tag">{needsAttention.length} employees</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Avg Task Completion</th><th>Status</th></tr></thead>
            <tbody>
              {needsAttention.length === 0 && <tr><td colSpan={3} style={{textAlign:'center',color:'var(--text3)',padding:20}}>All employees performing well</td></tr>}
              {needsAttention.map((e,i) => (
                <tr key={i}>
                  <td><div className="td-name"><div className="avatar amber" style={{width:30,height:30,fontSize:10}}>{(e.employee__first_name||'?')[0]}{(e.employee__last_name||'?')[0]}</div><span style={{fontWeight:500}}>{e.employee__first_name} {e.employee__last_name}</span></div></td>
                  <td><ScorePill score={Math.round(e.avg_task||0)} /></td>
                  <td><span className="stat-pill pill-red">Below Threshold</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>AI Performance Insights</div>
        <div className="insight">
          <div className="insight-icon"><Icon name="trending" size={20} color="var(--accent2)" /></div>
          <div className="insight-text"><strong>Company health:</strong> {s.total_employees||0} active employees across {deptStats.length} departments. Average task completion is {Math.round(avgTask)}%.</div>
        </div>
        {topPerformers[0] && <div className="insight">
          <div className="insight-icon"><Icon name="star" size={20} color="var(--amber)" /></div>
          <div className="insight-text"><strong>Top performer:</strong> {topPerformers[0].employee__first_name} leads with {Math.round(topPerformers[0].avg_task||0)}% task completion.</div>
        </div>}
        <div className="insight">
          <div className="insight-icon"><Icon name="target" size={20} color="var(--red)" /></div>
          <div className="insight-text"><strong>Action items:</strong> {needsAttention.length} employee{needsAttention.length!==1?'s':''} below the 75% threshold need coaching.</div>
        </div>
        <div className="insight">
          <div className="insight-icon"><Icon name="chart" size={20} color="var(--teal)" /></div>
          <div className="insight-text"><strong>Attendance:</strong> Company average is {avgAttend}%. {avgAttend>=90?'Excellent across all teams.':'Some teams may need review.'}</div>
        </div>
      </div>
    </>
  );
};

// --- User Management ---
const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newUser, setNewUser] = useState({ first_name:'', last_name:'', email:'', role:'employee', password:'Temp@1234' });

  const fetchUsers = async () => { try { const r = await api.get('/users/'); setUsers(r.data.results || r.data); } catch(e) { console.error(e); } setLoading(false); };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => { try { await api.post('/users/', newUser); await fetchUsers(); setShowModal(false); setNewUser({ first_name:'', last_name:'', email:'', role:'employee', password:'Temp@1234' }); } catch(e) { console.error(e); } };
  const handleEdit = async () => { if (!editUser) return; try { await api.patch(`/users/${editUser.id}/`, { first_name: editUser.first_name, last_name: editUser.last_name, role: editUser.role }); await fetchUsers(); setEditUser(null); } catch(e) { console.error(e); } };
  const handleToggleActive = async (u) => { try { await api.patch(`/users/${u.id}/`, { is_active: !u.is_active }); await fetchUsers(); } catch(e) { console.error(e); } };

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading users...</div>;

  const filtered = users.filter(u => { const ms = !search || (u.full_name||'').toLowerCase().includes(search.toLowerCase()) || (u.email||'').toLowerCase().includes(search.toLowerCase()); const mr = roleFilter === 'all' || u.role === roleFilter; return ms && mr; });
  const admins = users.filter(u => u.role === 'admin').length;
  const managers = users.filter(u => u.role === 'manager').length;
  const emps = users.filter(u => u.role === 'employee').length;

  return (
    <>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent"><div className="metric-label">Total Users</div><div className="metric-value accent">{users.length}</div></div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--pink)' }}><div className="metric-label">Admins</div><div className="metric-value" style={{ fontSize: 28, color: 'var(--pink)' }}>{admins}</div></div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--teal)' }}><div className="metric-label">Managers</div><div className="metric-value teal" style={{ fontSize: 28 }}>{managers}</div></div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--accent2)' }}><div className="metric-label">Employees</div><div className="metric-value accent" style={{ fontSize: 28 }}>{emps}</div></div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">User Management</div><div className="card-sub">Manage all system users and permissions</div></div><button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={14} color="white" /> Add User</button></div>
        <div style={{ display:'flex', gap:12, marginBottom:16 }}>
          <input className="input-field" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, padding:'8px 14px' }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ minWidth:120 }}><option value="all">All Roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="employee">Employee</option></select>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:20}}>No users match filters</td></tr>}
            {filtered.map(u => (
              <tr key={u.id}>
                <td><div className="td-name"><div className={`avatar ${u.role==='manager'?'teal':u.role==='admin'?'':'amber'}`} style={{width:34,height:34,fontSize:11}}>{u.avatar_initials||'?'}</div><div><div style={{fontWeight:500}}>{u.full_name}</div><div style={{fontSize:11.5,color:'var(--text3)'}}>{u.email}</div></div></div></td>
                <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                <td style={{color:'var(--text2)',fontSize:13}}>{u.department_name||'-'}</td>
                <td style={{fontSize:12,color:'var(--text3)'}}>{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '-'}</td>
                <td><div className="flex-center gap8"><div className={`dot ${u.is_active?'dot-green':'dot-red'}`}></div><span style={{fontSize:12,color:'var(--text2)'}}>{u.is_active?'Active':'Inactive'}</span></div></td>
                <td><div className="flex gap8"><button className="btn btn-ghost btn-sm" onClick={() => setEditUser({id:u.id, first_name:u.first_name||'', last_name:u.last_name||'', role:u.role})}><Icon name="eye" size={13} /> Edit</button><button className={`btn btn-sm ${u.is_active?'btn-red':'btn-teal'}`} onClick={() => handleToggleActive(u)} style={{padding:'4px 10px',fontSize:11}}>{u.is_active?'Deactivate':'Activate'}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-title">Add New User</div><div className="form-row"><div className="form-col"><label className="input-label">First Name</label><input className="input-field" value={newUser.first_name} onChange={e => setNewUser({...newUser, first_name: e.target.value})} placeholder="John" /></div><div className="form-col"><label className="input-label">Last Name</label><input className="input-field" value={newUser.last_name} onChange={e => setNewUser({...newUser, last_name: e.target.value})} placeholder="Doe" /></div></div><div className="input-group" style={{marginBottom:14}}><label className="input-label">Email</label><input className="input-field" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="user@company.com" /></div><div className="form-row"><div className="form-col"><label className="input-label">Role</label><select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div><div className="form-col"><label className="input-label">Department</label><select value={newUser.dept} onChange={e => setNewUser({...newUser, dept: e.target.value})}><option>Engineering</option><option>Design</option><option>Management</option></select></div></div><div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><Icon name="check" size={14} color="white" /> Create User</button></div></div></div>)}
      {editUser && (<div className="modal-overlay" onClick={() => setEditUser(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-title">Edit User</div><div className="form-row"><div className="form-col"><label className="input-label">First Name</label><input className="input-field" value={editUser.first_name} onChange={e => setEditUser({...editUser, first_name: e.target.value})} /></div><div className="form-col"><label className="input-label">Last Name</label><input className="input-field" value={editUser.last_name} onChange={e => setEditUser({...editUser, last_name: e.target.value})} /></div></div><div className="form-col" style={{marginBottom:14}}><label className="input-label">Role</label><select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div><div className="modal-footer"><button className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button><button className="btn btn-primary" onClick={handleEdit}><Icon name="check" size={14} color="white" /> Save Changes</button></div></div></div>)}
    </>
  );
};

// --- Manager Dashboard ---
const ManagerDashboard = ({ user }) => {
  const [summary, setSummary] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const load = async () => { try { const [sumRes, teamRes] = await Promise.all([api.get('/dashboard/summary/'), api.get('/reports/team/')]); setSummary(sumRes.data); setTeamData(teamRes.data); } catch (e) { console.error(e); } setLoading(false); }; load(); }, []);

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading dashboard...</div>;

  const s = summary || {};
  const teamSize = s.team_size || teamData.length || 0;
  const avgTask = s.team_averages?.avg_task || 0;
  const lowPerformers = s.low_performers || 0;
  const sorted = [...teamData].sort((a, b) => (b.avg_task || 0) - (a.avg_task || 0));
  const topName = sorted[0]?.full_name?.split(' ')[0] || '-';

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card accent"><div className="metric-label">Team Size</div><div className="metric-value accent">{teamSize}</div><div className="metric-delta" style={{color:'var(--text3)'}}>Direct reports</div></div>
        <div className="metric-card teal"><div className="metric-label">Team Avg Tasks</div><div className="metric-value teal">{Math.round(avgTask)}%</div><div className="metric-delta delta-up">Team average</div></div>
        <div className="metric-card amber"><div className="metric-label">Needs Attention</div><div className="metric-value amber">{lowPerformers}</div><div className="metric-delta delta-down">Below threshold</div></div>
        <div className="metric-card green"><div className="metric-label">Top Performer</div><div className="metric-value green" style={{fontSize:18,marginTop:10}}>{topName}</div><div className="metric-delta delta-up">Highest score</div></div>
      </div>
      <div className="card mb24">
        <div className="card-header"><div className="card-title">Team Performance Comparison</div><div className="flex gap8">{['Tasks','Productivity'].map((l,i) => (<div key={l} className="flex-center gap8"><span style={{width:10,height:10,borderRadius:2,background:['#6c63ff','#00d4aa'][i],display:'inline-block'}}></span><span style={{fontSize:12,color:'var(--text2)'}}>{l}</span></div>))}</div></div>
        {teamData.length > 0 ? (<BarChart data={[{ label: 'Task Completion', values: teamData.map(e => Math.round(e.avg_task || 0)) },{ label: 'Productivity', values: teamData.map(e => Math.round(e.avg_prod || 0)) }]} labels={teamData.map(e => (e.full_name || '').split(' ')[0])} height={200} />) : <div style={{padding:20,color:'var(--text3)'}}>No team data yet</div>}
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Team Members</div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Dept</th><th>Tasks</th><th>Productivity</th><th>Attendance</th><th>Rating</th></tr></thead>
          <tbody>
            {teamData.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:20}}>No team members found</td></tr>}
            {teamData.map(e => { const tasks = Math.round(e.avg_task || 0); const si = tasks >= 90 ? {dot:'dot-green',text:'Excellent'} : tasks >= 75 ? {dot:'dot-amber',text:'Good'} : {dot:'dot-red',text:'Needs Work'}; return (
              <tr key={e.id}><td><div className="td-name"><div className="avatar amber" style={{width:30,height:30,fontSize:10}}>{e.avatar_initials || (e.full_name||'?')[0]}</div><div><div style={{fontWeight:500,fontSize:13.5}}>{e.full_name}</div><div className="flex-center gap8" style={{marginTop:3}}><div className={`dot ${si.dot}`}></div><span style={{fontSize:11,color:'var(--text3)'}}>{si.text}</span></div></div></div></td><td style={{fontSize:12.5,color:'var(--text2)'}}>{e.department || '-'}</td><td><ScorePill score={tasks} /></td><td><ScorePill score={Math.round(e.avg_prod || 0)} /></td><td><ScorePill score={Math.round(e.avg_attend || 0)} /></td><td>{e.avg_rating ? <Stars rating={e.avg_rating} /> : <span style={{color:'var(--text3)'}}>-</span>}</td></tr>
            ); })}
          </tbody>
        </table></div>
      </div>
    </>
  );
};

// --- Evaluate Page ---
const EvaluatePage = ({ user }) => {
  const [team, setTeam] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ employee:'', period:'', task_completion:75, productivity:75, attendance:90, rating:4.0 });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { const load = async () => { try { const [t, p] = await Promise.all([api.get('/team/'), api.get('/periods/')]); setTeam(t.data.results || t.data || []); setPeriods(p.data.results || p.data || []); } catch(e) { console.error(e); } setLoading(false); }; load(); }, []);

  const handleSubmit = async () => {
    if (!form.employee || !form.period) return;
    setSubmitting(true);
    try {
      const res = await api.post('/performance/', { employee: Number(form.employee), period: Number(form.period), task_completion: form.task_completion, productivity_score: form.productivity, attendance_percentage: form.attendance, manager_rating: form.rating });
      setResult(res.data);
    } catch(e) { console.error(e); }
    setSubmitting(false);
  };

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading...</div>;

  return (
    <>
      <div className="grid-2 mb24">
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Performance Metrics</div>
          <div className="form-row"><div className="form-col"><label className="input-label">Employee</label><select value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}><option value="">Select employee...</option>{team.map(e => <option key={e.id} value={e.id}>{e.full_name || e.email}</option>)}</select></div><div className="form-col"><label className="input-label">Period</label><select value={form.period} onChange={e => setForm({...form, period: e.target.value})}><option value="">Select period...</option>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
          {[{key:'task_completion',label:'Task Completion'},{key:'productivity',label:'Productivity'},{key:'attendance',label:'Attendance'}].map(m => (
            <div key={m.key} style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="input-label">{m.label}</label><span className="range-val">{form[m.key]}%</span></div><input type="range" min={0} max={100} value={form[m.key]} onChange={e => setForm({...form, [m.key]: Number(e.target.value)})} /><div className="progress-bar" style={{marginTop:6}}><div className="progress-fill fill-accent" style={{width:`${form[m.key]}%`}}></div></div></div>
          ))}
          <div style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="input-label">Manager Rating</label><span className="range-val">{form.rating}/5</span></div><input type="range" min={1} max={5} step={0.5} value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})} /></div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:12}} onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Evaluation'}</button>
        </div>
        <div className="card" style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}>
          {result ? (<>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--accent2)',fontWeight:600,marginBottom:8}}>AI Prediction</div>
            <div className="pred-score">{result.predicted_score || result.ai_predicted_score || '-'}%</div>
            <div className="pred-bar-track" style={{width:'100%',margin:'16px 0'}}><div className="pred-bar-fill" style={{width:`${result.predicted_score || result.ai_predicted_score || 0}%`}}></div></div>
            <div style={{fontSize:13,color:'var(--text2)'}}>Based on linear regression model analysis</div>
          </>) : (<div style={{color:'var(--text3)',fontSize:14}}>Submit an evaluation to see AI prediction</div>)}
        </div>
      </div>
    </>
  );
};

// --- Employee Dashboard ---
const EmployeeDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const load = async () => { try { const r = await api.get(`/employees/${user.id}/stats/`); setStats(r.data); } catch(e) { console.error(e); } setLoading(false); }; load(); }, [user.id]);

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading your metrics...</div>;
  if (!stats) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>No performance data available yet</div>;

  const c = {
    tasks: Math.round(stats.current?.task_completion ?? stats.avg_task ?? 0),
    productivity: Math.round(stats.current?.productivity_score ?? stats.avg_prod ?? 0),
    attendance: Math.round(stats.current?.attendance_percentage ?? stats.avg_attend ?? 0),
    rating: stats.current?.manager_rating ?? stats.avg_rating ?? 0,
  };
  const predicted = stats?.latest_prediction || Math.round(c.tasks * 0.35 + c.productivity * 0.3 + c.attendance * 0.2 + c.rating * 20 * 0.15);

  const insights = [
    { icon: 'target', text: <><strong>Task completion</strong> is at {c.tasks}%. {c.tasks >= 80 ? 'Great performance - keep it up!' : 'Room for improvement. Focus on delivery cadence.'}</> },
    { icon: 'trending', text: <><strong>Predicted next month:</strong> {predicted}% based on your trend. The regression model forecasts your trajectory.</> },
    { icon: 'brain', text: <><strong>Attendance</strong> at {c.attendance}% is {c.attendance >= 90 ? 'excellent' : 'needs attention'}. Consistency is key to high performance.</> },
  ];

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card accent"><div className="metric-label">Task Completion</div><div className="metric-value accent">{c.tasks}%</div><div className="metric-delta delta-up">Current period</div></div>
        <div className="metric-card teal"><div className="metric-label">Productivity</div><div className="metric-value teal">{c.productivity}%</div><div className="metric-delta delta-up">Current period</div></div>
        <div className="metric-card amber"><div className="metric-label">Attendance</div><div className="metric-value amber">{c.attendance}%</div></div>
        <div className="metric-card green"><div className="metric-label">Manager Rating</div><div className="metric-value green">{c.rating.toFixed?.(1) || c.rating}/5</div></div>
      </div>

      <div className="grid-2 mb24">
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Performance Radar</div>
          <RadarChart metrics={c} height={220} />
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>AI Insights</div>
          {insights.map((ins, i) => (
            <div key={i} className="insight">
              <div className="insight-icon"><Icon name={ins.icon} size={20} color="var(--accent2)" /></div>
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
          <div className="pred-card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 4 }}>Predicted Next Month</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--accent2)', letterSpacing: '-1px' }}>{predicted}%</div>
          </div>
        </div>
      </div>

      {stats.history && stats.history.length > 0 && (
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>Performance History</div>
          <LineChart data={[{label:'Tasks',values:stats.history.map(h=>h.task_completion||0)},{label:'Productivity',values:stats.history.map(h=>h.productivity_score||0)}]} labels={stats.history.map(h=>h.period_name||h.period||'')} height={180} />
        </div>
      )}
    </>
  );
};

// --- Performance Page ---
const PerformancePage = ({ user }) => {
  const [team, setTeam] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const load = async () => { try { const r = await api.get('/team/'); const t = r.data.results || r.data || []; setTeam(t); if (t.length > 0) setSelected(t[0].id); } catch(e) { console.error(e); } setLoading(false); }; load(); }, []);
  useEffect(() => { if (!selected) return; const load = async () => { try { const r = await api.get(`/employees/${selected}/stats/`); setStats(r.data); } catch(e) { console.error(e); setStats(null); } }; load(); }, [selected]);

  if (loading) return <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Loading...</div>;

  const p = stats || {};
  const c = { tasks: Math.round(p.avg_task || 0), productivity: Math.round(p.avg_prod || 0), attendance: Math.round(p.avg_attend || 0), rating: p.avg_rating || 0 };

  return (
    <>
      <div className="flex gap12 mb24" style={{flexWrap:'wrap'}}>
        <select value={selected||''} onChange={e => setSelected(Number(e.target.value))} style={{minWidth:200}}>
          {team.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>
      {stats ? (
        <>
          <div className="metrics-grid">
            <div className="metric-card accent"><div className="metric-label">Task Completion</div><div className="metric-value accent">{c.tasks}%</div></div>
            <div className="metric-card teal"><div className="metric-label">Productivity</div><div className="metric-value teal">{c.productivity}%</div></div>
            <div className="metric-card amber"><div className="metric-label">Attendance</div><div className="metric-value amber">{c.attendance}%</div></div>
            <div className="metric-card green"><div className="metric-label">Rating</div><div className="metric-value green">{c.rating ? Number(c.rating).toFixed(1) : '-'}/5</div></div>
          </div>
          <div className="grid-2 mb24">
            <div className="card"><div className="card-title" style={{marginBottom:12}}>Performance Radar</div><RadarChart metrics={c} height={220} /></div>
            <div className="card">
              <div className="card-title" style={{marginBottom:12}}>Trend</div>
              {p.history && p.history.length > 0 ? <LineChart data={[{label:'Tasks',values:p.history.map(h=>h.task_completion||0)}]} labels={p.history.map(h=>h.period_name||'')} height={220} /> : <div style={{padding:20,color:'var(--text3)'}}>No history yet</div>}
            </div>
          </div>
          <div className="pred-card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 4 }}>Predicted Next Month</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--accent2)', letterSpacing: '-1px' }}>{p.latest_prediction || '-'}%</div>
          </div>
        </>
      ) : <div style={{padding:40,color:'var(--text3)',textAlign:'center'}}>Select an employee to view analytics</div>}
    </>
  );
};

// --- Page Titles ---
const PAGE_META = {
  dashboard: { title: 'Dashboard', sub: 'Welcome back \u2014 here\'s your overview' },
  users: { title: 'User Management', sub: 'Manage accounts and permissions' },
  performance: { title: 'Performance Analytics', sub: 'Detailed metrics and trends' },
  reports: { title: 'Reports Center', sub: 'Generate, export, and analyze performance reports' },
  team: { title: 'My Team', sub: 'Overview of your direct reports' },
  evaluate: { title: 'Add Evaluation', sub: 'Record performance metrics with AI prediction' },
  metrics: { title: 'My Metrics', sub: 'Your personal performance indicators' },
  trends: { title: 'My Trends', sub: 'Performance history and predictions' },
  feedback: { title: 'Peer Feedback', sub: 'Submit and review peer evaluations' },
  okr: { title: 'OKR Management', sub: 'Track objectives and key results' },
  projects: { title: 'Projects', sub: 'Track project progress and team assignments' },
  onboarding: { title: 'Onboarding', sub: 'Employee onboarding workflows and tracking' },
};

// --- Main App ---
export default function PerfTrack() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [chartReady, setChartReady] = useState(!!window.Chart);

  useEffect(() => {
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      s.onload = () => setChartReady(true);
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('pt_access');
    if (token) {
      api.get('/auth/me/').then(r => setUser(r.data)).catch(() => { localStorage.removeItem('pt_access'); localStorage.removeItem('pt_refresh'); });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pt_access');
    localStorage.removeItem('pt_refresh');
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <Login onLogin={u => { setUser(u); setPage('dashboard'); }} />;

  const r = user.role;
  const navItems = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    ...(r === 'admin' ? [{ id: 'users', label: 'Users', icon: 'users' }] : []),
    ...(r !== 'employee' ? [{ id: 'performance', label: 'Analytics', icon: 'chart' }] : []),
    { id: 'reports', label: 'Reports', icon: 'file' },

    ...(r !== 'employee' ? [
      { section: 'Management' },
      { id: 'team', label: 'My Team', icon: 'people' },
      { id: 'evaluate', label: 'Evaluate', icon: 'check' },
    ] : []),

    ...(r === 'employee' ? [
      { section: 'My Performance' },
      { id: 'metrics', label: 'My Metrics', icon: 'trending' },
    ] : []),

    { section: 'Collaboration' },
    { id: 'feedback', label: 'Feedback', icon: 'message' },
    { id: 'okr', label: 'OKR', icon: 'flag' },
    { id: 'projects', label: 'Projects', icon: 'box' },
    { id: 'onboarding', label: 'Onboarding', icon: 'clipboard' },
  ];

  const meta = PAGE_META[page] || {};

  const renderPage = () => {
    if (!chartReady && ['dashboard', 'performance', 'metrics', 'team'].includes(page)) {
      return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading charts...</div>;
    }
    switch (page) {
      case 'dashboard':
        if (r === 'admin') return <AdminDashboard user={user} />;
        if (r === 'manager') return <ManagerDashboard user={user} />;
        return <EmployeeDashboard user={user} />;
      case 'users': return <UserManagement />;
      case 'performance': return <PerformancePage user={user} />;
      case 'reports': return <ReportsPageFull user={user} />;
      case 'team': return <ManagerDashboard user={user} />;
      case 'evaluate': return <EvaluatePage user={user} />;
      case 'metrics': return <EmployeeDashboard user={user} />;
      case 'feedback': return <FeedbackPage user={user} />;
      case 'okr': return <OKRPage user={user} />;
      case 'projects': return <ProjectsPage user={user} />;
      case 'onboarding': return <OnboardingPage user={user} />;
      default: return <AdminDashboard user={user} />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon"><Icon name="trending" size={18} color="white" /></div>
            <div className="logo-text">Perf<span>Track</span></div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? <div key={i} className="nav-section">{item.section}</div> : (
              <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </button>
            )
          )}
        </nav>
        <div className="sidebar-user">
          <div className="user-card">
            <div className="avatar">{user.avatar_initials || user.full_name?.[0] || '?'}</div>
            <div className="user-info">
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{background:'none',border:'none',cursor:'pointer',padding:4}} title="Logout"><Icon name="logout" size={16} color="var(--text3)" /></button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{meta.title || 'Dashboard'}</h1>
            <p>{meta.sub || ''}</p>
          </div>
          <div className="topbar-right">
            <NotificationPanel user={user} />
            <div className="flex-center gap8">
              <span className={`role-badge role-${r}`}>{r}</span>
            </div>
          </div>
        </header>
        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
