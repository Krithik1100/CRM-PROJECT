import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, Megaphone, BarChart3, Zap } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-navy-950 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg leading-none">KK CRM</span>
            <p className="text-xs text-slate-500 mt-0.5">AI-Native CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(isActive ? 'nav-item-active' : 'nav-item')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
            M
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">Marketing Team</p>
            <p className="text-xs text-slate-500">KK Cafe</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
