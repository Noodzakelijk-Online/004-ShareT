import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share, Copy, Eye, EyeOff, QrCode, CheckCircle2, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sharedLinks } from '../api';

const NewShareForm = ({ shareType, setShareType, cardCount, setCardCount, credits, freeSharesLeft, deductCredit, updateCredits, onCreateLink, trelloData, onShowQRCode }) => {
  const { toast: uiToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [generatedUrls, setGeneratedUrls] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [boardSearch, setBoardSearch] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const workspaces = useMemo(() => {
    if (!trelloData?.boards) return [];
    if (trelloData.organizations?.length) {
      const orgNames = trelloData.organizations.map(o => o.displayName || o.name);
      const hasPersonal = trelloData.boards.some(b => !b.organizationName || b.organizationName === 'Personal');
      return hasPersonal ? [...orgNames, 'Personal'] : orgNames;
    }
    const seen = new Set();
    trelloData.boards.forEach(b => seen.add(b.organizationName || 'Personal'));
    return [...seen];
  }, [trelloData]);

  const filteredBoards = useMemo(() => {
    if (!trelloData?.boards) return [];
    return trelloData.boards
      .filter(b => !selectedWorkspace || (b.organizationName || 'Personal') === selectedWorkspace)
      .filter(b => !boardSearch.trim() || b.name.toLowerCase().includes(boardSearch.toLowerCase()));
  }, [trelloData, selectedWorkspace, boardSearch]);
  const [cardUrl, setCardUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [guestTrelloToken, setGuestTrelloToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuestToken, setShowGuestToken] = useState(false);
  // Fix #9: Green checkmark indicator instead of obstructive popup
  const [showSuccess, setShowSuccess] = useState(false);

  // Fix #2: Create share link via API (persistent storage), not mock URLs
  const handleCreateShare = async () => {
    // Validate expiry date
    if (expiryDate && new Date(expiryDate) <= new Date()) {
      uiToast({
        title: "Invalid expiry date",
        description: "Please select a future date for expiry.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      if (shareType === "card") {
        // Determine card info from selection or URL
        let cardId, cardName, boardId, boardName;
        
        if (selectedCard) {
          cardId = selectedCard.id;
          cardName = selectedCard.name;
          boardId = selectedBoard?.id || '';
          boardName = selectedBoard?.displayLabel || selectedBoard?.name || '';
        } else if (cardUrl) {
          // Parse card ID from Trello URL
          const match = cardUrl.match(/\/c\/([a-zA-Z0-9]+)/);
          cardId = match ? match[1] : cardUrl;
          cardName = cardUrl;
        }

        if (!cardId) {
          uiToast({
            title: "No card selected",
            description: "Please select a card or enter a card URL.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }

        if (credits !== Infinity && credits <= 0) {
          uiToast({ title: 'No credits', description: 'Purchase more credits to create share links.', variant: 'destructive' });
          setIsCreating(false);
          return;
        }

        // Create share via backend API (Fix #2: persistent storage)
        const response = await sharedLinks.create({
          cardId,
          cardName: cardName || 'Shared Card',
          boardId: boardId || '',
          boardName: boardName || '',
          permissions: {
            canView: true,
            canComment: true,
            canUpload: true,
            canDownload: true,
            canSetDueDate: false
          },
          password: password || null,
          expiresAt: expiryDate || null,
          guestTrelloToken: guestTrelloToken || null
        });

        if (response.success && response.data) {
          const shareUrl = `${window.location.origin}/shared/${response.data.shareId}`;
          setGeneratedUrls({ cardUrl: shareUrl, shareId: response.data.shareId });
          if (deductCredit) await deductCredit();
        }
      } else if (shareType === "list" && selectedList) {
        const cardUrls = [];
        for (const card of (selectedList.cards || [])) {
          const response = await sharedLinks.create({
            cardId: card.id,
            cardName: card.name,
            boardId: selectedBoard?.id || '',
            boardName: selectedBoard?.displayLabel || selectedBoard?.name || '',
            permissions: {
              canView: true,
              canComment: true,
              canUpload: true,
              canDownload: true,
              canSetDueDate: false
            },
            expiresAt: expiryDate || null,
            guestTrelloToken: guestTrelloToken || null
          });
          if (response.success && response.data) {
            cardUrls.push({
              name: card.name,
              url: `${window.location.origin}/shared/${response.data.shareId}`
            });
          }
        }
        setGeneratedUrls({ cardUrls });
      }

      // Update credits
      onCreateLink();

      // Fix #9: Show green checkmark instead of toast popup
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating share:', error);
      uiToast({
        title: "Error creating share",
        description: error.message || "Failed to create share link.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shareType">Share Type</Label>
            <Select value={shareType} onValueChange={setShareType}>
              <SelectTrigger id="shareType" className="h-10">
                <SelectValue placeholder="Select what to share" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Single Card</SelectItem>
                <SelectItem value="list">List of Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="workspaceSelect">Workspace</Label>
            <Select
              onValueChange={(ws) => {
                setSelectedWorkspace(ws === '__all__' ? null : ws);
                setBoardSearch('');
                setSelectedBoard(null);
                setSelectedCard(null);
                setSelectedList(null);
              }}
            >
              <SelectTrigger id="workspaceSelect" className="h-10">
                <SelectValue placeholder={trelloData ? 'All workspaces' : 'Connect Trello first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All workspaces</SelectItem>
                {workspaces.map(ws => (
                  <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="boardSearch">Search Board</Label>
          <Input
            id="boardSearch"
            placeholder="Type to search boards..."
            value={boardSearch}
            onChange={e => setBoardSearch(e.target.value)}
            className="h-10"
            disabled={!trelloData}
          />
        </div>

        <div>
          <Label htmlFor="boardSelect">Board</Label>
          <Select
            onValueChange={(boardId) => {
              const board = filteredBoards.find(b => b.id === boardId) || null;
              setSelectedBoard(board);
              setSelectedCard(null);
              setSelectedList(null);
            }}
          >
            <SelectTrigger id="boardSelect" className="h-10">
              <SelectValue placeholder={trelloData ? (filteredBoards.length ? 'Select a board' : 'No matching boards') : 'Connect Trello first'} />
            </SelectTrigger>
            <SelectContent>
              {filteredBoards.length > 0 ? (
                filteredBoards.map(board => (
                  <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                ))
              ) : (
                <SelectItem disabled value="none">
                  {trelloData ? (boardSearch ? 'No boards match your search' : 'Loading boards...') : 'Connect Trello first'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {shareType === 'card' && (
          <div>
            <Label htmlFor="cardSelect">Card</Label>
            <Select
              disabled={!selectedBoard}
              onValueChange={(cardId) => {
                const allCards = (selectedBoard?.lists || []).flatMap(l => l.cards || []);
                setSelectedCard(allCards.find(c => c.id === cardId) || null);
              }}
            >
              <SelectTrigger id="cardSelect" className="h-10">
                <SelectValue placeholder={selectedBoard ? 'Select a card' : 'Select a board first'} />
              </SelectTrigger>
              <SelectContent>
                {(selectedBoard?.lists || []).flatMap(l => l.cards || []).length > 0 ? (
                  (selectedBoard.lists || []).flatMap(l => l.cards || []).map(card => (
                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    {selectedBoard ? 'No cards in this board' : 'Select a board first'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {shareType === 'list' && (
          <div>
            <Label htmlFor="listSelect">List</Label>
            <Select
              disabled={!selectedBoard}
              onValueChange={(listId) => {
                setSelectedList((selectedBoard?.lists || []).find(l => l.id === listId) || null);
              }}
            >
              <SelectTrigger id="listSelect" className="h-10">
                <SelectValue placeholder={selectedBoard ? 'Select a list' : 'Select a board first'} />
              </SelectTrigger>
              <SelectContent>
                {(selectedBoard?.lists || []).length > 0 ? (
                  (selectedBoard.lists || []).map(list => (
                    <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    {selectedBoard ? 'No lists in this board' : 'Select a board first'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {!trelloData && shareType === 'card' && (
          <div>
            <Label htmlFor="cardUrl">Or paste card URL</Label>
            <Input
              id="cardUrl"
              placeholder="https://trello.com/c/..."
              value={cardUrl}
              onChange={(e) => setCardUrl(e.target.value)}
              className="h-10"
            />
          </div>
        )}
      </div>
      <div className="flex space-x-4">
        <div className="w-1/2">
          <Label htmlFor="secret">Secret</Label>
          <div className="flex items-center space-x-2">
            <Input 
              id="secret" 
              type={showPassword ? "text" : "password"} 
              placeholder="Optional password" 
              className="h-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="w-1/2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input 
            id="expiryDate" 
            type="date" 
            className="h-10" 
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>
      
      {/* Advanced: Guest Trello Token */}
      <div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-2 p-3 border rounded-lg bg-muted/20 space-y-2">
            <div>
              <Label htmlFor="guestToken" className="text-xs flex items-center gap-1">
                Guest Trello Token
                <span className="text-muted-foreground font-normal">(optional)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Create a real Trello account for this client (e.g. named "John Doe"), add it to your board, then generate their API token. Comments will appear in Trello as if from their own account — no bold name prefix.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="guestToken"
                  type={showGuestToken ? 'text' : 'password'}
                  placeholder="Paste the client's Trello API token here"
                  className="h-9 text-sm font-mono"
                  value={guestTrelloToken}
                  onChange={e => setGuestTrelloToken(e.target.value)}
                />
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowGuestToken(!showGuestToken)}>
                  {showGuestToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Get the token: log in as the client at{' '}
                <a href="https://trello.com/app-key" target="_blank" rel="noopener noreferrer" className="underline">trello.com/app-key</a>,
                click <em>Token</em> and paste it here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fix #9: Create button with green checkmark confirmation */}
      <div className="flex items-center gap-3">
        <Button className="flex-1" onClick={handleCreateShare} disabled={isCreating}>
          {isCreating ? (
            <>Creating...</>
          ) : (
            <>
              <Share className="mr-2 h-4 w-4" /> Create Share Link
            </>
          )}
        </Button>
        {showSuccess && (
          <span className="flex items-center text-green-600 animate-in fade-in duration-300">
            <CheckCircle2 className="h-6 w-6" />
          </span>
        )}
      </div>

      {generatedUrls && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Generated Share Links:</h3>
          {generatedUrls.cardUrl && (
            <div className="flex items-center justify-between">
              <span className="truncate">{generatedUrls.cardUrl}</span>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedUrls.cardUrl)}>
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
                      <Button variant="outline" size="sm" onClick={() => onShowQRCode(generatedUrls.cardUrl)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show QR Code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
          {generatedUrls.cardUrls && generatedUrls.cardUrls.map((card, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="truncate">{card.name}: {card.url}</span>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(card.url)}>
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
                      <Button variant="outline" size="sm" onClick={() => onShowQRCode(card.url)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show QR Code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewShareForm;
