<<<<<<< HEAD

=======
>>>>>>> da382d0 (forget added)
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import App from "./pages/App";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
<<<<<<< HEAD
=======
import ForgotPassword from "./components/ForgetPassword";
import TrelloCallback from "./pages/TrelloCallback";
>>>>>>> da382d0 (forget added)
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
<<<<<<< HEAD
            <Route 
              path="/app" 
=======
            <Route path="/forgetpassword" element={<ForgotPassword />} />
            <Route path="/trello/callback" element={<TrelloCallback />} />
            <Route
              path="/app"
>>>>>>> da382d0 (forget added)
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
<<<<<<< HEAD
              } 
=======
              }
>>>>>>> da382d0 (forget added)
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

<<<<<<< HEAD
export default AppWrapper;
=======
export default AppWrapper;
>>>>>>> da382d0 (forget added)
