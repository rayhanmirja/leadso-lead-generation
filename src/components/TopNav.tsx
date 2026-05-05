'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from './TopNav.module.css';
import { Menu, X, Settings, LogOut, Search, ShoppingBag, CheckCircle2, Info } from 'lucide-react';

export default function TopNav({ title = "Dashboard" }: { title?: string }) {
  const [userName, setUserName] = useState('User Name');
  const [userEmail, setUserEmail] = useState('user@leadso.io');
  const [initial, setInitial] = useState('U');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || 'User';
        setUserName(name);
        setUserEmail(user.email || '');
        setInitial(name.charAt(0).toUpperCase());
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        
        let hasKey = false;
        try {
          const { data: profile } = await supabase.from('profiles').select('apify_key').eq('id', user.id).maybeSingle();
          if (profile) {
            const key = profile.apify_key || '';
            setUserApiKey(key);
            hasKey = key.trim() !== '';
          }
        } catch (e) {}

        // Handle payment success onboarding - ONLY if no key is present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
          // Clean the URL immediately to prevent loops
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          if (!hasKey) {
            setShowSettings(true);
            setSaveMessage({ type: 'info', text: 'Congrats on your new plan! Please add your Apify API key below to unlock larger lead limits.' });
          }
        }

        try {
          const { data: subs } = await supabase.from('subscriptions').select('plan_name').eq('user_id', user.id).eq('status', 'active');
          if (subs && subs.length > 0) {
            const planPriority = { 'Scale': 3, 'Growth': 2, 'Basic': 1, 'Free': 0 };
            const bestPlan = subs.reduce((prev: any, current: any) => {
              const prevPower = planPriority[prev.plan_name as keyof typeof planPriority] || 0;
              const currPower = planPriority[current.plan_name as keyof typeof planPriority] || 0;
              return currPower > prevPower ? current : prev;
            });
            setUserPlan(bestPlan.plan_name);
          }
        } catch (e) {}
      }
    };
    fetchUser();
  }, []);

  const saveSettings = async () => {
    setSaveMessage(null);
    const trimmedKey = userApiKey.trim();
    
    // VALIDATION: If not empty, must be a valid Apify Key format
    if (trimmedKey !== '' && (!trimmedKey.startsWith('apify_api_') || trimmedKey.length < 30)) {
      setSaveMessage({ type: 'error', text: 'Invalid key. Apify keys must start with "apify_api_" and be at least 30 characters long.' });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ 
        id: user.id, 
        apify_key: trimmedKey || null, // EXPLICITLY NULL IF EMPTY
        updated_at: new Date().toISOString() 
      });

      if (!error) {
        if (!trimmedKey) {
          setSaveMessage({ type: 'info', text: 'API Key removed. You are now being directed to Demo Mode.' });
        } else {
          setSaveMessage({ type: 'success', text: 'Congrats! Your API key is saved and you are now in Live Mode.' });
        }
        setTimeout(() => {
          setShowSettings(false);
          window.location.reload();
        }, 2000);
      } else {
        setSaveMessage({ type: 'error', text: 'Error saving settings: ' + error.message });
      }
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`${styles.actions} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        {isMobileMenuOpen && (
          <div className={styles.mobileNav}>
            <Link href="/scrape" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              <Search size={18} />
              Scrape Leads
            </Link>
            <Link href="/orders" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              <ShoppingBag size={18} />
              Orders
            </Link>
            <button className={styles.mobileNavLink} onClick={handleLogout} style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}

        <div className={styles.planBadgeArea} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '24px', flexShrink: 0 }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            backgroundColor: userPlan === 'Free' ? '#f3f4f6' : '#ecfdf5',
            color: userPlan === 'Free' ? '#6b7280' : '#059669',
            padding: '4px 10px',
            borderRadius: '100px',
            border: `1px solid ${userPlan === 'Free' ? '#e5e7eb' : '#d1fae5'}`
          }}>
            {userPlan} Plan
          </span>
          {userPlan === 'Free' && (
            <a href="/#pricing" style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', textDecoration: 'none', borderBottom: '1px solid #2563eb' }}>
              Upgrade
            </a>
          )}
        </div>
        <div className={styles.profile}>
          <button onClick={() => { setShowSettings(true); setIsMobileMenuOpen(false); }} className={styles.settingsBtn} title="Settings">
            <Settings size={20} />
          </button>
          <div className={styles.avatar}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Settings</h3>

            {saveMessage && (
              <div style={{ 
                padding: '14px 18px', 
                borderRadius: '16px', 
                marginBottom: '24px',
                fontSize: '14px',
                lineHeight: '1.5',
                backgroundColor: saveMessage.type === 'success' ? '#ecfdf5' : saveMessage.type === 'error' ? '#fef2f2' : '#eff6ff',
                color: saveMessage.type === 'success' ? '#065f46' : saveMessage.type === 'error' ? '#991b1b' : '#1e40af',
                border: `1px solid ${saveMessage.type === 'success' ? '#d1fae5' : saveMessage.type === 'error' ? '#fee2e2' : '#dbeafe'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {saveMessage.type === 'success' && <CheckCircle2 size={18} />}
                {saveMessage.type === 'info' && <Info size={18} />}
                {saveMessage.type === 'error' && <X size={18} />}
                <span>{saveMessage.text}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Your Apify API Key</label>
              <input 
                type="password" 
                placeholder="apify_api_..." 
                value={userApiKey} 
                onChange={(e) => setUserApiKey(e.target.value)} 
                disabled={isSaving}
              />
              <p className={styles.helpText}>Enter your own Apify key to unlock higher scraping limits (50-500 leads).</p>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowSettings(false)} className={styles.cancelBtn} disabled={isSaving}>Cancel</button>
              <button onClick={saveSettings} className={styles.saveBtn} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
