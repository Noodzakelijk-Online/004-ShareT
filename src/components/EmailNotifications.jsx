
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Mail, Clock, AlertCircle } from 'lucide-react';

export const EmailNotifications = () => {
  const [emailSettings, setEmailSettings] = useState({
    notifications: {
      shareCreated: true,
      shareAccessed: true,
      shareAboutToExpire: true,
      shareExpired: true,
      weeklyDigest: false,
    },
    recipients: [
      { email: 'user@example.com', name: 'Primary User', primary: true }
    ],
    templates: {
      shareCreated: 'default',
      shareAccessed: 'default',
      shareExpiry: 'default',
      digest: 'default',
    }
  });
  
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '', primary: false });
  
  const addRecipient = () => {
    if (!newRecipient.email || !newRecipient.name) {
      toast.error('Please provide both email and name');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient.email)) {
      toast.error('Please provide a valid email address');
      return;
    }
    
    const updatedRecipients = [...emailSettings.recipients, newRecipient];
    setEmailSettings({
      ...emailSettings,
      recipients: updatedRecipients
    });
    setNewRecipient({ email: '', name: '', primary: false });
    toast.success('Recipient added successfully');
  };
  
  const removeRecipient = (index) => {
    const updatedRecipients = [...emailSettings.recipients];
    updatedRecipients.splice(index, 1);
    setEmailSettings({
      ...emailSettings,
      recipients: updatedRecipients
    });
    toast.success('Recipient removed');
  };
  
  const setPrimaryRecipient = (index) => {
    const updatedRecipients = emailSettings.recipients.map((recipient, i) => ({
      ...recipient,
      primary: i === index
    }));
    setEmailSettings({
      ...emailSettings,
      recipients: updatedRecipients
    });
    toast.success(`${updatedRecipients[index].name} set as primary recipient`);
  };
  
  const updateNotificationSetting = (key, value) => {
    setEmailSettings({
      ...emailSettings,
      notifications: {
        ...emailSettings.notifications,
        [key]: value
      }
    });
  };
  
  const updateTemplateSetting = (key, value) => {
    setEmailSettings({
      ...emailSettings,
      templates: {
        ...emailSettings.templates,
        [key]: value
      }
    });
  };
  
  const sendTestEmail = (type) => {
    toast.success(`Test ${type} email sent to primary recipient`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Notifications</h2>
        <Button onClick={() => toast.success('Settings saved')}>
          Save Settings
        </Button>
      </div>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">
            <Mail className="mr-2 h-4 w-4" />
            Notification Settings
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <Send className="mr-2 h-4 w-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="templates">
            <AlertCircle className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Settings</CardTitle>
              <CardDescription>
                Configure which events trigger email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-created" 
                  checked={emailSettings.notifications.shareCreated}
                  onCheckedChange={(checked) => updateNotificationSetting('shareCreated', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="share-created"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Share Link Created
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Send an email when a new share link is created
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-accessed" 
                  checked={emailSettings.notifications.shareAccessed}
                  onCheckedChange={(checked) => updateNotificationSetting('shareAccessed', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="share-accessed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Share Link Accessed
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Send an email when someone accesses your shared content
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-expiring" 
                  checked={emailSettings.notifications.shareAboutToExpire}
                  onCheckedChange={(checked) => updateNotificationSetting('shareAboutToExpire', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="share-expiring"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Share Link About to Expire
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Send an email when a share link is about to expire (3 days before)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-expired" 
                  checked={emailSettings.notifications.shareExpired}
                  onCheckedChange={(checked) => updateNotificationSetting('shareExpired', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="share-expired"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Share Link Expired
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Send an email when a share link has expired
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="weekly-digest" 
                  checked={emailSettings.notifications.weeklyDigest}
                  onCheckedChange={(checked) => updateNotificationSetting('weeklyDigest', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="weekly-digest"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Weekly Digest
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Send a weekly summary of all sharing activity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Notification Recipients</CardTitle>
              <CardDescription>
                Manage who receives email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {emailSettings.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      {recipient.primary && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!recipient.primary && (
                        <Button variant="outline" size="sm" onClick={() => setPrimaryRecipient(index)}>
                          Set as Primary
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => removeRecipient(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Add New Recipient</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email</Label>
                      <Input 
                        id="new-email" 
                        type="email" 
                        placeholder="email@example.com"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Name</Label>
                      <Input 
                        id="new-name" 
                        placeholder="John Doe"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="new-primary" 
                      checked={newRecipient.primary}
                      onCheckedChange={(checked) => setNewRecipient({...newRecipient, primary: checked})}
                    />
                    <label
                      htmlFor="new-primary"
                      className="text-sm font-medium leading-none"
                    >
                      Set as primary recipient
                    </label>
                  </div>
                  <Button onClick={addRecipient}>Add Recipient</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize the appearance and content of email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Share Created Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent when a new share link is created
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={emailSettings.templates.shareCreated}
                      onValueChange={(value) => updateTemplateSetting('shareCreated', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="branded">Branded</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => sendTestEmail('share created')}>
                      Test
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Share Accessed Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent when someone accesses your shared content
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={emailSettings.templates.shareAccessed}
                      onValueChange={(value) => updateTemplateSetting('shareAccessed', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => sendTestEmail('share accessed')}>
                      Test
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Share Expiry Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent when a share link is about to expire or has expired
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={emailSettings.templates.shareExpiry}
                      onValueChange={(value) => updateTemplateSetting('shareExpiry', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="reminder">Gentle Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => sendTestEmail('share expiry')}>
                      Test
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Weekly Digest Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent as a weekly summary of sharing activity
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={emailSettings.templates.digest}
                      onValueChange={(value) => updateTemplateSetting('digest', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => sendTestEmail('weekly digest')}>
                      Test
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => toast.success('All notification settings saved')}>
                  Save All Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
