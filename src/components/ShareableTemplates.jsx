
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Clipboard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - in a real app, this would come from a database
const mockTemplates = [
  { id: 1, name: 'Client view only', type: 'board', settings: { readOnly: true, commentAccess: false, expiryDays: 30 } },
  { id: 2, name: 'Team collaboration', type: 'board', settings: { readOnly: false, commentAccess: true, expiryDays: 90 } },
  { id: 3, name: 'Quick look', type: 'card', settings: { readOnly: true, commentAccess: false, expiryDays: 7 } },
];

export const ShareableTemplates = ({ onApplyTemplate }) => {
  const [templates, setTemplates] = useState(mockTemplates);
  const [newTemplate, setNewTemplate] = useState({ 
    name: '', 
    type: 'board', 
    settings: { readOnly: true, commentAccess: false, expiryDays: 30 } 
  });
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  
  const handleSaveTemplate = () => {
    if (!newTemplate.name) {
      toast.error('Please provide a template name');
      return;
    }
    
    const updatedTemplates = [...templates, { ...newTemplate, id: Date.now() }];
    setTemplates(updatedTemplates);
    setNewTemplate({ name: '', type: 'board', settings: { readOnly: true, commentAccess: false, expiryDays: 30 } });
    setShowNewTemplateDialog(false);
    toast.success('Template saved successfully');
  };
  
  const handleApplyTemplate = (template) => {
    onApplyTemplate(template);
    toast.success(`Template "${template.name}" applied`);
  };
  
  const handleCopyTemplate = (template) => {
    const newTemplateCopy = { ...template, name: `${template.name} (Copy)`, id: Date.now() };
    setTemplates([...templates, newTemplateCopy]);
    toast.success('Template duplicated');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Sharing Templates</h2>
        <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for sharing your Trello content.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input 
                  id="template-name" 
                  value={newTemplate.name} 
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="e.g., Client Review Access"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-type">Content Type</Label>
                <Select 
                  value={newTemplate.type} 
                  onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}
                >
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Access Settings</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="read-only" 
                    checked={newTemplate.settings.readOnly}
                    onCheckedChange={(checked) => 
                      setNewTemplate({
                        ...newTemplate, 
                        settings: {...newTemplate.settings, readOnly: checked}
                      })
                    }
                  />
                  <label htmlFor="read-only" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Read-only access
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="comment-access" 
                    checked={newTemplate.settings.commentAccess}
                    onCheckedChange={(checked) => 
                      setNewTemplate({
                        ...newTemplate, 
                        settings: {...newTemplate.settings, commentAccess: checked}
                      })
                    }
                  />
                  <label htmlFor="comment-access" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Allow comments
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiry-days">Expiry (days)</Label>
                  <Select 
                    value={newTemplate.settings.expiryDays.toString()} 
                    onValueChange={(value) => 
                      setNewTemplate({
                        ...newTemplate, 
                        settings: {...newTemplate.settings, expiryDays: parseInt(value)}
                      })
                    }
                  >
                    <SelectTrigger id="expiry-days">
                      <SelectValue placeholder="Select expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  Type: {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Read-only: {template.settings.readOnly ? 'Yes' : 'No'}</div>
                  <div>Comments: {template.settings.commentAccess ? 'Enabled' : 'Disabled'}</div>
                  <div>Expiry: {template.settings.expiryDays} days</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleCopyTemplate(template)}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                  Apply
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
