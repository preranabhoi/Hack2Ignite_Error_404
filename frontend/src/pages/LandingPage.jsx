import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Bot, Building2, CheckCircle2, FileText, MapPin, Route,
  ShieldCheck, Sparkles, Users, Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const steps = [
  { icon: FileText, number: '01', title: 'Report clearly', text: 'Share the issue, location, priority, and optional photo evidence in one guided form.' },
  { icon: Route, number: '02', title: 'Route intelligently', text: 'AI suggests a category and department while administrators keep final control.' },
  { icon: Wrench, number: '03', title: 'Resolve visibly', text: 'Officers document progress, evidence, and resolution so citizens stay informed.' },
];

const capabilities = [
  { icon: Sparkles, title: 'Lightweight AI analysis', text: 'Summaries, priority suggestions, routing, and duplicate signals that remain advisory.' },
  { icon: MapPin, title: 'Location-aware context', text: 'Pinpoint patterns and help field teams reach the right place faster.' },
  { icon: ShieldCheck, title: 'Accountable by design', text: 'Role-based access, status history, and admin audit trails built into every workflow.' },
];

const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role) => {
    try {
      const res = await demoLogin(role);
      if (res.user?.role === 'admin' || role === 'admin') navigate('/admin');
      else if (res.user?.role === 'officer' || role === 'officer') navigate('/officer');
      else navigate('/dashboard');
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="app-container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><Sparkles size={15} /> Civic operations, made clearer</div>
            <h1>Every complaint deserves a clear path to resolution.</h1>
            <p className="hero-lede">CivicAI helps citizens report public issues, helps teams route them intelligently, and makes every step visible from submission to verified resolution.</p>
            <div className="hero-actions">
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-light btn-lg">
                {isAuthenticated ? 'Open my dashboard' : 'Report a grievance'} <ArrowRight size={18} />
              </Link>
              <Link to={isAuthenticated ? '/grievances/new' : '/login'} className="hero-text-link">
                {isAuthenticated ? 'File another issue' : 'Sign in to track progress'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="hero-panel" aria-label="CivicAI workflow preview">
            <div className="hero-panel-top"><span className="status-dot" /> Live resolution workflow <span>Today</span></div>
            <div className="hero-case"><div className="hero-case-icon"><MapPin size={19} /></div><div><strong>Streetlight outage</strong><span>Ward 14 · CIVIC-2026-1042</span></div><span className="badge badge-in-progress">In progress</span></div>
            <div className="hero-progress"><span style={{ width: '72%' }} /></div>
            <div className="hero-steps"><span className="done"><CheckCircle2 size={15} /> Reported</span><span className="done"><CheckCircle2 size={15} /> Routed</span><span><span className="mini-dot" /> Field visit</span></div>
            <div className="hero-note"><Bot size={17} /><span>AI summary ready for officer review</span><ArrowRight size={15} /></div>
          </div>
        </div>
        <div className="app-container hero-trust"><span><Users size={16} /> Built for citizens and civic teams</span><span><ShieldCheck size={16} /> Secure role-based workflows</span><span><CheckCircle2 size={16} /> Human-reviewed AI assistance</span></div>
      </section>

      <section className="landing-section intro-section"><div className="app-container intro-grid"><div><div className="eyebrow">The civic gap</div><h2>Good governance starts with a complaint that does not get lost.</h2></div><div className="intro-copy"><p>Public issues are often easy to see but hard to follow. CivicAI gives every report a reference, an owner, a timeline, and a clear next step.</p><p className="muted">One shared workspace for citizens, administrators, and field officers.</p></div></div></section>

      <section className="landing-section workflow-section"><div className="app-container"><div className="section-heading"><div><div className="eyebrow">One connected workflow</div><h2>From first report to final proof.</h2></div><p>Designed for fast scanning, responsible decisions, and fewer handoffs.</p></div><div className="step-grid">{steps.map(({ icon: Icon, number, title, text }) => <article className="step-card" key={number}><div className="step-number">{number}</div><Icon size={23} className="step-icon" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="landing-section capability-section"><div className="app-container capability-grid"><div className="capability-intro"><div className="eyebrow eyebrow-light">Thoughtful AI, not black-box decisions</div><h2>Useful intelligence. Human accountability.</h2><p>CivicAI keeps the AI layer lightweight and modular. It speeds up analysis without taking control away from the people responsible for public service.</p><Link to={isAuthenticated ? '/grievances/new' : '/register'} className="btn btn-light">Start with a report <ArrowRight size={16} /></Link></div><div className="capability-list">{capabilities.map(({ icon: Icon, title, text }) => <div className="capability-item" key={title}><div className="capability-icon"><Icon size={19} /></div><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>

      <section className="landing-section stats-section"><div className="app-container stats-band"><div><strong>4</strong><span>roles connected in one workflow</span></div><div><strong>24/7</strong><span>citizen access to status updates</span></div><div><strong>100%</strong><span>human-reviewed resolution actions</span></div><div><strong>1</strong><span>shared source of truth</span></div></div></section>

      <section className="landing-section cta-section"><div className="app-container cta-panel"><div><div className="eyebrow">Make the next report count</div><h2>Bring clarity to the issues your community sees every day.</h2></div><Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">{isAuthenticated ? 'Go to dashboard' : 'Create a citizen account'} <ArrowRight size={18} /></Link></div></section>

      <section className="demo-section"><div className="app-container demo-inner"><div><strong>Explore the full workflow</strong><span>Use a demo role for your presentation.</span></div><div className="demo-actions"><button onClick={() => handleQuickDemo('citizen')} className="btn btn-secondary btn-sm"><Users size={15} /> Citizen</button><button onClick={() => handleQuickDemo('officer')} className="btn btn-secondary btn-sm"><Building2 size={15} /> Officer</button><button onClick={() => handleQuickDemo('admin')} className="btn btn-secondary btn-sm"><ShieldCheck size={15} /> Admin</button></div></div></section>
    </main>
  );
};

export default LandingPage;
