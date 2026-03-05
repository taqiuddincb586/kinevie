import { authApi } from '../api/client';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const C = {
  primary: '#8a7258',
  accent: '#c4a882',
  accentLight: '#f5ede0',
  bg: '#f5ede0',
  surface: '#fdf8f2',
  border: '#ddd0b8',
  text: '#3d2e1a',
  muted: '#8a7055',
  danger: '#ef4444',
  success: '#22c55e',
};

const styles = `
  .auth-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #2e2010 0%, #7a6248 50%, #8a7258 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .auth-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(196,168,130,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(107,90,62,0.4) 0%, transparent 50%);
  }
  .auth-card {
    background: #fff;
    border-radius: 20px;
    width: 100%;
    max-width: 460px;
    padding: 48px 40px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
    position: relative;
    z-index: 1;
  }
  .auth-logo {
    text-align: center;
    margin-bottom: 32px;
  }
  .auth-logo h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    color: #8a7258;
    letter-spacing: -0.5px;
  }
  .auth-logo span {
    font-size: 13px;
    color: ${C.muted};
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .auth-tabs {
    display: flex;
    background: ${C.bg};
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 28px;
  }
  .auth-tab {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: ${C.muted};
    transition: all 0.2s;
    font-family: inherit;
  }
  .auth-tab.active {
    background: #fff;
    color: #8a7258;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .auth-form-group {
    margin-bottom: 16px;
  }
  .auth-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: ${C.text};
    margin-bottom: 6px;
  }
  .auth-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid ${C.border};
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    color: ${C.text};
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .auth-input:focus {
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px rgba(232,160,69,0.12);
  }
  .auth-input::placeholder { color: #aab0ba; }
  .auth-row { display: flex; gap: 12px; }
  .auth-row .auth-form-group { flex: 1; }
  .auth-btn {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #c4a882, #a08050);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    font-family: inherit;
    letter-spacing: 0.3px;
    transition: opacity 0.2s, transform 0.1s;
    box-shadow: 0 4px 14px rgba(196,168,130,0.4);
  }
  .auth-btn:hover { opacity: 0.92; transform: translateY(-1px); }
  .auth-btn:active { transform: translateY(0); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .auth-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: ${C.danger};
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    margin-bottom: 16px;
  }
  .auth-divider {
    text-align: center;
    font-size: 12px;
    color: ${C.muted};
    margin: 20px 0 0;
  }
  .auth-hint {
    font-size: 12px;
    color: ${C.muted};
    margin-top: 4px;
  }
  .auth-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(34,197,94,0.1);
    color: ${C.success};
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 20px;
  }
`;

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [fpStep, setFpStep] = useState(0); // 0=off 1=email 2=otp 3=newpw 4=done
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpPw, setFpPw] = useState('');
  const [fpPw2, setFpPw2] = useState('');
  const [fpMsg, setFpMsg] = useState('');
  const [fpErr, setFpErr] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [regPending, setRegPending] = useState(false);
  const { login, register, loading, error } = useAuth();
  const [localError, setLocalError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', registrationNumber: '', practiceType: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('tokens') || msg.includes('undefined') || msg.includes('Cannot read')) {
        setLocalError('Invalid email address or password. Please try again.');
      } else {
        setLocalError(err.message);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (regForm.password !== regForm.confirmPassword) {
      return setLocalError('Passwords do not match');
    }
    if (regForm.password.length < 8) {
      return setLocalError('Password must be at least 8 characters');
    }
    try {
      const result = await register({
        email: regForm.email,
        password: regForm.password,
        fullName: regForm.fullName,
        rmtNumber: regForm.registrationNumber,
        practiceType: regForm.practiceType,
        role: 'practitioner',
      });
      if (result?.pending) { setRegPending(true); setRegForm({ email: '', password: '', confirmPassword: '', fullName: '', registrationNumber: '', practiceType: '' }); }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || error;

  const fpSendOtp = async () => {
    setFpLoading(true); setFpErr('');
    try { await authApi.forgotPassword(fpEmail); setFpStep(2); setFpMsg('OTP sent! Check your email.'); }
    catch(e) { setFpErr(e.message); }
    setFpLoading(false);
  };

  const fpVerify = async () => {
    setFpLoading(true); setFpErr('');
    try { await authApi.verifyOtp(fpEmail, fpOtp); setFpStep(3); setFpMsg(''); }
    catch(e) { setFpErr(e.message); }
    setFpLoading(false);
  };

  const fpReset = async () => {
    if (fpPw !== fpPw2) { setFpErr('Passwords do not match'); return; }
    if (fpPw.length < 8) { setFpErr('Password must be at least 8 characters'); return; }
    setFpLoading(true); setFpErr('');
    try { await authApi.resetPassword(fpEmail, fpOtp, fpPw); setFpStep(4); }
    catch(e) { setFpErr(e.message); }
    setFpLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>Kinevie <span style={{fontSize:16,fontWeight:400,opacity:0.6}}>Lite</span></h1>
            <span>Smart Practice Manager</span>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setLocalError(''); setRegForm({ email: '', password: '', confirmPassword: '', fullName: '', registrationNumber: '', practiceType: '' }); setRegPending(false); }}>
              Sign In
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setLocalError(''); setRegForm({ email: '', password: '', confirmPassword: '', fullName: '', registrationNumber: '', practiceType: '' }); }}>
              Create Account
            </button>
          </div>

          {displayError && <div className="auth-error">⚠ {displayError}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} autoComplete="on">
              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => { setFpStep(1); setFpEmail(''); setFpErr(''); setFpMsg(''); }} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  Forgot Password?
                </button>
              </div>
              <div className="auth-divider">Don't have an account? Click <strong>Create Account</strong> above.</div>
            </form>
          ) : (
            <form onSubmit={handleRegister} autoComplete="on">
              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  value={regForm.fullName}
                  onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Practice Type *</label>
                <select className="auth-input" style={{ cursor: 'pointer' }} value={regForm.practiceType}
                  onChange={e => setRegForm(f => ({ ...f, practiceType: e.target.value }))} required>
                  <option value="">Select your practice type…</option>
                  <option value="RMT">RMT – Registered Massage Therapist</option>
                  <option value="Physiotherapist">Physiotherapist</option>
                  <option value="Osteopathist">Osteopathist</option>
                  <option value="Chiropractor">Chiropractor</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="auth-row">
                <div className="auth-form-group">
                  <label className="auth-label">Email Address</label>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="auth-form-group">
                  <label className="auth-label">Registration Number <span style={{fontWeight:400,color:'#94a3b8'}}>(optional)</span></label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="e.g. 12345"
                    value={regForm.registrationNumber || ''}
                    onChange={e => setRegForm(f => ({ ...f, registrationNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div className="auth-row">
                <div className="auth-form-group">
                  <label className="auth-label">Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="auth-form-group">
                  <label className="auth-label">Confirm Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
              <div className="auth-divider">By registering you agree to Kinevie's terms of use.</div>
            </form>
          )}
        </div>
      </div>
      {regPending && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:420, width:'100%', textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize:60, marginBottom:16 }}>📬</div>
            <h2 style={{ margin:'0 0 12px', color:'#15803d', fontSize:22 }}>Registration Submitted!</h2>
            <p style={{ color:'#166534', fontSize:14, lineHeight:1.7, margin:'0 0 28px' }}>
              Your account is pending administrator approval.<br/>
              You'll receive an email once your account is activated.
            </p>
            <button onClick={() => { setRegPending(false); setTab('login'); }}
              style={{ background:'linear-gradient(135deg,#c4a882,#a08050)', color:'#fff', border:'none', borderRadius:10, padding:'13px 32px', fontSize:15, fontWeight:700, cursor:'pointer', width:'100%', fontFamily:'inherit' }}>
              Back to Sign In →
            </button>
          </div>
        </div>
      )}
      {fpStep > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{fpStep === 4 ? '✅' : '🔒'}</div>
              <h2 style={{ margin: 0, color: C.text, fontSize: 20 }}>
                {fpStep === 1 && 'Forgot Password'}{fpStep === 2 && 'Enter OTP'}{fpStep === 3 && 'New Password'}{fpStep === 4 && 'Password Reset!'}
              </h2>
            </div>
            {fpMsg && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ {fpMsg}</div>}
            {fpErr && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>⚠ {fpErr}</div>}

            {fpStep === 1 && (
              <div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Enter your registered email address and we'll send you a 6-digit OTP.</p>
                <div className="auth-form-group">
                  <label className="auth-label">Email Address</label>
                  <input className="auth-input" type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <button className="auth-btn" onClick={fpSendOtp} disabled={fpLoading || !fpEmail}>{fpLoading ? 'Sending…' : 'Send OTP →'}</button>
              </div>
            )}

            {fpStep === 2 && (
              <div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Enter the 6-digit OTP sent to <strong>{fpEmail}</strong></p>
                <div className="auth-form-group">
                  <label className="auth-label">6-Digit OTP</label>
                  <input className="auth-input" type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value)} placeholder="123456" maxLength={6} style={{ fontSize: 24, textAlign: 'center', letterSpacing: 8 }} />
                </div>
                <button className="auth-btn" onClick={fpVerify} disabled={fpLoading || fpOtp.length < 6}>{fpLoading ? 'Verifying…' : 'Verify OTP →'}</button>
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button type="button" onClick={() => { setFpStep(1); setFpOtp(''); }} style={{ background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer' }}>Resend OTP</button>
                </div>
              </div>
            )}

            {fpStep === 3 && (
              <div>
                <div className="auth-form-group">
                  <label className="auth-label">New Password</label>
                  <input className="auth-input" type="password" value={fpPw} onChange={e => setFpPw(e.target.value)} placeholder="Min. 8 characters" />
                </div>
                <div className="auth-form-group">
                  <label className="auth-label">Confirm New Password</label>
                  <input className="auth-input" type="password" value={fpPw2} onChange={e => setFpPw2(e.target.value)} />
                </div>
                <button className="auth-btn" onClick={fpReset} disabled={fpLoading}>{fpLoading ? 'Resetting…' : 'Reset Password →'}</button>
              </div>
            )}

            {fpStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: 13 }}>Your password has been reset. A confirmation email has been sent.</p>
                <button className="auth-btn" onClick={() => setFpStep(0)}>Back to Login</button>
              </div>
            )}

            {fpStep < 4 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" onClick={() => setFpStep(0)} style={{ background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer' }}>← Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
