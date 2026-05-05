'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Search, Download, Database, Zap, ArrowRight, Star, ChevronLeft, ChevronRight, Building2, Stethoscope, Megaphone, Wrench, Menu, X } from 'lucide-react';
import styles from './Landing.module.css';
import Logo from '@/components/Logo';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, GrowthOps",
    content: "Leadso has completely transformed our outbound process. We went from scraping 50 leads a day to 500 in minutes.",
    rating: 5
  },
  {
    name: "Mark Thompson",
    role: "Sales Director, TechScale",
    content: "The accuracy of the data is incredible. The CSV export is clean and ready for our CRM immediately.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Lead Gen Agency",
    content: "Best Google Places scraper I've used. No complex setup, no proxy issues. It just works.",
    rating: 5
  }
];

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePayment = async (planName: string, amount: number) => {
    try {
      const res = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, amount })
      });

      const data = await res.json();
      
      if (res.status === 401) {
        localStorage.setItem('pendingPlan', JSON.stringify({ planName, amount }));
        window.location.href = '/signup';
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Payment initialization failed: ' + (data.details || data.error));
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while connecting to the payment gateway.');
    }
  };

  return (
    <div id="home" className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
          <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/login" className={styles.loginBtn}>Login</Link>
            <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="hero" className={styles.hero}>
          <div className={styles.heroBadge}>AI-Powered Search Engine</div>
          <h1>Find your next 100 customers <br /><span className={styles.gradientText}>with AI Precision.</span></h1>
          <p>The smartest way to scrape leads from Google Places. Our AI-driven discovery engine finds company names, websites, and contact info in seconds.</p>
          <div className={styles.heroBtns}>
            <Link href="/signup" autoFocus className={`btn-primary ${styles.heroBtnMain}`}>
              Start Scraping Free
              <ArrowRight size={18} />
            </Link>
            <Link href="#pricing" className={styles.heroBtnSecondary}>View Pricing</Link>
          </div>
          
          <div className={styles.heroPreview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewDots}>
                <span /> <span /> <span />
              </div>
              <div className={styles.previewAddress}>app.leadso.com/scrape</div>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewRow}>
                <div className={styles.previewSearch}>AI Intent: Dentist in New York</div>
                <div className={styles.previewBadge}>Analyzing...</div>
              </div>
              <div className={styles.previewTable}>
                {[1,2,3].map(i => (
                  <div key={i} className={styles.tableRow}>
                    <div className={styles.skeleton} style={{width: '30%'}} />
                    <div className={styles.skeleton} style={{width: '20%'}} />
                    <div className={styles.skeleton} style={{width: '40%'}} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Brands Section */}
        <section className={styles.brandsSection}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Trusted by 500+ teams worldwide
            </p>
          </div>
          <div className={styles.brandsTrack}>
            {[
              "HubSpot", "Apollo", "Outreach", "Salesloft", "Lemlist", "Instantly",
              "HubSpot", "Apollo", "Outreach", "Salesloft", "Lemlist", "Instantly"
            ].map((brand, i) => (
              <div key={i} className={styles.brand}><span>{brand}</span></div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className={styles.testimonialsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.tag}>Success Stories</span>
            <h2>Loved by growth teams.</h2>
          </div>
          
          <div className={styles.testimonialContainer}>
            <div className={styles.testimonialCard}>
              <div className={styles.stars}>
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className={styles.testimonialText}>"{testimonials[activeTestimonial].content}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>{testimonials[activeTestimonial].name.charAt(0)}</div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>{testimonials[activeTestimonial].name}</div>
                  <div className={styles.authorRole}>{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>

            <div className={styles.pagination}>
              {testimonials.map((_, i) => (
                <button 
                  key={i} 
                  className={`${styles.dot} ${activeTestimonial === i ? styles.activeDot : ''}`}
                  onClick={() => setActiveTestimonial(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.tag}>Built for Speed</span>
            <h2>Everything you need to <br /> find local leads.</h2>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Search size={24} /></div>
              <h3>AI-Driven Discovery</h3>
              <p>Our intelligent engine understands your search intent and finds the most relevant business listings across any industry.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Database size={24} /></div>
              <h3>Accurate Data</h3>
              <p>Extract verified phone numbers, websites, and physical addresses directly from official listings.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Download size={24} /></div>
              <h3>Instant CSV Export</h3>
              <p>Download your leads in a clean, spreadsheet-ready CSV format immediately after scraping.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Zap size={24} /></div>
              <h3>Zero-Config Setup</h3>
              <p>No complex API keys or AI training needed. Just type your target audience and start finding leads.</p>
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className={styles.industriesSection}>
          <div className={styles.industriesContent}>
            <div className={styles.industriesHeader}>
              <span className={styles.tag}>Built for Growth</span>
              <h2>Powering every industry.</h2>
              <p>From local services to global agencies, Leadso finds the data you need to grow your business.</p>
            </div>
            
            <div className={styles.industryGrid}>
              <div className={styles.industryCard}>
                <div className={styles.industryIcon}><Building2 size={24} /></div>
                <h3>Real Estate</h3>
                <p>Find agents, brokers, and property managers in any city to scale your listings.</p>
              </div>
              <div className={styles.industryCard}>
                <div className={styles.industryIcon}><Stethoscope size={24} /></div>
                <h3>Healthcare</h3>
                <p>Target dental clinics, therapists, and specialists for high-value medical sales.</p>
              </div>
              <div className={styles.industryCard}>
                <div className={styles.industryIcon}><Megaphone size={24} /></div>
                <h3>Agencies</h3>
                <p>Connect with local businesses that need web design, SEO, and digital marketing.</p>
              </div>
              <div className={styles.industryCard}>
                <div className={styles.industryIcon}><Wrench size={24} /></div>
                <h3>Home Services</h3>
                <p>Reach out to plumbers, electricians, and contractors for specialized tools and services.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className={styles.pricingSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.tag}>Transparent Pricing</span>
            <h2>Simple plans for every stage.</h2>
          </div>

          <div className={styles.pricingGrid}>
            {/* Basic */}
            <div className={styles.pricingCard}>
              <div className={styles.planName}>Basic</div>
              <div className={styles.price}>
                <span className={styles.currency}>BDT</span>
                <span className={styles.amount}>1</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.planDesc}>Perfect for individuals starting their outreach journey.</p>
              <ul className={styles.features}>
                <li><CheckCircle2 size={18} /> 1,000 Total Leads</li>
                <li><CheckCircle2 size={18} /> Google Places Scraping</li>
                <li><CheckCircle2 size={18} /> Phone & Website Extraction</li>
                <li><CheckCircle2 size={18} /> Clean CSV Downloads</li>
              </ul>
              <button onClick={() => handlePayment('Basic', 1)} className={styles.pricingBtn}>Get Started</button>
            </div>

            {/* Growth */}
            <div className={`${styles.pricingCard} ${styles.popular}`}>
              <div className={styles.mostPopular}>Most Popular</div>
              <div className={styles.planName}>Growth</div>
              <div className={styles.price}>
                <span className={styles.currency}>BDT</span>
                <span className={styles.amount}>2</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.planDesc}>For growing teams running scaled outreach plays.</p>
              <ul className={styles.features}>
                <li><CheckCircle2 size={18} /> 2,500 Total Leads</li>
                <li><CheckCircle2 size={18} /> Faster Scraping Speed</li>
                <li><CheckCircle2 size={18} /> Priority Search Processing</li>
                <li><CheckCircle2 size={18} /> Premium Support Access</li>
              </ul>
              <button onClick={() => handlePayment('Growth', 2)} className={`${styles.pricingBtn} ${styles.pricingBtnPrimary}`}>Get Started</button>
            </div>

            {/* Scale */}
            <div className={styles.pricingCard}>
              <div className={styles.planName}>Scale</div>
              <div className={styles.price}>
                <span className={styles.currency}>BDT</span>
                <span className={styles.amount}>3</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.planDesc}>For agencies and high-volume operations.</p>
              <ul className={styles.features}>
                <li><CheckCircle2 size={18} /> 10,000 Total Leads</li>
                <li><CheckCircle2 size={18} /> Highest Scraping Priority</li>
                <li><CheckCircle2 size={18} /> Unlimited Daily Sessions</li>
                <li><CheckCircle2 size={18} /> Dedicated Support Rep</li>
              </ul>
              <button onClick={() => handlePayment('Scale', 3)} className={styles.pricingBtn}>Get Started</button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.bottomCta}>
          <h2>Get started today with 50 free leads</h2>
          <p>No credit card required. Start finding your next customer in seconds.</p>
          <Link href="/signup" className={`btn-primary ${styles.largeBtn}`}>
            Get Started Free
          </Link>
          <p className={styles.chromeRating}>Used by 500+ sales professionals</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <Logo size={28} />
            <p>The world's fastest Google Places scraper for modern sales teams.</p>
            <p className={styles.copyright}>© 2026 Leadso</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Product</h4>
            <a href="#">Lead Finder</a>
            <a href="#">Google Places Scraper</a>
            <a href="#">CSV Export</a>
            <a href="#">Data Accuracy</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Resources</h4>
            <a href="#">Blog</a>
            <a href="#">Help Center</a>
            <a href="#">Tutorials</a>
            <a href="#">Data Accuracy</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
