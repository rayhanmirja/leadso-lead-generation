'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, List, Search, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import Logo from './Logo';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Scrape Leads', path: '/scrape', icon: <Search size={20} /> },
    { name: 'Orders', path: '/orders', icon: <LayoutDashboard size={20} /> },
  ];

  const generalItems = [
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    { name: 'Logout', path: '/logout', icon: <LogOut size={20} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <Link href="/scrape" style={{ textDecoration: 'none' }}>
        <div style={{ padding: '24px' }}>
          <Logo size={28} />
        </div>
      </Link>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>MENU</h3>
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path === '/orders' && pathname === '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>GENERAL</h3>
        <nav className={styles.nav}>
          {generalItems.map((item) => {
            const isActive = pathname === item.path;

            if (item.name === 'Logout') {
              return (
                <button
                  key={item.name}
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className={styles.navItem}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}
