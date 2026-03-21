import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const TrelloCardShare = ({ connectionId, cardId, boardId, cardName, boardName, onSuccess }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [permissionLevel, setPermissionLevel] = useState('view');
  const [expirationDays, setExpirationDays] = useState(0);
  const [restrictEmails, setRestrictEmails] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const handleGenerateLink = async () => {
    setIsGenerating(true);
    
    try {
      const response = await axios.post(`${API_URL}/shared-links/generate`, {
        connectionId,
        trelloCardId: cardId,
        trelloBoardId: boardId,
        trelloCardName: cardName,
        trelloBoardName: boardName,
        permissionLevel,
        expirationDays: parseInt(expirationDays, 10),
        allowedEmails: restrictEmails && allowedEmails ? 
          allowedEmails.split(',').map(email => email.trim()).filter(email => email) : 
          []
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setGeneratedLink(response.data.shareUrl);
        toast.success("Shareable link generated successfully!");
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error(response.data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error(error.message || "Failed to generate shareable link");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Link copied to clipboard!");
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast.error("Failed to copy link");
        });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Trello Card
        </CardTitle>
        <CardDescription>
          Generate a shareable link with customizable permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="permission">Permission Level</Label>
          <Select 
            value={permissionLevel} 
            onValueChange={setPermissionLevel}
          >
            <SelectTrigger id="permission">
              <SelectValue placeholder="Select permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">View Only</SelectItem>
              <SelectItem value="edit">Edit (Comments, Attachments, Due Dates)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expiration">Expires After (days)</Label>
          <Input 
            id="expiration"
            type="number"
            min="0"
            value={expirationDays}
            onChange={(e) => setExpirationDays(e.target.value)}
            placeholder="0 for no expiration"
          />
          <p className="text-xs text-muted-foreground">
            Set to 0 for no expiration
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={restrictEmails}
            onCheckedChange={setRestrictEmails}
            id="restrict-emails"
          />
          <Label htmlFor="restrict-emails">Restrict access to specific emails</Label>
        </div>
        
        {restrictEmails && (
          <div className="space-y-2">
            <Label htmlFor="emails">Allowed Emails</Label>
            <Textarea
              id="emails"
              value={allowedEmails}
              onChange={(e) => setAllowedEmails(e.target.value)}
              placeholder="Enter comma-separated email addresses"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Only these email addresses will be able to access the shared card
            </p>
          </div>
        )}
        
        {generatedLink && (
          <div className="p-3 bg-muted rounded-md">
            <Label className="text-xs">Shareable Link</Label>
            <div className="flex items-center mt-1">
              <Input 
                value={generatedLink} 
                readOnly 
                className="pr-10"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-[-40px]" 
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!generatedLink ? (
          <Button 
            onClick={handleGenerateLink} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Shareable Link"
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleCopyLink} 
            variant="secondary"
            className="w-full"
          >
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TrelloCardShare;
