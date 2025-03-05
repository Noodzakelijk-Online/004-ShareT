import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share, Copy, Eye, EyeOff, QrCode } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const NewShareForm = ({ shareType, setShareType, cardCount, setCardCount, credits, freeSharesLeft, updateCredits, onCreateLink, trelloData, onShowQRCode }) => {
  const { toast: uiToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [generatedUrls, setGeneratedUrls] = useState(null);
  const [isSelectFromList, setIsSelectFromList] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardUrl, setCardUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');

  const calculateCost = () => {
    if (freeSharesLeft > 0) return 0;
    return shareType === "card" ? 1 : Math.max(1, cardCount - 1);
  };

  const handleCreateShare = () => {
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

    // Simulate generating URLs
    if (shareType === "card") {
      const cardUrl = `https://example.com/share/card/${Date.now()}`;
      setGeneratedUrls({ cardUrl });
    } else if (shareType === "list" && selectedList) {
      const listUrl = `https://example.com/share/list/${selectedList.id}`;
      const cardUrls = selectedList.cards.map(card => ({
        name: card.name,
        url: `https://example.com/share/card/${card.id}`
      }));
      setGeneratedUrls({ listUrl, cardUrls });
    }

    // Update credits
    onCreateLink();

    toast("Share link(s) created successfully");
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
                <Switch id="nameToggle" onCheckedChange={setIsSelectFromList} />
              </div>
            </div>
            {isSelectFromList ? (
              <Select onValueChange={(cardId) => setSelectedCard(trelloData ? trelloData.boards.flatMap(b => b.lists).flatMap(l => l.cards).find(c => c.id === cardId) : null)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a card" />
                </SelectTrigger>
                <SelectContent>
                  {trelloData ? (
                    trelloData.boards.map((board) => (
                      <SelectGroup key={board.id}>
                        <SelectLabel>{board.name}</SelectLabel>
                        {board.lists.map((list) => (
                          <SelectGroup key={list.id}>
                            <SelectLabel className="pl-4">{list.name}</SelectLabel>
                            {list.cards.map((card) => (
                              <SelectItem key={card.id} value={card.id} className="pl-8">
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectGroup>
                    ))
                  ) : (
                    <SelectItem value="connect">Connect to Trello to see cards</SelectItem>
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
          <Select onValueChange={(listId) => setSelectedList(trelloData ? trelloData.boards.flatMap(b => b.lists).find(l => l.id === listId) : null)}>
            <SelectTrigger id="listSelect" className="h-10">
              <SelectValue placeholder="Select a list" />
            </SelectTrigger>
            <SelectContent>
              {trelloData ? (
                trelloData.boards.map((board) => (
                  <SelectGroup key={board.id}>
                    <SelectLabel>{board.name}</SelectLabel>
                    {board.lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              ) : (
                <SelectItem value="connect">Connect to Trello to see lists</SelectItem>
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
      <Button className="w-full" onClick={handleCreateShare}>
        <Share className="mr-2 h-4 w-4" /> Create Share Link
      </Button>
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
          {generatedUrls.listUrl && (
            <div className="flex items-center justify-between">
              <span className="truncate">List URL: {generatedUrls.listUrl}</span>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedUrls.listUrl)}>
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
                      <Button variant="outline" size="sm" onClick={() => onShowQRCode(generatedUrls.listUrl)}>
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
