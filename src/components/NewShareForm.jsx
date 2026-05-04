import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share, Copy, Eye, EyeOff, QrCode, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sharedLinks } from '../api';

const NewShareForm = ({ shareType, setShareType, cardCount, setCardCount, credits, freeSharesLeft, updateCredits, onCreateLink, trelloData, onShowQRCode }) => {
  const { toast: uiToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [generatedUrls, setGeneratedUrls] = useState(null);
  const [isSelectFromList, setIsSelectFromList] = useState(!!trelloData);

  useEffect(() => {
    if (trelloData) setIsSelectFromList(true);
  }, [trelloData]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardUrl, setCardUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  // Fix #9: Green checkmark indicator instead of obstructive popup
  const [showSuccess, setShowSuccess] = useState(false);

  const calculateCost = () => {
    if (freeSharesLeft > 0) return 0;
    return shareType === "card" ? 1 : Math.max(1, cardCount - 1);
  };

  // Fix #2: Create share link via API (persistent storage), not mock URLs
  const handleCreateShare = async () => {
    const cost = calculateCost();
    if (cost > credits) {
      uiToast({
        title: "Insufficient credits",
        description: "Please purchase more credits to create this share.",
        variant: "destructive",
      });
      return;
    }

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
        
        if (isSelectFromList && selectedCard) {
          cardId = selectedCard.id;
          cardName = selectedCard.name;
          // Find the board this card belongs to
          if (trelloData?.boards) {
            for (const board of trelloData.boards) {
              const found = board.lists?.some(l => l.cards?.some(c => c.id === cardId));
              if (found) {
                boardId = board.id;
                boardName = board.displayLabel || board.name;
                break;
              }
            }
          }
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
          expiresAt: expiryDate || null
        });

        if (response.success && response.data) {
          const shareUrl = `${window.location.origin}/shared/${response.data.shareId}`;
          setGeneratedUrls({ cardUrl: shareUrl, shareId: response.data.shareId });
        }
      } else if (shareType === "list" && selectedList) {
        // For list shares, create individual card shares
        const cardUrls = [];
        for (const card of (selectedList.cards || [])) {
          const board = trelloData?.boards?.find(b => b.lists?.some(l => l.id === selectedList.id));
          const response = await sharedLinks.create({
            cardId: card.id,
            cardName: card.name,
            boardId: board?.id || '',
            boardName: board?.displayLabel || board?.name || '',
            permissions: {
              canView: true,
              canComment: true,
              canUpload: true,
              canDownload: true,
              canSetDueDate: false
            },
            expiresAt: expiryDate || null
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="name">Name*</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="nameToggle" className="text-sm">Select from list</Label>
                <Switch id="nameToggle" checked={isSelectFromList} onCheckedChange={setIsSelectFromList} />
              </div>
            </div>
            {isSelectFromList ? (
              <Select onValueChange={(cardId) => setSelectedCard(trelloData?.boards ? trelloData.boards.flatMap(b => b.lists || []).flatMap(l => l.cards || []).find(c => c.id === cardId) : null)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a card" />
                </SelectTrigger>
                <SelectContent>
                  {trelloData?.boards?.length > 0 ? (
                    trelloData.boards.map((board) => (
                      <SelectGroup key={board.id}>
                        <SelectLabel>{board.displayLabel || board.name}</SelectLabel>
                        {(board.lists || []).flatMap(list => list.cards || []).map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  ) : trelloData ? (
                    <SelectItem disabled value="loading">Loading boards...</SelectItem>
                  ) : (
                    <SelectItem disabled value="connect">Connect to Trello to see cards</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                id="name" 
                placeholder="Enter card URL" 
                value={cardUrl}
                onChange={(e) => setCardUrl(e.target.value)}
                className="h-10"
              />
            )}
          </div>
        </div>
      </div>
      {shareType === "list" && (
        <div className="mt-4">
          <Label htmlFor="listSelect">Select List</Label>
          <Select onValueChange={(listId) => setSelectedList(trelloData?.boards ? trelloData.boards.flatMap(b => b.lists || []).find(l => l.id === listId) : null)}>
            <SelectTrigger id="listSelect" className="h-10">
              <SelectValue placeholder="Select a list" />
            </SelectTrigger>
            <SelectContent>
              {trelloData?.boards?.length > 0 ? (
                trelloData.boards.map((board) => (
                  <SelectGroup key={board.id}>
                    <SelectLabel>{board.displayLabel || board.name}</SelectLabel>
                    {(board.lists || []).map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              ) : trelloData ? (
                <SelectItem disabled value="loading">Loading boards...</SelectItem>
              ) : (
                <SelectItem disabled value="connect">Connect to Trello to see lists</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
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
