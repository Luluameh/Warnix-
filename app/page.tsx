// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Initializing tactical command layers...',
    '[SYSTEM] Loading Neon PostgreSQL connection pools (connect_timeout=30)...',
    '[SYSTEM] Operational check: Qwen-Plus client base URL confirmed.',
    '[INFO] Available responder inventory: 16 ambulance & fire trucks registered.'
  ]);

  const mockLogFeed = [
    '[SIGMA] Classifying active incident #FLOOD-08... Severity: 8, Riverside District.',
    '[ARCHIVE] Vector match found: Cologne Precedent (2021). Strategy matched.',
    '[AXIOM] Verification check active: duplicate report filtered from Sector 4.',
    '[HERALD] Climate report: wind plume shift targeting Port Area. Advising bypass.',
    '[AEGIS] Scarcity detected: 2 ambulance unit(s) deficit on Sector 3 route.',
    '[ATLAS] Pathfinding resolved: plotting bypass VIA-Sector 9 shelter.',
    '[NEXUS] Round 2 negotiation triggered on AEGIS ambulance allocation dispute...',
    '[NEXUS] Agent consensus achieved (Confidence score: 87%). Final decision compiled.',
    '[COMMAND] Dispatch authorized. Responder units deployed in active map field.',
    '[SYSTEM] Operations dashboard telemetry stream running on channel #SSE-992.'
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLogs = [...prev, mockLogFeed[index]];
        if (nextLogs.length > 5) {
          nextLogs.shift(); // Keep only latest 5 logs
        }
        return nextLogs;
      });
      index = (index + 1) % mockLogFeed.length;
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for scroll-triggered Framer reveal effects
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const agents = [
    {
      glyph: '⬡',
      name: 'SIGMA',
      role: 'Incident Analysis',
      desc: 'Classifies emergency severity, registers coordinates, and calculates casualty models from incoming feeds.',
    },
    {
      glyph: '◈',
      name: 'AXIOM',
      role: 'Evidence Verification',
      desc: 'Skeptically inspects facts, weeds out duplicate reports, and verifies claims to prevent rumor propagation.',
    },
    {
      glyph: '◉',
      name: 'HERALD',
      role: 'Live Intelligence',
      desc: 'Monitors real-time environmental sensors, weather feeds, and reports route blockages or weather plumes.',
    },
    {
      glyph: '◆',
      name: 'AEGIS',
      role: 'Resource Optimization',
      desc: 'Evaluates active dispatch fleet sizes, calculates resource deficits, and optimizes ambulance and shelter allocation.',
    },
    {
      glyph: '⬟',
      name: 'ATLAS',
      role: 'Routing & Deployment',
      desc: 'Plots geographical rescue routes, maps safe bypasses, and designates triage evacuation shelters.',
    },
    {
      glyph: '◇',
      name: 'ARCHIVE',
      role: 'Historical Memory',
      desc: 'Queries a vector database of 25 historical disaster precedents to extract lessons learned and strategy successes.',
    },
    {
      glyph: '⊕',
      name: 'NEXUS',
      role: 'Coordinator & Decision Engine',
      desc: 'Moderates socratic debates, resolves agent contentions, and compiles the final Autopilot Dispatch Action Plan.',
    },
  ];

  const features = [
    { title: 'Multi-Agent Debate', desc: 'Agents actively debate conflicting evidence, adjusting confidence cards in response to challenges.' },
    { title: 'Shared Blackboard Memory', desc: 'A central blackboard where agents write facts and dispute claims, ensuring global context sync.' },
    { title: 'Historical Precedent Engine', desc: 'Queries archived historical crises to match past successful strategies and avoid past dispatch mistakes.' },
    { title: 'Human-in-the-Loop Autopilot', desc: 'Allows commanders to review generated action plans, approve dispatch, or inject instructions to trigger re-deliberation.' },
    { title: 'Explainable AI (XAI)', desc: 'Outputs a detailed natural language synthesis detailing dissenting agents, evidence chains, and alternative plans.' },
    { title: 'Resource Allocation Negotiation', desc: 'AEGIS and ATLAS debate route viability and fleet capacity to handle resource contention dynamically.' },
    { title: 'Live Mission Timeline', desc: 'Tracks every cognitive step, agent check-in, and debate milestone in a unified, chronological log.' },
    { title: 'Geospatial Radar Integration', desc: 'Renders map indicators, custom responder coordinates, and danger radius overlays on a dark GIS radar.' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#050608',
        color: '#f7fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Subtle background grid overlay */}
      <div
        className="animate-grid-warp"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(to right, rgba(0, 240, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
        
        {/* Header bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '80px',
            borderBottom: '1px solid rgba(0, 240, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt="Warnix Logo"
              className="animate-logo-float"
              style={{
                width: '26px',
                height: '26px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 6px var(--accent-dim))',
              }}
            />
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '16px' }}>
              WARNIX EOC
            </span>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '1px 6px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
              AUTONOMOUS
            </span>
          </div>
          <div>
            <Link
              href="/dashboard"
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textDecoration: 'none',
                border: '1px solid var(--accent)',
                padding: '6px 14px',
                borderRadius: '3px',
                transition: 'all 0.2s',
                backgroundColor: 'rgba(0, 240, 255, 0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.03)';
              }}
            >
              LAUNCH EOC SYSTEM
            </Link>
          </div>
        </header>

        {/* Hero Section Split Layout */}
        <section
          style={{
            padding: '80px 0 60px 0',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
          }}
        >
          {/* Left Column: Headline and CTAs */}
          <div className="animate-fade-in-up" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 8px var(--accent)' }} />
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                Tactical Operations Command Portal
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/logo.png"
                alt="Warnix Logo"
                className="animate-logo-float"
                style={{
                  width: '64px',
                  height: '64px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 12px var(--accent-dim))',
                }}
              />
              <h1
                style={{
                  fontSize: '52px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.1,
                  color: '#ffffff',
                }}
              >
                WARNIX
              </h1>
            </div>
            <p
              style={{
                fontSize: '20px',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              AI-Driven Autonomous Emergency Operations Center
            </p>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A high-fidelity EOC Command Center simulation. 
              Instead of static spreadsheets, Warnix instantiates an active society of seven specialized AI agents that debate, verify observations, crosscheck historical memory records, and auto-dispatch ambulance networks in real-time.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', alignItems: 'center' }}>
              <Link
                href="/dashboard"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#000000',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 20px rgba(0, 240, 255, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 240, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 240, 255, 0.3)';
                }}
              >
                LAUNCH MISSION CONTROL
              </Link>

              <button
                onClick={() => scrollToSection('agents-society')}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                EXPLORE AGENT SOCIETY
              </button>
            </div>
          </div>

          {/* Right Column: Premium Dashboard Mockup Image Display */}
          <div
            className="animate-fade-in-up delay-200"
            style={{
              flex: '1 1 500px',
              maxWidth: '560px',
              border: '1px solid var(--border-active)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-panel)',
              padding: '8px',
              boxShadow: '0 12px 40px rgba(0, 240, 255, 0.08)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 240, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 240, 255, 0.08)';
            }}
          >
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-crit)' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-warn)' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                WARNIX_TACTICAL_RADAR_PREVIEW.IMG
              </span>
            </div>
            <img
              src="/assets/warnix_dashboard_mockup.png"
              alt="Warnix Tactical EOC Command Center Interface Mockup"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '2px',
              }}
            />
          </div>
        </section>

        {/* Real-time Telemetry Live Log Feed */}
        <section className="scroll-reveal" style={{ padding: '0 0 50px 0' }}>
          <div
            style={{
              backgroundColor: '#090b10',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,240,255,0.1)', paddingBottom: '6px', marginBottom: '4px' }}>
              <span>📡 ACTIVE LOG FEED</span>
              <span style={{ color: 'var(--status-warn)', animation: 'pulse-glow-crit 1.5s infinite' }}>● LIVE STREAM</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} style={{ opacity: 0.6 + i * 0.1, whiteSpace: 'pre-wrap', transition: 'opacity 0.2s' }}>
                {log}
              </div>
            ))}
          </div>
        </section>

        {/* Why Warnix Section */}
        <section
          className="scroll-reveal"
          style={{
            padding: '60px 0',
            borderTop: '1px solid rgba(0, 240, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '11px', letterSpacing: '0.2em' }}>
              TACTICAL ARCHITECTURE
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>Why Warnix?</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ color: 'var(--status-crit)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
                ❌ THE PROBLEM
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                Traditional disaster response relies on siloed channels, sequential queues, and manual communication logs. Information changes rapidly, leading to resource misallocation and routing conflicts in the field.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '24px', boxShadow: '0 0 16px rgba(0, 240, 255, 0.05)' }}>
              <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
                🛡️ THE SOLUTION
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                Warnix instantiates an active EOC Command Room where multiple specialized agents argue, verify facts, search past precedents, and negotiate fleet deployment dynamically to auto-generate a comprehensive, clean action plan.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
                ⚡ THE IMPACT
              </div>
              <ul style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Seconds to Dispatch</strong>: Auto-schedules ambulances and engines instantly.</li>
                <li><strong>Explainable Decisions</strong>: Direct chain of logic and dissenting arguments logged.</li>
                <li><strong>Commander Checks</strong>: Complete human override and rerun hooks.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Agent Society Section: Side-by-Side with Network Diagram Image */}
        <section
          id="agents-society"
          className="scroll-reveal"
          style={{
            padding: '60px 0',
            borderTop: '1px solid rgba(0, 240, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '11px', letterSpacing: '0.2em' }}>
              TRACK 3 SHOWCASE
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>The Agent Society</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
              Seven autonomous specialist agents communicating and debating over the shared blackboard.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
            
            {/* Left: Agent Network visualization */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-panel)',
                  padding: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                <img
                  src="/assets/warnix_agent_network.png"
                  alt="AI Agent Society Connections Node Network Map"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                📡 <strong>Visual Architecture Node Mapping</strong>: Sigma classifications feed directly into Aegis and Atlas route calculations, while Archive databases sync precedents. Nexus monitors the transaction logs for Round 2 arbitration checks.
              </div>
            </div>

            {/* Right: Agent list layout */}
            <div style={{ flex: '2 1 600px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {agents.map((a, i) => {
                const isNexus = a.name === 'NEXUS';
                return (
                  <div
                    key={i}
                    className="hover-glow-card animate-fade-in-up"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      border: `1px solid ${isNexus ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '4px',
                      padding: '16px',
                      animationDelay: `${(i + 1) * 80}ms`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = isNexus ? 'var(--accent)' : 'var(--border)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', color: 'var(--accent)' }}>{a.glyph}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                        {a.name}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {a.role}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                      {a.desc}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Core Features Grid */}
        <section
          className="scroll-reveal"
          style={{
            padding: '60px 0',
            borderTop: '1px solid rgba(0, 240, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '11px', letterSpacing: '0.2em' }}>
              CAPABILITIES CHECKLIST
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>Core System Features</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--bg-panel-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
                  ⚡ {f.title}
                </div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Track 3 Checklist */}
        <section
          className="scroll-reveal"
          style={{
            padding: '50px 0',
            borderTop: '1px solid rgba(0, 240, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-active)',
              borderRadius: '4px',
              padding: '32px',
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <h3 style={{ fontSize: '20px', color: '#ffffff', margin: '0 0 16px 0', fontFamily: 'var(--font-mono)' }}>
              ✓ Qwen Cloud Hackathon — Track 3 Checklist
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  🟢 <strong>Agent Persona Diversity</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  7 distinct agent roles with highly configured system instructions targeting different aspects of operations.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  🟢 <strong>Conflict Negotiation Rounds</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  NEXUS holds custom Round 2 socratic debates if agents disagree on severity or ambulance availability.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  🟢 <strong>Short & Long-Term Memory</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Agents sync state on a rolling blackboard, while querying vector matches of 25 historical precedents.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  🟢 <strong>Human Checkpoints</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Commanders can manually reject, approve, or inject custom instruction overrides to force agent re-runs.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '40px 0 60px 0',
            borderTop: '1px solid rgba(0, 240, 255, 0.08)',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            Built with <strong>Next.js App Router</strong>, <strong>Prisma</strong>, and <strong>Neon Serverless PostgreSQL</strong>.
          </div>
          <div>
            API Provider: <strong>Qwen Cloud DashScope (International) Compatible-Mode v1</strong> (Model: <code>qwen-plus</code>)
          </div>
          <div style={{ marginTop: '8px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            WARNIX EOC &copy; 2026 · Global AI Hackathon Series
          </div>
        </footer>

      </div>
    </div>
  );
}
