import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as userService from '../services/userService';
import * as authService from '../services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Lock,
  Bell,
  Clock,
  Loader2,
  Save
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    emailNotifications: user?.emailNotifications ?? true,
    reminderTime: user?.reminderTime || 24,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await userService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        emailNotifications: profileData.emailNotifications,
        reminderTime: profileData.reminderTime,
      });

      if (res.success && user) {
        updateUser({
          ...user,
          ...profileData,
        });
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-[#94a3b8] mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Info */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#7c3aed]" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <Input
                  id="email"
                  value={user?.email}
                  disabled
                  className="pl-10 bg-[#0f172a] border-purple-500/30 text-[#94a3b8]"
                />
              </div>
              <p className="text-xs text-[#64748b]">Email cannot be changed</p>
            </div>

            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#ec4899]" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#94a3b8]" />
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-[#94a3b8]">Receive reminders via email</p>
                </div>
              </div>
              <Switch
                checked={profileData.emailNotifications}
                onCheckedChange={(checked) => setProfileData({ ...profileData, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#94a3b8]" />
                <div>
                  <p className="text-white font-medium">Reminder Time</p>
                  <p className="text-sm text-[#94a3b8]">Hours before deadline to send reminder</p>
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={168}
                value={profileData.reminderTime}
                onChange={(e) => setProfileData({ ...profileData, reminderTime: parseInt(e.target.value) })}
                className="w-24 bg-[#1e293b] border-purple-500/30 text-white"
              />
            </div>

            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#f59e0b]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-[#0f172a] border-purple-500/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-[#0f172a] border-purple-500/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-[#0f172a] border-purple-500/30 text-white"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
