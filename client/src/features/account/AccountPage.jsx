import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { useDeleteAccount } from './api.js';

export default function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Require typing the exact email to enable the destructive action.
  const canDelete = confirmText.trim().toLowerCase() === user?.email;

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      await deleteAccount.mutateAsync();
      toast.success('Your account has been deleted.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not delete your account.');
    }
  };

  const closeDialog = (open) => {
    setDialogOpen(open);
    if (!open) setConfirmText('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Display name</span>
            <span className="font-medium">{user?.displayName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all of your decks and cards.
            This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDialogOpen(true)}>
            Delete account
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your decks and
              cards. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type <span className="font-semibold">{user?.email}</span> to
              confirm
            </Label>
            <Input
              id="confirm-email"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user?.email}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete || deleteAccount.isPending}
              onClick={handleDelete}
            >
              {deleteAccount.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
