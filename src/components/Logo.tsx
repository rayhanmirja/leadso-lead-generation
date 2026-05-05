'use client';

import { Send } from 'lucide-react';

interface LogoProps {
  white?: boolean;
  size?: number;
}

export default function Logo({ white = false, size = 32 }: LogoProps) {
  const brandGreen = '#15803d'; // The green color used throughout the site

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: brandGreen,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <Send size={size * 0.55} fill="white" />
      </div>
      <span style={{
        fontSize: `${size * 0.65}px`,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: white ? 'white' : '#111827'
      }}>
        Leadso
      </span>
    </div>
  );
}
