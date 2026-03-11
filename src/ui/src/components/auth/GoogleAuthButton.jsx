'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import './GoogleAuthButton.css';
import { apiRequestJson } from '@/lib/api/request';

const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = 'Sign in with Google',
  disabled = false,
  mode = 'login',
  apiUrl = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const timeoutRef = useRef(null);
  const tempContainerRef = useRef(null);

  // Load Google OAuth client ID from backend
  useEffect(() => {
    const loadGoogleConfig = async () => {
      try {
        const data = await apiRequestJson(
          `${apiUrl}/api/v1/auth/google/config`,
          { method: 'GET', headers: { Accept: 'application/json' } },
          { toastOnError: false, retries: 1, errorTitle: 'Google Sign-In unavailable' }
        );
        if (data?.client_id) {
          setClientId(data.client_id);
          return;
        }
        onError?.('Google Sign-In is not configured for this endpoint.');
      } catch (error) {
        console.error('Failed to load Google OAuth config:', error);
        onError?.('Failed to load Google Sign-In configuration.');
      }
    };

    if (apiUrl) {
      loadGoogleConfig();
    }
  }, [apiUrl]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (tempContainerRef.current) {
        tempContainerRef.current.remove();
        tempContainerRef.current = null;
      }
    };
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (!clientId) return;

    // Check if script already loaded
    if (window.google?.accounts?.id) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      onError?.('Failed to load Google Sign-In');
    };

    document.head.appendChild(script);

    return () => {
      // Clean up if component unmounts
    };
  }, [clientId, onError]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!googleLoaded || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      onError?.('Failed to initialize Google Sign-In.');
    }
  }, [googleLoaded, clientId]);

  const handleCredentialResponse = useCallback((response) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    if (response.credential) {
      onSuccess?.(response.credential);
    } else {
      onError?.('No credential received from Google');
    }
  }, [onSuccess, onError]);

  // Alternative: Use rendered Google button for better UX
  const handleGoogleButtonClick = useCallback(() => {
    if (disabled || isLoading || !googleLoaded || !clientId) return;

    setIsLoading(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setIsLoading(false);
      onError?.('Google sign-in timed out. Please try again.');
    }, 30000);

    // Create a temporary container for Google's rendered button
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);
    tempContainerRef.current = tempContainer;

    window.google.accounts.id.renderButton(tempContainer, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: mode === 'login' ? 'signin_with' : 'signup_with',
    });

    // Trigger click on the rendered button
    const googleBtn = tempContainer.querySelector('div[role="button"]');
    if (googleBtn) {
      googleBtn.click();
    } else {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      onError?.('Failed to initialize Google Sign-In. Please refresh and try again.');
    }

    // Clean up
    window.setTimeout(() => {
      if (tempContainerRef.current) {
        tempContainerRef.current.remove();
        tempContainerRef.current = null;
      }
    }, 1500);
  }, [disabled, isLoading, googleLoaded, clientId, mode]);

  if (!clientId) {
    return (
      <button className="google-auth-button disabled" disabled>
        <div className="google-icon-wrapper">
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <span className="google-button-text">Loading...</span>
      </button>
    );
  }

  return (
    <button
      className={`google-auth-button ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleGoogleButtonClick}
      disabled={disabled || isLoading || !googleLoaded}
    >
      <div className="google-icon-wrapper">
        {isLoading ? (
          <div className="google-spinner" />
        ) : (
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
      </div>
      <span className="google-button-text">{isLoading ? 'Signing in...' : text}</span>
    </button>
  );
};

export default GoogleAuthButton;
