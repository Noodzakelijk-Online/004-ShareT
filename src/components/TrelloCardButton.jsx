import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import TrelloCardShare from './TrelloCardShare';
import { useAuth } from '@/contexts/AuthContext';

const TrelloCardButton = ({ connection }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState("boards");
  const { user } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    if (connection) {
      fetchBoards();
    }
  }, [connection]);
  
  useEffect(() => {
    if (selectedBoard) {
      fetchCards(selectedBoard.id);
    }
  }, [selectedBoard]);
  
  const fetchBoards = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/trello/boards?connectionId=${connection.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.boards) {
        setBoards(response.data.boards);
      }
    } catch (error) {
      console.error('Error fetching Trello boards:', error);
      toast.error("Failed to load Trello boards");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCards = async (boardId) => {
    setIsLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/trello/boards/${boardId}/cards?connectionId=${connection.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.cards) {
        setCards(response.data.cards);
        setActiveTab("cards");
      }
    } catch (error) {
      console.error('Error fetching Trello cards:', error);
      toast.error("Failed to load Trello cards");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBoardSelect = (board) => {
    setSelectedBoard(board);
  };
  
  const handleCardSelect = (card) => {
    setSelectedCard(card);
    setActiveTab("share");
  };
  
  const handleBackToBoards = () => {
    setActiveTab("boards");
    setSelectedBoard(null);
    setCards([]);
  };
  
  const handleBackToCards = () => {
    setActiveTab("cards");
    setSelectedCard(null);
  };
  
  const handleShareSuccess = (data) => {
    // Handle successful link generation
    console.log('Share success:', data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trello Card Button</CardTitle>
        <CardDescription>
          Select a card to generate a shareable link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="boards" disabled={activeTab === "share"}>Boards</TabsTrigger>
            <TabsTrigger value="cards" disabled={!selectedBoard || activeTab === "share"}>Cards</TabsTrigger>
            <TabsTrigger value="share" disabled={!selectedCard}>Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="boards" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {boards.length > 0 ? (
                  boards.map(board => (
                    <div 
                      key={board.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                        selectedBoard?.id === board.id ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onClick={() => handleBoardSelect(board)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{board.name}</h3>
                          {board.desc && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{board.desc}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={board.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No boards found
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cards" className="space-y-4 mt-4">
            {selectedBoard && (
              <div className="mb-4">
                <Button variant="outline" size="sm" onClick={handleBackToBoards}>
                  ← Back to Boards
                </Button>
                <h3 className="text-lg font-medium mt-2">{selectedBoard.name}</h3>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {cards.length > 0 ? (
                  cards.map(card => (
                    <div 
                      key={card.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                        selectedCard?.id === card.id ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onClick={() => handleCardSelect(card)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{card.name}</h3>
                          {card.desc && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{card.desc}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={card.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No cards found in this board
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="share" className="mt-4">
            {selectedCard && (
              <div className="mb-4">
                <Button variant="outline" size="sm" onClick={handleBackToCards}>
                  ← Back to Cards
                </Button>
                <h3 className="text-lg font-medium mt-2">{selectedCard.name}</h3>
              </div>
            )}
            
            {selectedCard && selectedBoard && (
              <TrelloCardShare 
                connectionId={connection.id}
                cardId={selectedCard.id}
                boardId={selectedBoard.id}
                cardName={selectedCard.name}
                boardName={selectedBoard.name}
                onSuccess={handleShareSuccess}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrelloCardButton;
