
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatAccountDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
};

const UserProfile = () => {
  const { currentUser, signOut, updateProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'ShareT user';
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (open) setFullName(displayName);
  };

  const handleUpdateProfile = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      await updateProfile({ name: trimmedName });
      setIsDialogOpen(false);
    } catch {
      // AuthContext presents the API error consistently.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={currentUser?.avatarUrl} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>{currentUser?.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Account created: {formatAccountDate(currentUser?.createdAt)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={currentUser?.email} disabled />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdateProfile}
                disabled={isSaving || !fullName.trim()}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" onClick={signOut}>Sign Out</Button>
      </CardFooter>
    </Card>
  );
};

export default UserProfile;
