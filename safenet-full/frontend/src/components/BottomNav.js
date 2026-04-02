import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',         icon: '🏠', label: 'Home'     },
  { to: '/contacts', icon: '👥', label: 'Contacts'  },
  { to: '/history',  icon: '📋', label: 'History'   },
  { to: '/settings', icon: '⚙️', label: 'Settings'  },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
