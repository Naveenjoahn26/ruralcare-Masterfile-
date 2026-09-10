import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Lock,
  MapPin,
  Ambulance,
  Clock3,
  Sparkles,
} from "lucide-react";
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const navigateLogin = () => {
    navigate("/login");
  };

  return (
    <div className="landing-page">
      <div className="landing-noise" />
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />

      <header className="landing-nav">
        <div className="brand-lockup">
          <div className="brand-mark">
            <HeartPulse size={21} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">RURAL<span>CARE</span></div>
            <div className="brand-subtitle">SIH26133 · Connected Health Grid</div>
          </div>
        </div>

        <Link to="/login" className="nav-login">
          <Lock size={15} />
          Portal Login
          <ArrowRight size={15} />
        </Link>
      </header>

      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              National Rural Healthcare Network
              <Sparkles size={13} />
            </div>

            <h1>
              Healthcare that moves
              <span> as one system.</span>
            </h1>

            <p className="hero-description">
              Connect rural PHCs, district hospitals and central health teams through one intelligent care network — from first triage to specialist treatment and follow-up.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="primary-cta">
                Access Healthcare Portals
                <ArrowRight size={17} />
              </Link>
              <a href="#portals" className="secondary-cta">
                Explore the network
              </a>
            </div>

            <div className="hero-metrics">
              <div><strong>24/7</strong><span>Connected care</span></div>
              <div><strong>3</strong><span>Care layers</span></div>
              <div><strong>1</strong><span>Unified network</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="3D illustration of a connected hospital">
            <div className="scene-grid" />
            <div className="floating-label label-top"><Activity size={14} /> Live care network</div>
            <div className="floating-label label-side"><Clock3 size={14} /> Faster referrals</div>
            <div className="floating-label label-bottom"><MapPin size={14} /> Rural → District → Specialist</div>

            <div className="hospital-3d">
              <div className="hospital-shadow" />
              <div className="hospital-main">
                <div className="hospital-roof">
                  <div className="helipad"><span>H</span></div>
                  <div className="roof-glow" />
                </div>
                <div className="hospital-facade">
                  <div className="hospital-sign"><HeartPulse size={16} /> RURALCARE</div>
                  <div className="window-grid">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span key={index} className={index % 5 === 0 ? "window window-lit" : "window"} />
                    ))}
                  </div>
                  <div className="hospital-entrance">
                    <div className="entrance-cross">+</div>
                    <div className="door" />
                    <div className="door" />
                  </div>
                </div>
                <div className="hospital-base" />
              </div>

              <div className="network-ring ring-a" />
              <div className="network-ring ring-b" />
              <div className="network-ring ring-c" />

              <div className="care-orb orb-phc"><Stethoscope size={19} /></div>
              <div className="care-orb orb-hospital"><Building2 size={19} /></div>
              <div className="care-orb orb-admin"><ShieldCheck size={19} /></div>
              <div className="data-beam beam-one" />
              <div className="data-beam beam-two" />
            </div>
          </div>
        </section>

        <section className="network-strip">
          <div><span className="strip-icon"><Ambulance size={16} /></span><span>Emergency transfers</span></div>
          <div><span className="strip-icon"><Activity size={16} /></span><span>Live referral tracking</span></div>
          <div><span className="strip-icon"><HeartPulse size={16} /></span><span>Continuity of care</span></div>
          <div><span className="strip-icon"><CheckCircle2 size={16} /></span><span>Verified appointments</span></div>
        </section>

        <section id="portals" className="portal-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Choose your care layer</span>
              <h2>One network. Three connected doors.</h2>
            </div>
            <p>Keep the existing portal actions and backend connections — this new visual layer only changes the landing experience.</p>
          </div>

          <div className="portal-grid">
            <article className="portal-card portal-green">
              <div className="portal-card-top">
                <div className="portal-icon"><Stethoscope size={22} /></div>
                <span className="portal-number">01</span>
              </div>
              <h3>Primary Health Center</h3>
              <p>Register patients, capture vitals, triage severity and match the right higher hospital.</p>
              <ul>
                <li><CheckCircle2 size={14} /> Patient registration & vitals</li>
                <li><CheckCircle2 size={14} /> Hospital matching & slots</li>
                <li><CheckCircle2 size={14} /> ASHA follow-up alerts</li>
              </ul>
              <button onClick={navigateLogin} className="portal-button">Enter PHC Portal <ArrowRight size={15} /></button>
            </article>

            <article className="portal-card portal-blue">
              <div className="portal-card-top">
                <div className="portal-icon"><Building2 size={22} /></div>
                <span className="portal-number">02</span>
              </div>
              <h3>Higher District Hospital</h3>
              <p>Coordinate incoming referrals, specialist review, attendance, diagnosis and treatment.</p>
              <ul>
                <li><CheckCircle2 size={14} /> Incoming patient queue</li>
                <li><CheckCircle2 size={14} /> One-click case acceptance</li>
                <li><CheckCircle2 size={14} /> Specialist care records</li>
              </ul>
              <button onClick={navigateLogin} className="portal-button">Enter Hospital Portal <ArrowRight size={15} /></button>
            </article>

            <article className="portal-card portal-violet">
              <div className="portal-card-top">
                <div className="portal-icon"><ShieldCheck size={22} /></div>
                <span className="portal-number">03</span>
              </div>
              <h3>Central Health Admin</h3>
              <p>Monitor the state-wide care network, emergencies, hospital capacity and communication logs.</p>
              <ul>
                <li><CheckCircle2 size={14} /> Referral journey monitoring</li>
                <li><CheckCircle2 size={14} /> Emergency & ICU capacity</li>
                <li><CheckCircle2 size={14} /> Multi-channel audit logs</li>
              </ul>
              <button onClick={navigateLogin} className="portal-button">Enter Admin Portal <ArrowRight size={15} /></button>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>RURALCARE · SIH26133 Central Health Platform</span>
        <span>Connected Care from PHC to Higher Hospital</span>
      </footer>
    </div>
  );
};

export default LandingPage;


