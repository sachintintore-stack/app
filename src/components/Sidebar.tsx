import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  BarChart3,
  CreditCard,
  User,
  Settings,
  Menu,
  X,
  BookOpen,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assignments', label: 'Assignments', icon: ClipboardList },
  { path: '/study-planner', label: 'Study Planner', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
];

const bottomNavItems = [
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1e293b] border border-purple-500/30 text-white"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-[#1e293b] border-r border-purple-500/20',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-purple-500/20">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">StudyFlow</h1>
              <p className="text-xs text-[#94a3b8]">Pro</p>
            </div>
          </NavLink>
        </div>

        {/* Main Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:bg-purple-500/10 group',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-[#7c3aed]/20 to-transparent border-l-2 border-[#7c3aed] text-white'
                    : 'text-[#94a3b8]'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive(item.path) ? 'text-[#7c3aed]' : 'group-hover:text-[#7c3aed]'
                )} />
                <span className="font-medium">{item.label}</span>
                {item.path === '/subscription' && user?.subscriptionPlan !== 'free' && (
                  <Crown className="w-4 h-4 text-[#f59e0b] ml-auto" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20">
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'hover:bg-purple-500/10 group',
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-[#7c3aed]/20 to-transparent border-l-2 border-[#7c3aed] text-white'
                      : 'text-[#94a3b8]'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive(item.path) ? 'text-[#7c3aed]' : 'group-hover:text-[#7c3aed]'
                  )} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-purple-500/10">
            <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#94a3b8] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
