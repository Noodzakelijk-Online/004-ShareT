import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Copy, Trash2, QrCode, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { sharedLinks } from '../api';

const PreviousLinks = ({ onShowQRCode }) => {
  const { toast } = useToast();
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fix #2: Fetch links from backend API (persistent, survives logout/restart)
  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const response = await sharedLinks.getAll();
      if (response.success && response.data) {
        setLinks(response.data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      // Fallback to localStorage
      const storedLinks = JSON.parse(localStorage.getItem('previousLinks') || '[]');
      setLinks(storedLinks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopyLink = (shareId) => {
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard.",
    });
  };

  const handleDeleteLink = async (id) => {
    try {
      await sharedLinks.delete(id);
      setLinks(links.filter(link => link._id !== id));
      toast({
        title: "Link deleted",
        description: "The share link has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Error",
        description: "Failed to delete the link.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await sharedLinks.update(id, { isActive: !currentActive });
      fetchLinks(); // Refresh
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {links.length > 0 ? (
        links.map((link) => (
          <div key={link._id || link.shareId} className="flex justify-between items-center p-3 bg-secondary rounded-md">
            <div className="min-w-0 flex-1">
              <a
                href={`${window.location.origin}/shared/${link.shareId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold truncate hover:underline text-blue-600 hover:text-blue-800 block"
              >
                {link.cardName || 'Unnamed Card'}
              </a>
              <p className="text-sm text-muted-foreground">
                {link.boardName && `${link.boardName} • `}
                {link.isActive ? '🟢 Active' : '🔴 Inactive'}
                {link.expiresAt && ` • Expires: ${new Date(link.expiresAt).toLocaleDateString()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Views: {link.accessCount || 0}
                {link.createdAt && ` • Created: ${new Date(link.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex space-x-1 ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(link._id, link.isActive)}>
                      {link.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.isActive ? 'Deactivate' : 'Activate'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleCopyLink(link.shareId)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onShowQRCode(`${window.location.origin}/shared/${link.shareId}`)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show QR Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Dialog>
                <DialogTrigger asChild>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to delete this share link?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. The link will no longer be accessible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => handleDeleteLink(link._id)}>Yes, delete it</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">You have no previous share links.</p>
      )}
    </div>
  );
};

export default PreviousLinks;
