'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import styles from '../auth-split.module.css';
import { createClient } from '@/utils/supabase/client';
import Logo from '@/components/Logo';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data?.session === null) {
        setSuccessMessage('Please check your email inbox to verify your account.');
        setLoading(false);
        return;
      }
      window.location.href = '/scrape';
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      {/* Left: Visual Preview */}
      <div className={styles.visualSide} style={{ background: '#f8fafc', color: '#111827' }}>
        <div className={styles.mockupContainer} style={{ background: 'white', borderColor: '#e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#15803d" /> Growth Analytics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[100, 250, 500, 1000].map((val, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '24px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, height: '100%', 
                    background: 'var(--accent-green)', 
                    width: `${(i + 1) * 25}%`,
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{val} leads</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Scale your outbound</h2>
          <p style={{ color: '#64748b', maxWidth: '320px' }}>Join 500+ agencies using Leadso to automate their prospecting and data extraction.</p>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className={styles.authSide}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
        </div>

        <div className={styles.formContainer}>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.subtitle}>Start finding leads for your business in minutes.</p>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
          {successMessage && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', border: '1px solid #bbf7d0' }}>
              {successMessage}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSignup}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
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
                minLength={6}
              />
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Creating Account...' : 'Get Started'} <ArrowRight size={16} />
            </button>
          </form>

          <p className={styles.footerText}>
            Already have an account? <Link href="/login" className={styles.link}>Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
