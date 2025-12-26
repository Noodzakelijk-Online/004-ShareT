import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { auth as authAPI } from '../api';

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
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get current user from backend
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            // Backend returns { success: true, data: { user: {...} } }
            const user = response.data.user || response.data;
            setCurrentUser(user);
            // Update localStorage with fresh user data
            localStorage.setItem('sharetUser', JSON.stringify(user));
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('sharetUser');
          }
        } catch (error) {
          console.error('Failed to verify session', error);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('sharetUser');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Sign up function - now uses backend API
  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        email,
        password,
        name: fullName
      });

      if (response.success) {
        // Backend returns { success: true, data: { user: {...}, token: '...' } }
        const { token, user } = response.data;
        
        // Store JWT token
        localStorage.setItem('token', token);
        
        // Store user data
        localStorage.setItem('sharetUser', JSON.stringify(user));
        setCurrentUser(user);
        
        toast.success("Account created successfully");
        navigate('/app');
        return user;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to create account";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function - now uses backend API
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email,
        password
      });

      if (response.success) {
        // Backend returns { success: true, data: { user: {...}, token: '...' } }
        const { token, user } = response.data;
        
        // Store JWT token
        localStorage.setItem('token', token);
        
        // Store user data
        localStorage.setItem('sharetUser', JSON.stringify(user));
        setCurrentUser(user);
        
        toast.success("Signed in successfully");
        navigate('/app');
        return user;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to sign in";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function - now calls backend API
  const signOut = async () => {
    try {
      // Call backend logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('sharetUser');
      setCurrentUser(null);
      toast.success("Signed out successfully");
      navigate('/');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        // Backend returns { success: true, data: { user: {...} } }
        const updatedUser = response.data.user || response.data;
        setCurrentUser(updatedUser);
        localStorage.setItem('sharetUser', JSON.stringify(updatedUser));
        toast.success("Profile updated successfully");
        return updatedUser;
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to update profile";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        toast.success("Password changed successfully");
        return true;
      } else {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to change password";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

