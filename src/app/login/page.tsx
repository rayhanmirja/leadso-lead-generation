'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from '../auth-split.module.css';
import { createClient } from '@/utils/supabase/client';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        window.location.replace('/scrape');
      }
    } catch (err: any) {
      setError("Login failed: " + (err.message || "An unexpected error occurred"));
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      {/* Left: Login Form */}
      <div className={styles.authSide}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
        </div>

        <div className={styles.formContainer}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account to continue finding leads.</p>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>{error}</div>}

          <form className={styles.form} onSubmit={handleLogin}>
            <div className="form-group">
              <label className="label">Email</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="you@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <p className={styles.footerText}>
            Don't have an account? <Link href="/signup" className={styles.link}>Sign up for free</Link>
          </p>
        </div>
      </div>

      {/* Right: Visual Preview */}
      <div className={styles.visualSide} style={{ background: '#f8fafc', color: '#111827' }}>
        <div className={styles.mockupContainer} style={{ background: 'white', borderColor: '#e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <div className={styles.mockupHeader}>
            <div className={styles.mockupSearch} style={{ background: '#f1f5f9' }} />
            <div className={styles.mockupBadge} />
          </div>
          <div className={styles.mockupList}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.mockupItem} style={{ animationDelay: `${i * 0.2}s`, background: '#f8fafc' }}>
                <div className={styles.mockupCircle} style={{ background: '#e2e8f0' }} />
                <div className={styles.mockupLines}>
                  <div className={styles.line} style={{ width: '40%', background: '#e2e8f0' }} />
                  <div className={styles.line} style={{ width: '70%', background: '#e2e8f0' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Find leads in seconds</h2>
          <p style={{ color: '#64748b', maxWidth: '300px' }}>Our AI-driven engine extracts the most relevant business data from across the web.</p>
        </div>
      </div>
    </div>
  );
}
