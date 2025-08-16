
import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const App = lazy(() => import("./pages/App"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const PublicComment = lazy(() => import("./pages/PublicComment"));

const queryClient = new QueryClient();

const AppWrapper = () => {
  useEffect(() => {
    // This is the application's public Trello API key.
    // IMPORTANT: Replace this with your actual Trello API key.
    const apiKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const loadScript = (src, onLoad) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoad;
      document.body.appendChild(script);
    };

    // Load jQuery first, then Trello client.js
    loadScript('https://code.jquery.com/jquery-3.3.1.min.js', () => {
      loadScript(`https://api.trello.com/1/client.js?key=${apiKey}`, null);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex justify-center items-center h-screen"><div>Loading...</div></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              />
              <Route path="/cards/:cardId/comment" element={<PublicComment />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppWrapper;
