import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

const NewShareForm = ({ shareType, setShareType, cardCount, credits, freeSharesLeft, onCreateLink, trelloData }) => {
  const { toast: uiToast } = useToast();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardDetails, setBoardDetails] = useState({ lists: [], cards: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (selectedBoard) {
      setIsLoadingDetails(true);
      setBoardDetails({ lists: [], cards: [] });
      setSelectedCard(null);
      setSelectedList(null);

      window.Trello.get(
        `/boards/${selectedBoard}/lists`,
        { cards: 'open' },
        (lists) => {
          const allCards = lists.flatMap(list => list.cards);
          setBoardDetails({ lists, cards: allCards });
          setIsLoadingDetails(false);
        },
        () => {
          toast.error("Failed to fetch board details.");
          setIsLoadingDetails(false);
        }
      );
    }
  }, [selectedBoard]);

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

    if (shareType === 'card' && !selectedCard) {
      uiToast({
        title: "No card selected",
        description: "Please select a card from the list.",
        variant: "destructive",
      });
      return;
    }
    if (shareType === 'list' && !selectedList) {
      uiToast({
        title: "No list selected",
        description: "Please select a list.",
        variant: "destructive",
      });
      return;
    }

    if (shareType === "card") {
      const newLink = {
        id: selectedCard.id,
        name: selectedCard.name,
        url: `/cards/${selectedCard.id}/comment`,
        type: 'card'
      };
      const storedLinks = JSON.parse(localStorage.getItem('previousLinks') || '[]');
      localStorage.setItem('previousLinks', JSON.stringify([...storedLinks, newLink]));
    } else if (shareType === "list" && selectedList) {
      const listCards = boardDetails.lists.find(l => l.id === selectedList.id)?.cards || [];
      const newLinks = listCards.map(card => ({
        id: card.id,
        name: card.name,
        url: `/cards/${card.id}/comment`,
        type: 'card'
      }));
      const storedLinks = JSON.parse(localStorage.getItem('previousLinks') || '[]');
      localStorage.setItem('previousLinks', JSON.stringify([...storedLinks, ...newLinks]));
    }

    // Update credits
    onCreateLink();

    if (shareType === "card") {
      toast.success(`Link created for ${selectedCard.name}`, {
        action: {
          label: "Copy Link",
          onClick: () => navigator.clipboard.writeText(`${window.location.origin}/cards/${selectedCard.id}/comment`),
        },
      });
    } else if (shareType === "list") {
      toast.success(`Links created for list: ${selectedList.name}`, {
        description: "You can find them in the 'Previous Links' tab.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="shareType">1. Select Share Type</Label>
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
          <Label htmlFor="boardSelect">2. Select Board</Label>
          <Select onValueChange={setSelectedBoard} disabled={!trelloData}>
            <SelectTrigger id="boardSelect" className="h-10">
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent>
              {trelloData && trelloData.boards ? (
                trelloData.boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="connect" disabled>Connect to Trello to see boards</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {shareType === 'card' && (
          <div>
            <Label htmlFor="cardSelect">3. Select Card</Label>
            <Select onValueChange={(cardId) => setSelectedCard(boardDetails.cards.find(c => c.id === cardId))} disabled={!selectedBoard || isLoadingDetails}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={isLoadingDetails ? "Loading cards..." : "Select a card"} />
              </SelectTrigger>
              <SelectContent>
                {boardDetails.lists.map((list) => (
                  <SelectGroup key={list.id}>
                    <SelectLabel>{list.name}</SelectLabel>
                    {list.cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {shareType === 'list' && (
          <div>
            <Label htmlFor="listSelect">3. Select List</Label>
            <Select onValueChange={(listId) => setSelectedList(boardDetails.lists.find(l => l.id === listId))} disabled={!selectedBoard || isLoadingDetails}>
              <SelectTrigger id="listSelect" className="h-10">
                <SelectValue placeholder={isLoadingDetails ? "Loading lists..." : "Select a list"} />
              </SelectTrigger>
              <SelectContent>
                {boardDetails.lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Button className="w-full" onClick={handleCreateShare}>
        <Share className="mr-2 h-4 w-4" /> Create Share Link
      </Button>
    </div>
  );
};

export default NewShareForm;
