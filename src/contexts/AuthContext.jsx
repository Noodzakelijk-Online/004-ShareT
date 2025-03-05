
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('sharetUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        localStorage.removeItem('sharetUser');
      }
    }
    setLoading(false);
  }, []);

  // Sign up function
  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      // In a real app, this would call an API endpoint
      // For demo purposes, we'll simulate creating a user
      if (localStorage.getItem(`user_${email}`)) {
        throw new Error('User already exists with this email');
      }
      
      const userData = {
        id: `user_${Date.now()}`,
        email,
        fullName,
        createdAt: new Date().toISOString(),
      };
      
      // Store in localStorage for demo purposes
      localStorage.setItem(`user_${email}`, JSON.stringify({
        ...userData,
        passwordHash: btoa(password) // Not secure, just for demo
      }));
      
      // Set the current user
      setCurrentUser(userData);
      localStorage.setItem('sharetUser', JSON.stringify(userData));
      
      toast.success("Account created successfully");
      navigate('/app');
      return userData;
    } catch (error) {
      toast.error(error.message || "Failed to create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      // In a real app, this would call an API endpoint
      const storedUser = localStorage.getItem(`user_${email}`);
      if (!storedUser) {
        throw new Error('No user found with this email');
      }
      
      const userData = JSON.parse(storedUser);
      // Check password (not secure, just for demo)
      if (btoa(password) !== userData.passwordHash) {
        throw new Error('Invalid password');
      }
      
      // Remove passwordHash from the current user
      const { passwordHash, ...userWithoutPassword } = userData;
      
      // Set the current user
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('sharetUser', JSON.stringify(userWithoutPassword));
      
      toast.success("Signed in successfully");
      navigate('/app');
      return userWithoutPassword;
    } catch (error) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = () => {
    localStorage.removeItem('sharetUser');
    setCurrentUser(null);
    toast.success("Signed out successfully");
    navigate('/');
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
