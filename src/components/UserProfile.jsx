
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { currentUser, signOut } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const { toast } = useToast();
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleUpdateProfile = () => {
    // In a real app, this would call an API to update the profile
    try {
      // Update the local storage user data
      const storedUser = JSON.parse(localStorage.getItem('sharetUser'));
      const updatedUser = { ...storedUser, fullName };
      localStorage.setItem('sharetUser', JSON.stringify(updatedUser));
      
      // Update the localStorage user data
      localStorage.setItem(`user_${currentUser.email}`, JSON.stringify({
        ...JSON.parse(localStorage.getItem(`user_${currentUser.email}`)),
        fullName
      }));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName} />
            <AvatarFallback>{getInitials(currentUser?.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{currentUser?.fullName}</CardTitle>
            <CardDescription>{currentUser?.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Account created: {new Date(currentUser?.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={currentUser?.email} disabled />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" onClick={signOut}>Sign Out</Button>
      </CardFooter>
    </Card>
  );
};

export default UserProfile;
