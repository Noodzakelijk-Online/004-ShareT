
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ShareT</h1>
        <div className="space-x-4">
          {currentUser ? (
            <Button asChild>
              <Link to="/app">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      
      <main>
        <section className="py-20 px-8 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Share Your Trello Cards Securely</h1>
          <p className="text-xl mb-8 text-muted-foreground">
            ShareT makes it easy to share Trello cards and lists with clients, 
            partners, or team members - without giving them access to your entire board.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to={currentUser ? "/app" : "/signup"}>
                {currentUser ? "Go to Dashboard" : "Get Started"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </section>

        <section id="how-it-works" className="py-16 px-8 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect to Trello</h3>
                <p className="text-muted-foreground">Securely link your Trello account to ShareT.</p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Select Content</h3>
                <p className="text-muted-foreground">Choose the cards or lists you want to share.</p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Share</h3>
                <p className="text-muted-foreground">Generate secure links or QR codes to share with anyone.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Ready to Start Sharing?</h2>
            <Button size="lg" asChild>
              <Link to={currentUser ? "/app" : "/signup"}>
                {currentUser ? "Go to Dashboard" : "Create Your Account"}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="py-8 px-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground mb-4 md:mb-0">© 2023 ShareT. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
