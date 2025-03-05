
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Lock, Bell, FileText, UserCircle } from 'lucide-react';

export const UserPreferences = () => {
  const [preferences, setPreferences] = useState({
    notifications: {
      emailNotifications: true,
      linkCreated: true,
      linkViewed: true,
      linkExpiringSoon: true,
      weeklyDigest: false,
    },
    sharing: {
      defaultExpiryDays: '30',
      defaultReadOnly: true,
      defaultAllowComments: false,
      askConfirmationBeforeSharing: true,
    },
    appearance: {
      compactMode: false,
      showThumbnails: true,
      defaultView: 'list',
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '60',
      passwordResetInterval: 'never',
      showSecurityAlerts: true,
    }
  });
  
  const [initialPreferences, setInitialPreferences] = useState({});
  
  // Simulate loading preferences
  useEffect(() => {
    // In a real app, this would fetch from an API or local storage
    setInitialPreferences({ ...preferences });
  }, []);
  
  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
  
  const handleSavePreferences = () => {
    // In a real app, this would save to an API or local storage
    setInitialPreferences({ ...preferences });
    toast.success('Preferences saved successfully');
  };
  
  const resetPreferences = () => {
    setPreferences({ ...initialPreferences });
    toast.info('Changes discarded');
  };
  
  const updateNotificationSetting = (key, value) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    });
  };
  
  const updateSharingSetting = (key, value) => {
    setPreferences({
      ...preferences,
      sharing: {
        ...preferences.sharing,
        [key]: value
      }
    });
  };
  
  const updateAppearanceSetting = (key, value) => {
    setPreferences({
      ...preferences,
      appearance: {
        ...preferences.appearance,
        [key]: value
      }
    });
  };
  
  const updateSecuritySetting = (key, value) => {
    setPreferences({
      ...preferences,
      security: {
        ...preferences.security,
        [key]: value
      }
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Preferences</h2>
        {hasChanges && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetPreferences}>
              Discard Changes
            </Button>
            <Button onClick={handleSavePreferences}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="sharing">
            <FileText className="mr-2 h-4 w-4" />
            Sharing
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <UserCircle className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive emails for important notifications
                  </span>
                </Label>
                <Switch 
                  id="email-notifications" 
                  checked={preferences.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="link-created" className="flex flex-col space-y-1">
                  <span>Link Created</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Notify when a new share link is created
                  </span>
                </Label>
                <Switch 
                  id="link-created" 
                  checked={preferences.notifications.linkCreated}
                  onCheckedChange={(checked) => updateNotificationSetting('linkCreated', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="link-viewed" className="flex flex-col space-y-1">
                  <span>Link Viewed</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Notify when someone views your shared content
                  </span>
                </Label>
                <Switch 
                  id="link-viewed" 
                  checked={preferences.notifications.linkViewed}
                  onCheckedChange={(checked) => updateNotificationSetting('linkViewed', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="link-expiring" className="flex flex-col space-y-1">
                  <span>Link Expiring Soon</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Notify when a share link is about to expire
                  </span>
                </Label>
                <Switch 
                  id="link-expiring" 
                  checked={preferences.notifications.linkExpiringSoon}
                  onCheckedChange={(checked) => updateNotificationSetting('linkExpiringSoon', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-digest" className="flex flex-col space-y-1">
                  <span>Weekly Digest</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive a weekly summary of share link activity
                  </span>
                </Label>
                <Switch 
                  id="weekly-digest" 
                  checked={preferences.notifications.weeklyDigest}
                  onCheckedChange={(checked) => updateNotificationSetting('weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle>Sharing Preferences</CardTitle>
              <CardDescription>
                Configure your default sharing settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-expiry" className="flex flex-col space-y-1">
                  <span>Default Expiry</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    How long should share links be valid by default
                  </span>
                </Label>
                <Select 
                  value={preferences.sharing.defaultExpiryDays}
                  onValueChange={(value) => updateSharingSetting('defaultExpiryDays', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="default-readonly" className="flex flex-col space-y-1">
                  <span>Default to Read-only</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Make shared content read-only by default
                  </span>
                </Label>
                <Switch 
                  id="default-readonly" 
                  checked={preferences.sharing.defaultReadOnly}
                  onCheckedChange={(checked) => updateSharingSetting('defaultReadOnly', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="default-comments" className="flex flex-col space-y-1">
                  <span>Allow Comments by Default</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Allow viewers to comment on shared content by default
                  </span>
                </Label>
                <Switch 
                  id="default-comments" 
                  checked={preferences.sharing.defaultAllowComments}
                  onCheckedChange={(checked) => updateSharingSetting('defaultAllowComments', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="ask-confirmation" className="flex flex-col space-y-1">
                  <span>Ask for Confirmation</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Ask for confirmation before creating share links
                  </span>
                </Label>
                <Switch 
                  id="ask-confirmation" 
                  checked={preferences.sharing.askConfirmationBeforeSharing}
                  onCheckedChange={(checked) => updateSharingSetting('askConfirmationBeforeSharing', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Preferences</CardTitle>
              <CardDescription>
                Customize the look and feel of your ShareT experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="flex flex-col space-y-1">
                  <span>Compact Mode</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Display more content with less whitespace
                  </span>
                </Label>
                <Switch 
                  id="compact-mode" 
                  checked={preferences.appearance.compactMode}
                  onCheckedChange={(checked) => updateAppearanceSetting('compactMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-thumbnails" className="flex flex-col space-y-1">
                  <span>Show Thumbnails</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Display thumbnails for share links
                  </span>
                </Label>
                <Switch 
                  id="show-thumbnails" 
                  checked={preferences.appearance.showThumbnails}
                  onCheckedChange={(checked) => updateAppearanceSetting('showThumbnails', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="default-view" className="flex flex-col space-y-1">
                  <span>Default View</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Choose how share links are displayed by default
                  </span>
                </Label>
                <Select 
                  value={preferences.appearance.defaultView}
                  onValueChange={(value) => updateAppearanceSetting('defaultView', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="calendar">Calendar View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>
                Configure your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                  <span>Two-Factor Authentication</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Require a second form of authentication when signing in
                  </span>
                </Label>
                <Switch 
                  id="two-factor" 
                  checked={preferences.security.twoFactorAuth}
                  onCheckedChange={(checked) => updateSecuritySetting('twoFactorAuth', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="session-timeout" className="flex flex-col space-y-1">
                  <span>Session Timeout (minutes)</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    How long before you're automatically signed out
                  </span>
                </Label>
                <Select 
                  value={preferences.security.sessionTimeout}
                  onValueChange={(value) => updateSecuritySetting('sessionTimeout', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="720">12 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="password-reset" className="flex flex-col space-y-1">
                  <span>Password Reset Interval</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    How often you should reset your password
                  </span>
                </Label>
                <Select 
                  value={preferences.security.passwordResetInterval}
                  onValueChange={(value) => updateSecuritySetting('passwordResetInterval', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="security-alerts" className="flex flex-col space-y-1">
                  <span>Security Alerts</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive alerts about suspicious activity
                  </span>
                </Label>
                <Switch 
                  id="security-alerts" 
                  checked={preferences.security.showSecurityAlerts}
                  onCheckedChange={(checked) => updateSecuritySetting('showSecurityAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
