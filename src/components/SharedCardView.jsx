import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Paperclip, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';

const SharedCardView = ({ linkToken }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [permissionLevel, setPermissionLevel] = useState('view');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    // Check if user has access token
    const accessToken = localStorage.getItem('shareT_access_token');
    if (!accessToken) {
      window.location.href = `/shared/${linkToken}`;
      return;
    }
    
    fetchCardData();
  }, [linkToken]);
  
  const fetchCardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/shared-access/${linkToken}/card`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('shareT_access_token')}`
        }
      });
      
      if (response.data.card) {
        setCardData(response.data.card);
        
        // Get permission level from session
        const accessData = response.data.accessData;
        if (accessData && accessData.permissionLevel) {
          setPermissionLevel(accessData.permissionLevel);
        }
        
        // Fetch attachments
        fetchAttachments();
      } else {
        throw new Error('Card data not found');
      }
    } catch (error) {
      console.error('Error fetching card data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load card data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAttachments = async () => {
    try {
      const response = await axios.get(`${API_URL}/shared-access/${linkToken}/card/attachments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('shareT_access_token')}`
        }
      });
      
      if (response.data.attachments) {
        setAttachments(response.data.attachments);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error("Failed to load attachments");
    }
  };
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/shared-access/${linkToken}/card/comments`,
        { text: comment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('shareT_access_token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Comment added successfully");
        setComment('');
        // Refresh card data to show the new comment
        fetchCardData();
      } else {
        throw new Error(response.data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateDueDate = async () => {
    if (!newDueDate) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.put(
        `${API_URL}/shared-access/${linkToken}/card/due-date`,
        { dueDate: newDueDate },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('shareT_access_token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Due date updated successfully");
        // Refresh card data to show the new due date
        fetchCardData();
      } else {
        throw new Error(response.data.error || 'Failed to update due date');
      }
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to update due date');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, we would upload the file to a storage service
      // and then send the URL to the API
      // For this demo, we'll just use a mock URL
      
      const mockUrl = `https://example.com/attachments/${file.name}`;
      
      const response = await axios.post(
        `${API_URL}/shared-access/${linkToken}/card/attachments`,
        { 
          name: file.name,
          url: mockUrl
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('shareT_access_token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Attachment added successfully");
        // Refresh attachments
        fetchAttachments();
      } else {
        throw new Error(response.data.error || 'Failed to add attachment');
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to add attachment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Access Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.href = `/shared/${linkToken}`} className="w-full">
            Back to Access Page
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!cardData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Card Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>The Trello card you're trying to access doesn't exist or has been deleted.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{cardData.name}</CardTitle>
            <CardDescription>
              {permissionLevel === 'edit' ? 'You have edit access to this card' : 'You have view-only access to this card'}
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <a href={cardData.url} target="_blank" rel="noopener noreferrer">
              Open in Trello
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
            {permissionLevel === 'edit' && (
              <TabsTrigger value="actions">
                <Calendar className="h-4 w-4 mr-2" />
                Actions
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Description</h3>
              <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                {cardData.desc || 'No description provided'}
              </div>
            </div>
            
            {cardData.dueDate && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Due Date</h3>
                <div className="p-4 bg-muted rounded-md">
                  {new Date(cardData.dueDate).toLocaleString()}
                </div>
              </div>
            )}
            
            {cardData.labels && cardData.labels.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {cardData.labels.map(label => (
                    <div 
                      key={label.id}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: label.color ? `#${label.color}` : '#ddd',
                        color: label.color ? '#fff' : '#333'
                      }}
                    >
                      {label.name || label.color}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Attachments</h3>
              {permissionLevel === 'edit' && (
                <div>
                  <input 
                    type="file" 
                    id="attachment-upload" 
                    className="hidden"
                    onChange={handleUploadAttachment}
                    disabled={isSubmitting}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('attachment-upload').click()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Paperclip className="h-4 w-4 mr-2" />
                    )}
                    Add Attachment
                  </Button>
                </div>
              )}
            </div>
            
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {attachment.bytes ? `${Math.round(attachment.bytes / 1024)} KB` : ''}
                          {attachment.date && ` • ${new Date(attachment.date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attachments found
              </div>
            )}
          </TabsContent>
          
          {permissionLevel === 'edit' && (
            <TabsContent value="actions" className="space-y-6 mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Add Comment
                </h3>
                <div className="space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border rounded-md min-h-[100px]"
                    disabled={isSubmitting}
                  />
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!comment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Update Due Date
                </h3>
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-3 border rounded-md"
                    disabled={isSubmitting}
                  />
                  <Button 
                    onClick={handleUpdateDueDate} 
                    disabled={!newDueDate || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    Update Due Date
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SharedCardView;
