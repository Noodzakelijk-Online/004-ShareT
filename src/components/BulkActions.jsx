
import { useState } from 'react';
import { CheckSquare, Trash, Clock, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const BulkActions = ({ selectedItems, onDelete, onExtend, onClearSelection }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  
  const handleDelete = () => {
    onDelete(selectedItems);
    setDeleteDialogOpen(false);
    toast.success(`${selectedItems.length} shares deleted successfully`);
  };
  
  const handleExtend = () => {
    onExtend(selectedItems);
    setExtendDialogOpen(false);
    toast.success(`${selectedItems.length} shares extended successfully`);
  };
  
  const handleCopyLinks = () => {
    // In a real app, this would gather the actual links
    const links = selectedItems.map(item => `https://sharet.app/share/${item.id}`).join('\n');
    navigator.clipboard.writeText(links);
    toast.success(`${selectedItems.length} links copied to clipboard`);
  };
  
  if (!selectedItems || selectedItems.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-col space-y-4 mb-4">
      <Alert>
        <CheckSquare className="h-4 w-4" />
        <AlertTitle>Bulk Selection</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>{selectedItems.length} items selected</span>
          <Button variant="outline" size="sm" onClick={onClearSelection}>Clear Selection</Button>
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleCopyLinks}>
              <Link className="mr-2 h-4 w-4" />
              Copy Links
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy all selected share links</TooltipContent>
        </Tooltip>
      
        <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Extend Expiry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Expiry Date</DialogTitle>
              <DialogDescription>
                You are about to extend the expiry date for {selectedItems.length} shares. This action will add 30 days to their current expiry date.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleExtend}>Extend</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                You are about to delete {selectedItems.length} shares. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
