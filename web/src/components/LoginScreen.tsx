import React from 'react';

interface LoginScreenProps {
  handleLogin: (e: React.FormEvent) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loginError: string;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  handleLogin,
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  showPassword,
  setShowPassword,
}) => {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="Gentara Logo" />
          <h1>GENTARA</h1>
          <p>Panel Sekretariat</p>
        </div>

        <form onSubmit={handleLogin}>
          {loginError && (
            <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '20px', fontWeight: '500' }}>
              {loginError}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Masuk
          </button>
        </form>
      </div>

      <p className="login-watermark">Support by KKN-7 USH 2026</p>
    </div>
  );
};
