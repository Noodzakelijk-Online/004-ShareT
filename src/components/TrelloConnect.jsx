
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TrelloConnect = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const { toast: uiToast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // For now, we're using mock data instead of an actual Trello API connection
      setTimeout(() => {
        const mockTrelloData = {
          member: {
            id: "mock123",
            fullName: "Demo User",
            username: "demouser",
            avatarUrl: "https://example.com/avatar.png"
          },
          boards: [
            {
              id: "board1",
              name: "Project Board",
              lists: [
                {
                  id: "list1",
                  name: "To Do",
                  cards: [
                    { id: "card1", name: "Task 1" },
                    { id: "card2", name: "Task 2" }
                  ]
                },
                {
                  id: "list2",
                  name: "In Progress",
                  cards: [
                    { id: "card3", name: "Task 3" },
                    { id: "card4", name: "Task 4" }
                  ]
                }
              ]
            }
          ]
        };

        onConnect(mockTrelloData);
        toast.success("Connected to Trello successfully!");
        setIsConnecting(false);
      }, 1500); // Simulate network delay
    } catch (error) {
      console.error('Error connecting to Trello:', error);
      setError(error.message || "Failed to connect");
      toast.error("Connection to Trello failed. Please try again.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button 
        onClick={handleConnect} 
        disabled={isConnecting}
        className="w-full md:w-auto"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect to Trello"
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default TrelloConnect;
