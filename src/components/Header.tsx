import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Bell,
  Crown,
  Flame,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as userService from '../services/userService';
import type { Reminder } from '../types';

export default function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await userService.getNotifications(1, 5);
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await userService.markNotificationAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await userService.markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <header className="h-16 border-b border-purple-500/20 bg-[#1e293b]/80 backdrop-blur-lg flex items-center justify-between px-4 lg:px-8">
      {/* Left side - could add breadcrumbs here */}
      <div className="flex items-center gap-4">
        {user?.subscriptionPlan !== 'free' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#f59e0b]/10 border border-[#f59e0b]/30">
            <Crown className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-sm font-medium text-[#f59e0b]">
              {user?.subscriptionPlan === 'yearly' ? 'Annual Plan' : 'Pro Plan'}
            </span>
          </div>
        )}
        {user && user.studyStreak > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-500">
              {user.studyStreak} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-[#94a3b8]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ec4899] text-xs flex items-center justify-center text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e293b] border border-purple-500/30 rounded-xl shadow-xl z-50">
              <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-[#7c3aed] hover:text-[#ec4899] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Sparkles className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                    <p className="text-[#94a3b8]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'p-4 border-b border-purple-500/10 cursor-pointer hover:bg-purple-500/5 transition-colors',
                        !notification.isRead && 'bg-purple-500/5'
                      )}
                    >
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-[#64748b] mt-2">
                        {new Date(notification.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-sm font-medium text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1e293b] border-purple-500/30">
            <div className="px-3 py-2">
              <p className="font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-[#94a3b8]">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
