import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import Index from "./pages/Index";
import App from "./pages/App";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./components/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import TrelloCallback from "./pages/TrelloCallback";
import SharedLinkAccess from "./components/SharedLinkAccess";
import SharedCardView from "./components/SharedCardView";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Wrapper to extract route params and pass as props
const SharedPage = () => {
  const { shareId } = useParams();
  return (
    <div className="min-h-screen bg-background p-8">
      <SharedLinkAccess linkToken={shareId} />
    </div>
  );
};

const SharedCardPage = () => {
  const { shareId } = useParams();
  return <SharedCardView linkToken={shareId} />;
};

const queryClient = new QueryClient();

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgetpassword" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/trello/callback" element={<TrelloCallback />} />
            <Route path="/shared/:shareId" element={<SharedPage />} />
            <Route path="/shared/:shareId/card" element={<SharedCardPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;
