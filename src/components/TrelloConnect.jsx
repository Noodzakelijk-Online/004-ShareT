import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const TrelloConnect = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [trelloConnections, setTrelloConnections] = useState([]);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const fetchTrelloConnections = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/trello/connections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const connections = response.data?.connections || [];
      setTrelloConnections(connections);

      // ✅ AUTO-SELECT FIRST CONNECTION
      if (connections.length === 1) {
        onConnect(connections[0]);
      }
    } catch (err) {
      console.error("Error fetching Trello connections:", err);
    }
  }, [API_URL, token, onConnect]);

  useEffect(() => {
    fetchTrelloConnections();
  }, [fetchTrelloConnections]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/trello/auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.authUrl) {
        throw new Error("Failed to start Trello authentication");
      }

      const popup = window.open(
        response.data.authUrl,
        "TrelloAuth",
        "width=600,height=600"
      );

      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetchTrelloConnections();
          setIsConnecting(false);
        }
      }, 500);
    } catch (err) {
      toast.error("Failed to connect to Trello");
      setError(err.message);
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect to Trello"
        )}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {trelloConnections.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Connected Trello Accounts</h3>
          {trelloConnections.map((connection) => (
            <div
              key={connection.id}
              className="flex justify-between items-center border p-3 rounded-md"
            >
              <div>
                <p className="font-medium">
                  {connection.trelloFullName || connection.trelloUsername}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{connection.trelloUsername}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onConnect(connection)}
              >
                Select
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrelloConnect;
