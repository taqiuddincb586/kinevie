import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const C = {
  primary: '#3b1f0e',
  accent: '#c9a96e',
  accentLight: '#f5ede0',
  bg: '#f2ebe0',
  surface: '#fdf8f2',
  border: '#e0d4c0',
  text: '#2c1a0e',
  muted: '#7a6247',
  danger: '#ef4444',
  success: '#22c55e',
};

const styles = `
  .auth-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a0a02 0%, #3b1f0e 50%, #5c3018 100%);
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
    background: radial-gradient(ellipse at 20% 50%, rgba(201,169,110,0.1) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(92,48,24,0.4) 0%, transparent 50%);
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
    color: #3b1f0e;
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
    color: #3b1f0e;
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
    background: linear-gradient(135deg, #c9a96e, #a07840);
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
    box-shadow: 0 4px 14px rgba(201,169,110,0.35);
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
  const { login, register, loading, error } = useAuth();
  const [localError, setLocalError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', rmtNumber: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setLocalError(err.message);
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
      await register({
        email: regForm.email,
        password: regForm.password,
        fullName: regForm.fullName,
        rmtNumber: regForm.rmtNumber,
      });
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || error;

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>Kinevie</h1>
            <span>Smart Practice Manager</span>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setLocalError(''); }}>
              Sign In
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setLocalError(''); }}>
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
                  <label className="auth-label">RMT Number <span style={{fontWeight:400,color:'#94a3b8'}}>(optional)</span></label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="e.g. 12345"
                    value={regForm.rmtNumber}
                    onChange={e => setRegForm(f => ({ ...f, rmtNumber: e.target.value }))}
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
    </>
  );
}
