import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Copy, Trash2, QrCode } from "lucide-react";

const PreviousLinks = ({ onShowQRCode }) => {
  const { toast } = useToast();
  const [links, setLinks] = useState([]);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard.",
    });
  };

  const handleDeleteLink = (id) => {
    setLinks(links.filter(link => link.id !== id));
    toast({
      title: "Link deleted",
      description: "The share link has been deleted.",
    });
  };

  useEffect(() => {
    // Fetch previous links from localStorage or API
    const storedLinks = JSON.parse(localStorage.getItem('previousLinks') || '[]');
    setLinks(storedLinks);
  }, []);

  useEffect(() => {
    // Save links to localStorage whenever they change
    localStorage.setItem('previousLinks', JSON.stringify(links));
  }, [links]);

  return (
    <div className="space-y-4">
      {links.length > 0 ? (
        links.map((link) => (
          <div key={link.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
            <div>
              <h3 className="font-semibold">{link.name}</h3>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{`${window.location.origin}${link.url}`}</p>
            </div>
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleCopyLink(link.url)}>
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
                    <Button variant="ghost" size="sm" onClick={() => onShowQRCode(link.url)}>
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
                    <Button variant="destructive" onClick={() => handleDeleteLink(link.id)}>Yes, delete it</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">You have no previous share links.</p>
      )}
      <Button variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Create New Share Link
      </Button>
    </div>
  );
};

export default PreviousLinks;
