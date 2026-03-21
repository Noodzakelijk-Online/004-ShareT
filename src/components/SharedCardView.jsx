import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, FileText, Paperclip, Calendar, MessageSquare, AlertTriangle, Users, CheckSquare, Link2, History, RefreshCw, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { sharedAccess } from '../api';

const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Fix #8: URL rendering — make URLs clickable and match Trello style
const renderUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url;
  }
};

// Fix #4 & #16: Markdown renderer component for Trello markup
const TrelloMarkdown = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline break-all">
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
        code: ({ inline, children }) => inline
          ? <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
          : <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto text-sm font-mono mb-2"><code>{children}</code></pre>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-muted-foreground">{children}</blockquote>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const SharedCardView = ({ linkToken }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [actions, setActions] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [members, setMembers] = useState([]);
  const [cardLinks, setCardLinks] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  // Fix #17: Persisted client name
  const [clientName, setClientName] = useState(() => localStorage.getItem('shareT_clientName') || '');
  
  const refreshTimerRef = useRef(null);
  
  const fetchCardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sharedAccess.getCard(linkToken);
      
      if (response.data?.card) {
        setCardData(response.data.card);
        setPermissions(response.data.permissions || {});
        
        // Fetch all supplementary data in parallel
        const promises = [];
        promises.push(fetchComments());
        promises.push(fetchAttachments());
        promises.push(fetchChecklists());
        promises.push(fetchMembers());
        promises.push(fetchCardLinks());
        promises.push(fetchActions());
        
        await Promise.allSettled(promises);
      } else {
        throw new Error('Card data not found');
      }
    } catch (error) {
      console.error('Error fetching card data:', error);
      setError(error.message || 'Failed to load card data');
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  }, [linkToken]);
  
  const fetchAttachments = async () => {
    try {
      const response = await sharedAccess.getAttachments(linkToken);
      if (response.data) {
        setAttachments(response.data);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  // Fix #12 & #13: Fetch all comments with ISO timestamps  
  const fetchComments = async () => {
    try {
      const response = await sharedAccess.getComments(linkToken);
      if (response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Fix #13: Fetch full action history
  const fetchActions = async () => {
    try {
      const response = await sharedAccess.getActions(linkToken);
      if (response.data) {
        setActions(response.data);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  // Fix #7: Fetch all checklists  
  const fetchChecklists = async () => {
    try {
      const response = await sharedAccess.getChecklists(linkToken);
      if (response.data) {
        setChecklists(response.data);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
    }
  };

  // Fix #10: Fetch card members
  const fetchMembers = async () => {
    try {
      const response = await sharedAccess.getMembers(linkToken);
      if (response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  // Fix #14: Fetch card-level links
  const fetchCardLinks = async () => {
    try {
      const response = await sharedAccess.getLinks(linkToken);
      if (response.data) {
        setCardLinks(response.data);
      }
    } catch (error) {
      console.error('Error fetching card links:', error);
    }
  };
  
  useEffect(() => {
    fetchCardData();
    
    // Fix #6: Auto-refresh every 30 minutes
    refreshTimerRef.current = setInterval(() => {
      fetchCardData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchCardData]);

  // Fix #17: Persist client name to localStorage
  const handleNameChange = (name) => {
    setClientName(name);
    localStorage.setItem('shareT_clientName', name);
  };

  // Fix #16: Comment with full markdown support
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await sharedAccess.addComment(linkToken, {
        text: comment,
        authorName: clientName || undefined
      });
      
      if (response.success) {
        toast.success("Comment added");
        setComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateDueDate = async () => {
    if (!newDueDate) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await sharedAccess.updateDueDate(linkToken, newDueDate);
      
      if (response.success) {
        toast.success("Due date updated");
        fetchCardData();
      }
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error(error.message || 'Failed to update due date');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fix #11: Real file upload to Trello via backend
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await sharedAccess.uploadAttachment(linkToken, file);
      
      if (response.success) {
        toast.success("Attachment uploaded");
        fetchAttachments();
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error(error.message || 'Failed to upload attachment');
    } finally {
      setIsSubmitting(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Fix #12: Format exact date/time
  const formatExactDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  // Describe action type for history
  const describeAction = (action) => {
    const type = action.type;
    const creator = action.memberCreator?.fullName || 'Someone';
    switch (type) {
      case 'commentCard': return `${creator} commented`;
      case 'addAttachmentToCard': return `${creator} added an attachment`;
      case 'deleteAttachmentFromCard': return `${creator} removed an attachment`;
      case 'addChecklistToCard': return `${creator} added a checklist`;
      case 'removeChecklistFromCard': return `${creator} removed a checklist`;
      case 'updateCheckItemStateOnCard': return `${creator} updated a checklist item`;
      case 'addMemberToCard': return `${creator} added a member`;
      case 'removeMemberFromCard': return `${creator} removed a member`;
      case 'updateCard': return `${creator} updated the card`;
      case 'moveCardToBoard': return `${creator} moved the card`;
      case 'createCard': return `${creator} created the card`;
      default: return `${creator} performed "${type}"`;
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
          <Button variant="outline" onClick={() => fetchCardData()} className="w-full">
            Try Again
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
            <CardDescription className="mt-1 flex items-center gap-4">
              <span>
                {permissions.canComment ? 'You can view and comment on this card' : 'You have view-only access'}
              </span>
              {/* Fix #6: Last refreshed indicator */}
              <span className="text-xs flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Refreshed {formatExactDate(lastRefreshed)}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchCardData()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Fix #17: Client name input (persisted) */}
        {permissions.canComment && (
          <div className="mt-3">
            <input
              type="text"
              value={clientName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Your name (shown on comments)"
              className="w-full max-w-xs p-2 text-sm border rounded-md bg-background"
            />
          </div>
        )}

        {/* Fix #10: Show assigned members */}
        {members.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Members:</span>
            <div className="flex -space-x-2">
              {members.map(member => (
                <Avatar key={member.id || member.username} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={member.avatarUrl ? `${member.avatarUrl}/30.png` : undefined} alt={member.fullName} />
                  <AvatarFallback className="text-xs">{(member.fullName || '?').charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {members.map(m => m.fullName).join(', ')}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${5 + (permissions.canComment ? 1 : 0)}, 1fr)` }}>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="checklists">
              <CheckSquare className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            {permissions.canComment && (
              <TabsTrigger value="actions">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* ===== DETAILS TAB ===== */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Fix #4: Render description with full Trello markdown */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Description</h3>
              <div className="p-4 bg-muted rounded-md">
                {cardData.desc ? (
                  <TrelloMarkdown content={cardData.desc} />
                ) : (
                  <span className="text-muted-foreground">No description provided</span>
                )}
              </div>
            </div>
            
            {cardData.due && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Due Date</h3>
                <div className="p-4 bg-muted rounded-md">
                  {formatExactDate(cardData.due)}
                  {cardData.dueComplete && <span className="ml-2 text-green-600 font-medium">✓ Complete</span>}
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
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: label.color ? `var(--trello-${label.color}, #ddd)` : '#ddd',
                        color: label.color ? '#fff' : '#333'
                      }}
                    >
                      {label.name || label.color}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fix #14: Card-level links */}
            {cardLinks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Link2 className="h-5 w-5" /> Links
                </h3>
                <div className="space-y-2">
                  {cardLinks.map(link => (
                    <div key={link.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline truncate">
                        {link.name || renderUrl(link.url)}
                      </a>
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                        {formatExactDate(link.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== CHECKLISTS TAB — Fix #7 ===== */}
          <TabsContent value="checklists" className="space-y-4 mt-4">
            {checklists.length > 0 ? (
              checklists.map(checklist => {
                const total = checklist.checkItems?.length || 0;
                const checked = checklist.checkItems?.filter(i => i.state === 'complete').length || 0;
                const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
                
                return (
                  <div key={checklist.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        {checklist.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">{checked}/{total}</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="space-y-1">
                      {checklist.checkItems?.sort((a, b) => a.pos - b.pos).map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-1.5">
                          <input 
                            type="checkbox" 
                            checked={item.state === 'complete'} 
                            readOnly 
                            className="h-4 w-4 rounded cursor-default"
                          />
                          <span className={item.state === 'complete' ? 'line-through text-muted-foreground' : ''}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No checklists on this card
              </div>
            )}
          </TabsContent>
          
          {/* ===== ATTACHMENTS TAB — Fix #11, #15 ===== */}
          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Attachments</h3>
              {permissions.canUpload && (
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
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload File
                  </Button>
                </div>
              )}
            </div>
            
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {/* Fix #15: Already sorted chronologically by backend */}
                {attachments.filter(a => a.isUpload !== false).map(attachment => (
                  <div key={attachment.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {attachment.bytes ? `${Math.round(attachment.bytes / 1024)} KB` : ''}
                          {attachment.date && ` • ${formatExactDate(attachment.date)}`}
                        </p>
                      </div>
                      {/* Fix #11: Make attachments fully clickable */}
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={sharedAccess.downloadAttachment(linkToken, attachment.id)}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
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

          {/* ===== COMMENTS TAB — Fix #4, #12, #16 ===== */}
          <TabsContent value="comments" className="space-y-4 mt-4">
            {/* Comment input at top for easy access */}
            {permissions.canComment && (
              <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment (Markdown supported)..."
                  className="w-full p-3 border rounded-md min-h-[80px] bg-background resize-y"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Supports **bold**, *italic*, `code`, [links](url), lists
                  </span>
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!comment.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Comment
                  </Button>
                </div>
              </div>
            )}
            
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.memberCreator?.avatarUrl ? `${c.memberCreator.avatarUrl}/30.png` : undefined} />
                        <AvatarFallback className="text-xs">{(c.memberCreator?.fullName || '?').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{c.memberCreator?.fullName || 'Unknown'}</span>
                      {/* Fix #12: Exact date/time */}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatExactDate(c.date)}
                      </span>
                    </div>
                    {/* Fix #4 & #16: Render comment with full markdown */}
                    <div className="text-sm">
                      <TrelloMarkdown content={c.data?.text || ''} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet
              </div>
            )}
          </TabsContent>

          {/* ===== ACTIVITY TAB — Fix #13 ===== */}
          <TabsContent value="activity" className="space-y-2 mt-4">
            {actions.length > 0 ? (
              <div className="space-y-1">
                {actions.map(action => (
                  <div key={action.id} className="flex items-start gap-2 p-2 text-sm border-b last:border-0">
                    <Avatar className="h-5 w-5 mt-0.5 flex-shrink-0">
                      <AvatarImage src={action.memberCreator?.avatarUrl ? `${action.memberCreator.avatarUrl}/30.png` : undefined} />
                      <AvatarFallback className="text-[10px]">{(action.memberCreator?.fullName || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span>{describeAction(action)}</span>
                      {action.data?.text && (
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {action.data.text.substring(0, 100)}{action.data.text.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatExactDate(action.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity history
              </div>
            )}
          </TabsContent>

          {/* ===== ACTIONS TAB (due date) ===== */}
          {permissions.canComment && (
            <TabsContent value="actions" className="space-y-6 mt-4">
              {permissions.canSetDueDate && (
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
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SharedCardView;
