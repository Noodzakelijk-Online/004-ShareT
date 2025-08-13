import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const PublicComment = () => {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName || !commentText) {
      toast({
        title: "Missing fields",
        description: "Please enter your name and a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const text = `Comment from ${guestName}:\n\n${commentText}`;

    window.Trello.post(
      `/cards/${cardId}/actions/comments`,
      { text },
      () => {
        toast({
          title: "Comment submitted",
          description: "Your comment has been successfully submitted.",
        });
        setGuestName('');
        setCommentText('');
        setIsSubmitting(false);
      },
      () => {
        toast({
          title: "Error submitting comment",
          description: "There was a problem submitting your comment. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    );
  };

  useEffect(() => {
    const fetchCard = () => {
      setLoading(true);
      window.Trello.get(
        `/cards/${cardId}`,
        (data) => {
          setCard(data);
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
          toast({
            title: "Error fetching card data",
            description: "Could not retrieve card details. Please check the link and try again.",
            variant: "destructive",
          });
        }
      );
    };

    // Trello client.js might not be loaded immediately
    const checkTrello = setInterval(() => {
      if (window.Trello) {
        clearInterval(checkTrello);
        // Authorize silently to ensure we have a token if the user is already logged in to Trello in this browser
        window.Trello.authorize({
            interactive: false,
            success: fetchCard,
            error: fetchCard // Still try to fetch, might be a public card
        });
      }
    }, 500);

    return () => clearInterval(checkTrello);
  }, [cardId, toast]);

  if (loading) {
    return <div className="p-8">Loading card details...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading card. Please ensure the link is correct.</div>;
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{card.name}</CardTitle>
            <CardDescription>You are commenting as a guest.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: card.desc }} />

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Add a comment</h3>
              <div>
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  placeholder="John Doe"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="commentText">Your Comment</Label>
                <Textarea
                  id="commentText"
                  placeholder="Add your feedback..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicComment;
