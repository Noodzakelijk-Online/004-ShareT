import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';

const SharedLinkAccess = ({ linkToken }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [linkInfo, setLinkInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    // Fetch link info when component mounts
    fetchLinkInfo();
  }, [linkToken]);
  
  const fetchLinkInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/shared-access/${linkToken}`);
      
      if (response.data.linkInfo) {
        setLinkInfo(response.data.linkInfo);
      } else {
        throw new Error('Invalid link or link information not found');
      }
    } catch (error) {
      console.error('Error fetching link info:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load link information');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendVerification = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/email-verification/send-verification`, {
        email,
        linkToken
      });
      
      if (response.data.success) {
        setVerificationSent(true);
        toast.success("Verification code sent to your email");
        
        // For development, if code is returned directly
        if (response.data.code) {
          setVerificationCode(response.data.code);
        }
      } else {
        throw new Error(response.data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setError(error.response?.data?.error || error.message || 'Failed to send verification code');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/email-verification/verify-code`, {
        email,
        linkToken,
        code: verificationCode
      });
      
      if (response.data.success && response.data.accessGranted) {
        setAccessGranted(true);
        toast.success("Access granted!");
        
        // Store access token
        localStorage.setItem('shareT_access_token', response.data.accessToken);
        
        // Redirect to card view
        setTimeout(() => {
          window.location.href = `/shared/${linkToken}/card`;
        }, 1000);
      } else {
        throw new Error(response.data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError(error.response?.data?.error || error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Access Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!linkInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Link Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>The shared link you're trying to access doesn't exist or has been revoked.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Access Shared Trello Card</CardTitle>
        <CardDescription>
          You're accessing {linkInfo.trelloCardName} from {linkInfo.trelloBoardName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verificationSent ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex mt-1">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1"
                  disabled={isVerifying}
                />
              </div>
              {linkInfo.requiresEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  This link is restricted to specific email addresses
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleSendVerification} 
              disabled={!email || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <div className="flex mt-1">
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="flex-1"
                  disabled={isVerifying || accessGranted}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            
            <Button 
              onClick={handleVerifyCode} 
              disabled={!verificationCode || isVerifying || accessGranted}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : accessGranted ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Access Granted
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            
            {!accessGranted && (
              <Button 
                variant="link" 
                onClick={() => setVerificationSent(false)}
                className="w-full"
                disabled={isVerifying}
              >
                Use a different email
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-xs text-muted-foreground">
          {linkInfo.permissionLevel === 'edit' ? (
            <span>You'll have edit access to this card</span>
          ) : (
            <span>You'll have view-only access to this card</span>
          )}
        </div>
        {linkInfo.expiresAt && (
          <div className="text-xs text-muted-foreground">
            This link expires on {new Date(linkInfo.expiresAt).toLocaleDateString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SharedLinkAccess;
