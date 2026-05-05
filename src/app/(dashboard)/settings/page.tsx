'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import TopNav from '@/components/TopNav';
import styles from './Settings.module.css';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [apifyKey, setApifyKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('apify_key').eq('id', user.id).maybeSingle();
          if (profile) setApifyKey(profile.apify_key || '');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmedKey = apifyKey.trim();

    // VALIDATION: If not empty, must be a valid Apify Key format
    if (trimmedKey !== '' && (!trimmedKey.startsWith('apify_api_') || trimmedKey.length < 30)) {
      setMessage({ type: 'error', text: 'Invalid key. Apify keys must start with "apify_api_" and be at least 30 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.from('profiles').upsert({ 
          id: user.id, 
          apify_key: trimmedKey || null, 
          updated_at: new Date().toISOString() 
        });

        if (!error) {
          if (!trimmedKey) {
            setMessage({ type: 'info', text: 'API Key removed. You are now being directed to Demo Mode.' });
          } else {
            setMessage({ type: 'success', text: 'Congrats! Your API key is saved and you are now in Live Mode.' });
          }
          // Sync with TopNav by triggering a reload after a short delay
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setMessage({ type: 'error', text: 'Database error: ' + error.message });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <TopNav title="Settings" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className={styles.spin} />
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav title="Settings" />
      
      <div className="card">
        <div className={styles.header}>
          <h2>Configuration</h2>
          <p>Manage your API keys and customize your scraping environment.</p>
        </div>

        {message && (
          <div style={{ 
            padding: '14px 18px', 
            borderRadius: '16px', 
            marginBottom: '24px',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : message.type === 'error' ? '#fef2f2' : '#eff6ff',
            color: message.type === 'success' ? '#065f46' : message.type === 'error' ? '#991b1b' : '#1e40af',
            border: `1px solid ${message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#dbeafe'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>{message.text}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSave}>
          <h3 className={styles.sectionTitle}>API Keys</h3>
          <div className="form-group">
            <label className="label">Apify API Token</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="apify_api_..." 
              value={apifyKey}
              onChange={(e) => setApifyKey(e.target.value)}
              disabled={loading}
            />
            <p className={styles.helpText}>Used for scraping leads via Apify Actors.</p>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
