import { Component } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

class ErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ShareT could not render the application.", {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReturnHome = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>ShareT could not display this page</CardTitle>
            <CardDescription>
              Your data has not been changed. Reload the page to try again, or return to the ShareT home page.
            </CardDescription>
          </CardHeader>
          {import.meta.env.DEV ? (
            <CardContent>
              <details className="rounded-md bg-muted p-3 text-sm">
                <summary className="cursor-pointer font-medium">Developer details</summary>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
                  {error.toString()}
                </pre>
              </details>
            </CardContent>
          ) : null}
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={this.handleReload}>Reload ShareT</Button>
            <Button variant="outline" onClick={this.handleReturnHome}>
              Return home
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }
}

export default ErrorBoundary;
