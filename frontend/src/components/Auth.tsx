import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Building, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (token: string, user: any) => void;
  apiUrl: string;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, apiUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to login. Please check credentials.');
        }

        // Fetch User Info
        const userResponse = await fetch(`${apiUrl}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const userData = await userResponse.json();

        onLoginSuccess(data.access_token, userData);
      } else {
        // Register API Call
        const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            organization_name: orgName,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed. Try again.');
        }

        // Auto-login after registration
        const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginResponse.json();

        onLoginSuccess(loginData.access_token, data);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.brandSection}>
        <div style={styles.logoBadge}>DF</div>
        <h1 style={styles.brandTitle}>DecisionForge <span style={styles.brandGradient}>AI</span></h1>
        <p style={styles.brandSubtitle}>Boilerplate for Advanced Optimization and Decision Support System</p>
      </div>

      <div className="glass-card" style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
          <p style={styles.subtitle}>
            {isLogin
              ? 'Enter credentials to access operational control room'
              : 'Create an account to initialize organization workspace'}
          </p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.nameRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name</label>
                  <div style={styles.inputWrapper}>
                    <UserIcon size={16} style={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name</label>
                  <div style={styles.inputWrapper}>
                    <UserIcon size={16} style={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Organization Name</label>
                <div style={styles.inputWrapper}>
                  <Building size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="jane.doe@decisionforge.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to control room' : 'Create Organization Workspace'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <button style={styles.switchModeBtn} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '24px',
    background: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.1) 0%, rgba(9, 9, 11, 1) 70%)',
  },
  brandSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '32px',
    textAlign: 'center' as const,
  },
  logoBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '16px',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    marginBottom: '8px',
  },
  brandGradient: {
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  brandSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    maxWidth: '380px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px',
  },
  header: {
    marginBottom: '28px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '24px',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  errorAlert: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#f43f5e',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  nameRow: {
    display: 'flex',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
    marginTop: '8px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center' as const,
  },
  switchModeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-purple)',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};
