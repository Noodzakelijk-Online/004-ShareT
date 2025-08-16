
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TrelloConnect = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = () => {
    setIsConnecting(true);
    setError(null);

    const onFetchSuccess = (boards) => {
      // Also fetch member data
      window.Trello.get('/members/me', (member) => {
        const trelloData = {
          member: member,
          boards: boards,
        };
        onConnect(trelloData);
        toast.success("Connected to Trello and fetched data successfully!");
        setIsConnecting(false);
      }, onFetchFailure);
    };

    const onFetchFailure = (error) => {
      console.error('Error fetching Trello data:', error);
      setError("Failed to fetch data from Trello.");
      toast.error("Failed to fetch data from Trello. Please try again.");
      setIsConnecting(false);
    };

    window.Trello.get(
      '/members/me/boards',
      { fields: 'name', lists: 'open', cards: 'open' },
      onFetchSuccess,
      onFetchFailure
    );
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
