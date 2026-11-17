"use client";
export default function HomePage() {
  return (
    <main className="home-page">

      <div className="home-container">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">YOUR SUCCESS STARTS HERE</span>
            <h1>
              Prepare Today.
              <br />
              <span>Achieve Tomorrow.</span>
            </h1>
            <p>
              Practice smarter for State SSC, PCS and Railway examinations.
              Take online mock tests, improve your speed and track your
              preparation.
            </p>

            <div className="hero-buttons">
              <a href="/tests" className="primary-btn">
                Explore Mock Tests →
              </a>
              <a href="/register" className="secondary-btn">
                Create Free Account
              </a>
            </div>

            <div className="hero-points">
              <span>✓ Practice Tests</span>
              <span>✓ Performance Reports</span>
              <span>✓ Exam Preparation</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-top">
                <span>EXAM PREPARATION</span>
                <span className="live-dot">● LIVE</span>
              </div>
              <div className="visual-icon">🎯</div>
              <h2>Your Goal</h2>
              <p>Consistency is the key to success.</p>
              <div className="progress-label">
                <span>Daily Practice</span>
                <span>Keep Going!</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>
              <div className="visual-bottom">
                <span>Learn</span>
                <span>Practice</span>
                <span>Succeed</span>
              </div>
            </div>
            <div className="floating-note">📚 Keep Learning Every Day</div>
          </div>
        </section>

        <section className="quick-stats">
          <div>
            <strong>SSC</strong>
            <span>Exam Preparation</span>
          </div>
          <div>
            <strong>PCS</strong>
            <span>State Level Exams</span>
          </div>
          <div>
            <strong>RRB</strong>
            <span>Railway Exams</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Practice Access</span>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <span className="section-label">CHOOSE YOUR GOAL</span>
            <h2>Explore Exam Categories</h2>
            <p>Choose your examination and start preparing today.</p>
          </div>

          <div className="exam-grid">
            <a href="/tests" className="exam-card">
              <div className="exam-icon blue">🏛️</div>
              <h3>State SSC & PCS</h3>
              <p>Practice general studies, reasoning, mathematics and more.</p>
              <span>Explore Tests →</span>
            </a>

            <a href="/tests" className="exam-card">
              <div className="exam-icon purple">🚆</div>
              <h3>Railway Exams</h3>
              <p>Prepare for NTPC, Group D and other railway examinations.</p>
              <span>Explore Tests →</span>
            </a>

            <a href="/tests" className="exam-card">
              <div className="exam-icon orange">👮</div>
              <h3>Bihar Police & SI</h3>
              <p>Improve your preparation with focused practice tests.</p>
              <span>Explore Tests →</span>
            </a>
          </div>
        </section>

        <section className="features-section">
          <div className="section-heading">
            <span className="section-label">LEARN • PRACTICE • IMPROVE</span>
            <h2>Everything You Need to Prepare</h2>
            <p>Useful tools to make your exam preparation more effective.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span>📝</span>
              <h3>Online Mock Tests</h3>
              <p>Attempt practice examinations in an online test environment.</p>
            </div>
            <div className="feature-card">
              <span>📊</span>
              <h3>Performance Reports</h3>
              <p>Review your scores and understand your exam performance.</p>
            </div>
            <div className="feature-card">
              <span>⏱️</span>
              <h3>Timed Examinations</h3>
              <p>Practice managing your time during examinations.</p>
            </div>
            <div className="feature-card">
              <span>📚</span>
              <h3>Regular Practice</h3>
              <p>Build confidence through consistent exam preparation.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span>YOUR NEXT STEP</span>
            <h2>Ready to Start Your Preparation?</h2>
            <p>Log in to your account and begin your next mock test.</p>
          </div>
          <a href="/tests">Start Practicing Now →</a>
        </section>

        <footer className="home-footer">
          <div>
            <h3>EXAMPREP</h3>
            <p>State SSC, PCS & Railway Exam Preparation Platform</p>
          </div>
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/tests">Mock Tests</a>
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          </div>
          <p className="copyright">
            © {new Date().getFullYear()} Exam Preparation Platform. All rights reserved.
          </p>
        </footer>
      </div>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: #f7f9fd;
          color: #172554;
          font-family: Arial, Helvetica, sans-serif;
        }

        .home-nav {
          min-height: 76px;
          padding: 12px 6%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #e8edf5;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #172554;
          text-decoration: none;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: white;
          background: #2563eb;
          font-size: 24px;
        }

        .brand-blue {
          color: #2563eb;
        }

        .brand small {
          display: block;
          font-size: 9px;
          letter-spacing: 2px;
          color: #64748b;
          margin-top: 3px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .nav-links a {
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .nav-links a:hover {
          color: #2563eb;
        }

        .nav-links .nav-login {
          padding: 11px 21px;
          background: #2563eb;
          color: white;
          border-radius: 9px;
        }

        .home-container {
          max-width: 1200px;
          margin: auto;
          padding: 25px 22px 0;
        }

        .hero {
          min-height: 460px;
          border-radius: 24px;
          padding: 65px 7%;
          background: linear-gradient(120deg, #102b60, #1d4ed8);
          color: white;
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          align-items: center;
          gap: 40px;
          overflow: hidden;
        }

        .hero-label, .section-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero-label {
          color: #bfdbfe;
          background: #ffffff18;
          padding: 9px 13px;
          border-radius: 30px;
        }

        .hero h1 {
          font-size: clamp(38px, 5vw, 59px);
          line-height: 1.12;
          margin: 25px 0 17px;
          letter-spacing: -2px;
        }

        .hero h1 span {
          color: #93c5fd;
        }

        .hero-content > p {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.8;
          max-width: 580px;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 27px;
        }

        .primary-btn, .secondary-btn {
          padding: 14px 21px;
          border-radius: 9px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }

        .primary-btn {
          background: white;
          color: #1d4ed8;
        }

        .secondary-btn {
          border: 1px solid #ffffff70;
          color: white;
        }

        .hero-points {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 30px;
          color: #dbeafe;
          font-size: 12px;
        }

        .hero-visual {
          position: relative;
          padding: 20px;
        }

        .visual-card {
          background: white;
          color: #172554;
          padding: 25px;
          border-radius: 20px;
          box-shadow: 0 25px 60px #071b4880;
          transform: rotate(2deg);
        }

        .visual-top, .progress-label, .visual-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .visual-top {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 1px;
        }

        .live-dot {
          color: #16a34a;
        }

        .visual-icon {
          font-size: 55px;
          margin-top: 28px;
        }

        .visual-card h2 {
          font-size: 27px;
          margin: 10px 0;
        }

        .visual-card p {
          color: #64748b;
          font-size: 13px;
        }

        .progress-label {
          margin-top: 30px;
          font-size: 11px;
          font-weight: 700;
        }

        .progress-track {
          height: 9px;
          background: #e2e8f0;
          border-radius: 20px;
          margin: 10px 0 20px;
          overflow: hidden;
        }

        .progress-fill {
          width: 75%;
          height: 100%;
          background: #2563eb;
          border-radius: 20px;
        }

        .visual-bottom {
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
        }

        .floating-note {
          position: absolute;
          bottom: 0;
          left: -10px;
          background: white;
          color: #1e40af;
          border-radius: 10px;
          padding: 13px 16px;
          box-shadow: 0 10px 25px #071b4840;
          font-size: 12px;
          font-weight: 700;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 15px;
          margin-top: 24px;
          padding: 24px 10px;
          box-shadow: 0 5px 20px #17255408;
        }

        .quick-stats div {
          text-align: center;
          border-right: 1px solid #e2e8f0;
        }

        .quick-stats div:last-child {
          border: none;
        }

        .quick-stats strong {
          display: block;
          color: #2563eb;
          font-size: 25px;
          margin-bottom: 5px;
        }

        .quick-stats span {
          color: #64748b;
          font-size: 12px;
        }

        .section {
          padding: 75px 0 25px;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 30px;
        }

        .section-label {
          color: #2563eb;
        }

        .section-heading h2 {
          font-size: 32px;
          color: #172554;
          margin: 12px 0;
          letter-spacing: -1px;
        }

        .section-heading p {
          color: #64748b;
          font-size: 14px;
        }

        .exam-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .exam-card {
          background: white;
          padding: 27px;
          border: 1px solid #e5eaf2;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          transition: 0.2s ease;
        }

        .exam-card:hover {
          transform: translateY(-5px);
          border-color: #93c5fd;
          box-shadow: 0 12px 30px #1e40af12;
        }

        .exam-icon {
          width: 55px;
          height: 55px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 26px;
        }

        .blue { background: #dbeafe; }
        .purple { background: #ede9fe; }
        .orange { background: #ffedd5; }

        .exam-card h3 {
          font-size: 19px;
          margin: 20px 0 10px;
        }

        .exam-card p {
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
          min-height: 45px;
        }

        .exam-card > span {
          display: inline-block;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          margin-top: 15px;
        }

        .features-section {
          padding: 65px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .feature-card {
          background: white;
          border: 1px solid #e5eaf2;
          padding: 23px 18px;
          border-radius: 14px;
        }

        .feature-card > span {
          font-size: 28px;
        }

        .feature-card h3 {
          font-size: 15px;
          margin: 17px 0 9px;
        }

        .feature-card p {
          color: #64748b;
          font-size: 12px;
          line-height: 1.7;
        }

        .cta-section {
          padding: 35px 40px;
          background: #eaf2ff;
          border: 1px solid #d6e5ff;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .cta-section > div > span {
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .cta-section h2 {
          font-size: 24px;
          margin: 10px 0;
        }

        .cta-section p {
          color: #64748b;
          font-size: 13px;
        }

        .cta-section > a {
          background: #2563eb;
          color: white;
          padding: 15px 20px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .home-footer {
          padding: 45px 0 20px;
          margin-top: 35px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .home-footer h3 {
          margin: 0 0 8px;
          color: #1d4ed8;
        }

        .home-footer p {
          color: #64748b;
          font-size: 12px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
        }

        .footer-links a {
          color: #475569;
          font-size: 12px;
          text-decoration: none;
        }

        .copyright {
          width: 100%;
          text-align: center;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 800px) {
          .nav-links {
            gap: 12px;
          }

          .nav-links a {
            font-size: 12px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 45px 7%;
          }

          .hero-visual {
            max-width: 390px;
            width: 100%;
            margin: auto;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .home-nav {
            align-items: flex-start;
            flex-direction: column;
            padding: 15px 5%;
          }

          .nav-links {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 5px;
          }

          .nav-links a {
            white-space: nowrap;
          }

          .home-container {
            padding: 15px 13px 0;
          }

          .hero {
            padding: 38px 23px;
            border-radius: 17px;
          }

          .hero h1 {
            font-size: 39px;
          }

          .hero-content > p {
            font-size: 14px;
          }

          .hero-points {
            gap: 10px;
            flex-direction: column;
          }

          .quick-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 22px 5px;
          }

          .quick-stats div:nth-child(2) {
            border: none;
          }

          .section {
            padding-top: 55px;
          }

          .section-heading h2 {
            font-size: 25px;
          }

          .exam-grid, .features-grid {
            grid-template-columns: 1fr;
          }

          .exam-card p {
            min-height: auto;
          }

          .cta-section {
            padding: 27px 22px;
            align-items: flex-start;
            flex-direction: column;
          }

          .cta-section h2 {
            font-size: 21px;
          }

          .home-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
