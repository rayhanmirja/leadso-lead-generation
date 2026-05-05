'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import TopNav from '@/components/TopNav';
import styles from './Scrape.module.css';
import { Search, Download, CheckCircle2, RefreshCw, Building2, Stethoscope, Megaphone, Wrench, Gavel, Check, Info } from 'lucide-react';

export default function ScrapePage() {
  const [jobName, setJobName] = useState('');
  const [location, setLocation] = useState('');
  const [leadsCount, setLeadsCount] = useState('5');
  const [jobStatus, setJobStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [userPlan, setUserPlan] = useState('Free');
  const [hasUserApiKey, setHasUserApiKey] = useState(false);

  useEffect(() => {
    const checkMode = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subs } = await supabase.from('subscriptions').select('plan_name').eq('user_id', user.id).eq('status', 'active');
        if (subs && subs.length > 0) {
          const plans = subs.map(s => s.plan_name);
          if (plans.includes('Scale')) setUserPlan('Scale');
          else if (plans.includes('Growth')) setUserPlan('Growth');
          else if (plans.includes('Basic')) setUserPlan('Basic');
        }
        const { data: profile } = await supabase.from('profiles').select('apify_key').eq('id', user.id).maybeSingle();
        if (profile?.apify_key && profile.apify_key.trim() !== '') {
          setIsDemoMode(false);
          setHasUserApiKey(true);
        }
      }
    };
    checkMode();
  }, []);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName || !location) return;
    setJobStatus('running');
    setActiveStep(1);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', jobName, location, maxLeads: parseInt(leadsCount) })
      });
      const startData = await response.json();
      if (!response.ok) {
        alert(`Error: ${startData.error || 'Failed to start job'}`);
        setJobStatus('idle');
        setActiveStep(0);
        return;
      }
      const { runId, maxLeadsRequested } = startData;
      const poll = async () => {
        try {
          const statusRes = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', runId, jobName, location, maxLeadsRequested })
          });
          const statusData = await statusRes.json();
          if (statusData.status === 'SUCCEEDED') {
            setActiveStep(2);
            setCompletedOrder({ leads: statusData.leads.length, orderId: statusData.orderId, query: jobName, data: statusData.leads });
            setTimeout(() => { setActiveStep(3); setJobStatus('completed'); }, 800);
            return;
          }
          if (statusData.status === 'FAILED' || statusData.error) {
            alert(`Error: ${statusData.error || 'Job Failed'}`);
            setJobStatus('idle');
            setActiveStep(0);
            return;
          }
          setTimeout(poll, 2000);
        } catch (err) { setTimeout(poll, 3000); }
      };
      poll();
    } catch (error: any) { alert(`Error: ${error.message}`); setJobStatus('idle'); setActiveStep(0); }
  };

  const downloadCSV = () => {
    if (!completedOrder || !completedOrder.data) return;
    const headers = Object.keys(completedOrder.data[0]).join(',');
    const rows = completedOrder.data.map((row: any) => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${completedOrder.orderId}_leads.csv`;
    a.click();
  };

  const limitNum = userPlan === 'Scale' ? 500 : userPlan === 'Growth' ? 100 : userPlan === 'Basic' ? 50 : 5;

  return (
    <>
      <TopNav title="Scrape Leads" />
      
      <div className={styles.mainLayout}>
        <div className={styles.dashboardWrapper}>
          <div className={styles.scrapeSection}>
            <div className={styles.header}>
              <div className={styles.titleArea}>
                <h2>New Scrape Job</h2>
                {isDemoMode && <span className={styles.demoBadge}>Demo</span>}
              </div>
              <p className={styles.onboardingText}>Enter a description of the leads you want to find. Our system will find the most relevant results for you.</p>
              {isDemoMode && (
                <div className={styles.onboardingGuide}>
                  <Info size={14} />
                  <span>Add your Apify API key in Settings to unlock real-time scraping.</span>
                </div>
              )}
            </div>

            <form className={styles.form} onSubmit={handleScrape}>
              <div className="form-group">
                <label className="label">Business Type / Keyword</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={isDemoMode ? "Select an industry below..." : "e.g., Dentists, Marketing Agencies"} 
                  value={jobName} 
                  onChange={(e) => setJobName(e.target.value)} 
                  disabled={isDemoMode || jobStatus === 'running'} 
                />
              </div>
              <div className="form-group">
                <label className="label">Location (City, Country)</label>
                <input type="text" className="input-field" placeholder="e.g., New York, NY" value={location} onChange={(e) => setLocation(e.target.value)} disabled={jobStatus === 'running'} />
              </div>
              <div className="form-group">
                <label className="label">Max Leads</label>
                <input 
                  type="number" 
                  className="input-field" 
                  min="1" 
                  max={limitNum} 
                  value={leadsCount} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > limitNum) setLeadsCount(limitNum.toString());
                    else setLeadsCount(e.target.value);
                  }} 
                  disabled={jobStatus === 'running'} 
                />
                <p className={styles.planNotice}>
                  Maximum limit is {limitNum} leads per session.
                </p>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={jobStatus === 'running' || !jobName || !location}>
                {jobStatus === 'running' ? <RefreshCw className={styles.spin} size={18} /> : <Search size={18} />}
                <span>{jobStatus === 'running' ? 'Scraping Leads...' : 'Start Scraping'}</span>
              </button>
            </form>

            <div className={styles.templates}>
              <p className={styles.templateTitle}>SUGGESTED INDUSTRIES</p>
              <div className={styles.templateGrid}>
                <button onClick={() => setJobName('Real Estate')} className={`${styles.templateBtn} ${jobName === 'Real Estate' ? styles.selectedTemplate : ''}`}><Building2 size={16} /> Real Estate</button>
                <button onClick={() => setJobName('Healthcare')} className={`${styles.templateBtn} ${jobName === 'Healthcare' ? styles.selectedTemplate : ''}`}><Stethoscope size={16} /> Healthcare</button>
                <button onClick={() => setJobName('Agencies')} className={`${styles.templateBtn} ${jobName === 'Agencies' ? styles.selectedTemplate : ''}`}><Megaphone size={16} /> Agencies</button>
                <button onClick={() => setJobName('Home Services')} className={`${styles.templateBtn} ${jobName === 'Home Services' ? styles.selectedTemplate : ''}`}><Wrench size={16} /> Home Services</button>
                <button onClick={() => setJobName('Lawyers')} className={`${styles.templateBtn} ${jobName === 'Lawyers' ? styles.selectedTemplate : ''}`}><Gavel size={16} /> Lawyers</button>
                <button onClick={() => setJobName('Restaurants')} className={`${styles.templateBtn} ${jobName === 'Restaurants' ? styles.selectedTemplate : ''}`}><Check size={16} /> Restaurants</button>
              </div>
            </div>
          </div>

          <div className={`${styles.progressSection} ${jobStatus === 'running' ? styles.scanning : ''}`}>
            <div className={styles.header}>
              <h2 style={{ fontSize: '15px', color: '#495057' }}>Live Progress</h2>
            </div>
            <div className={styles.steps}>
              <div className={`${styles.step} ${activeStep >= 1 ? styles.activeStep : ''} ${activeStep > 1 ? styles.completedStep : ''}`}>
                <div className={styles.stepIndicator}>{activeStep > 1 ? <Check size={14} /> : 1}</div>
                <div className={styles.stepContent}>
                  <h3>1. Lead Extraction</h3>
                  <p>Scraping profiles from Google Places</p>
                </div>
              </div>
              <div className={`${styles.step} ${activeStep >= 2 ? styles.activeStep : ''} ${activeStep > 2 ? styles.completedStep : ''}`}>
                <div className={styles.stepIndicator}>{activeStep > 2 ? <Check size={14} /> : 2}</div>
                <div className={styles.stepContent}>
                  <h3>2. Completion & Output</h3>
                  <p>Compiling final CSV and preparing export</p>
                </div>
              </div>
            </div>

            {jobStatus === 'completed' && completedOrder && (
              <div className={styles.successArea}>
                <div className={styles.successMessage}>
                  <div style={{ background: '#166534', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                    <Check size={20} color="white" />
                  </div>
                  <div>
                    <h3>Job Completed Successfully!</h3>
                    <p>Extracted {completedOrder.leads} leads for "{completedOrder.query}".</p>
                  </div>
                </div>
                <button onClick={downloadCSV} className={styles.downloadBtn}>
                  <Download size={16} />
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
