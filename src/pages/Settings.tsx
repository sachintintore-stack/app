import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as userService from '../services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Moon,
  Sun,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Settings() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-[#94a3b8] mt-1">
          Manage your app preferences and account
        </p>
      </div>

      {/* Appearance */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-[#7c3aed]" /> : <Sun className="w-5 h-5 text-[#f59e0b]" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]">
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-sm text-[#94a3b8]">Toggle between light and dark theme</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LogOut className="w-5 h-5 text-[#ec4899]" />
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0f172a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Logout</p>
                <p className="text-sm text-[#94a3b8]">Sign out from your account</p>
              </div>
              <Button
                variant="outline"
                className="border-purple-500/30"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 font-medium">Delete Account</p>
                <p className="text-sm text-[#94a3b8]">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]">
              <div>
                <p className="text-white font-medium">Version</p>
                <p className="text-sm text-[#94a3b8]">StudyFlow Pro v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]">
              <div>
                <p className="text-white font-medium">Support</p>
                <p className="text-sm text-[#94a3b8]">Get help and contact us</p>
              </div>
              <Button
                variant="outline"
                className="border-purple-500/30"
                onClick={() => window.open('mailto:support@studyflow.pro', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1e293b] border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Account?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#94a3b8]">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">
                All your assignments, study sessions, and account information will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Yes, Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
