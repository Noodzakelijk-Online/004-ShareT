
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrelloConnect from '../components/TrelloConnect';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCredits } from '../hooks/useCredits';
import QRCode from 'qrcode.react';
import NewShareForm from '../components/NewShareForm';
import PreviousLinks from '../components/PreviousLinks';
import UserProfile from '../components/UserProfile';
// import { useAuth } from '../contexts/AuthContext';
import ApiDocumentation from '../components/ApiDocumentation';

const App = () => {
  const navigate = useNavigate();
  // const { currentUser } = useAuth();
  const { credits, freeSharesLeft, updateCredits } = useCredits();
  const [shareType, setShareType] = useState("card");
  const [cardCount, setCardCount] = useState(1);
  const [trelloData, setTrelloData] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState('');
  const [showApiDocs, setShowApiDocs] = useState(false);
  const { toast } = useToast();

  const handleCreateLink = () => {};

  const handleShowQRCode = (link) => {
    setCurrentShareLink(link);
    setShowQRCode(true);
  };

  const handleDisconnect = () => {
    setTrelloData(null);
    toast({
      title: "Disconnected from Trello",
      description: "You have been successfully disconnected from your Trello account.",
    });
  };
console.log(JSON.stringify(trelloData, null, 2));
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <UserProfile />
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>External Share</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowApiDocs(true)}
                  className="flex items-center"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  API Docs
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              {!trelloData ? (
                <TrelloConnect onConnect={setTrelloData} />
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Connected as {trelloData.member?.fullName}</span>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trelloData ? (
              <Tabs defaultValue="newShare">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="newShare">New Share</TabsTrigger>
                  <TabsTrigger value="previousLinks">Previous Links</TabsTrigger>
                </TabsList>
                <TabsContent value="newShare">
                  <NewShareForm
                    shareType={shareType}
                    setShareType={setShareType}
                    cardCount={cardCount}
                    setCardCount={setCardCount}
                    credits={Infinity}
                    freeSharesLeft={freeSharesLeft}
                    updateCredits={updateCredits}
                    onCreateLink={handleCreateLink}
                    trelloData={trelloData}
                    onShowQRCode={handleShowQRCode}
                  />
                </TabsContent>
                <TabsContent value="previousLinks">
                  <PreviousLinks onShowQRCode={handleShowQRCode} />
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-center py-4">Connect to Trello to start creating share links.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {showQRCode && (
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code for Share Link</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <QRCode value={currentShareLink} size={256} />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowQRCode(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {showApiDocs && (
        <Dialog open={showApiDocs} onOpenChange={setShowApiDocs} className="max-w-4xl">
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>API Documentation</DialogTitle>
            </DialogHeader>
            <ApiDocumentation />
            <DialogFooter>
              <Button onClick={() => setShowApiDocs(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default App;
