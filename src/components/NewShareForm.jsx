import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

const NewShareForm = ({ shareType, setShareType, cardCount, credits, freeSharesLeft, onCreateLink, trelloData }) => {
  const { toast: uiToast } = useToast();
  const [selectedList, setSelectedList] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

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
      const newLinks = selectedList.cards.map(card => ({
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
            <Label htmlFor="name">Name*</Label>
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
      <Button className="w-full mt-4" onClick={handleCreateShare}>
        <Share className="mr-2 h-4 w-4" /> Create Share Link
      </Button>
    </div>
  );
};

export default NewShareForm;
