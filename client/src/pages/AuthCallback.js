import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Box, Typography } from '@mui/material';
// import api from '../services/api'; // No longer needed directly
import TokenService from '../services/tokenService';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthData } = useAuth();
  const [error, setError] = useState('');

  // Step 1: Initialize Google Login
  const startGoogleLogin = () => {
    try {
      console.log('Starting Google login process...');
      
      // Generate and encrypt state with timestamp
      const encryptedState = TokenService.generateState();
      TokenService.saveOAuthState(encryptedState);
      
      // Build OAuth parameters
      const params = new URLSearchParams({
        state: encryptedState,
        redirect: window.location.pathname,
        nonce: Math.random().toString(36).substring(2), // Additional CSRF protection
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        response_type: 'code'
      });
      
      // Redirect to Google OAuth
      const authUrl = `${process.env.REACT_APP_API_URL}/auth/google?${params.toString()}`;
      console.log('Redirecting to Google OAuth...', { authUrl });
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initialize Google login:', error);
      setError('Failed to initialize Google login. Please try again.');
      // Stay on the page to show the error
    }
  };

  // Step 2: Handle the OAuth Callback
  const handleCallback = async () => {
    console.log('Processing OAuth callback...');
    
    // Check for OAuth errors first
    const oauthError = searchParams.get('error');
    if (oauthError) {
      console.error('OAuth error received:', oauthError);
      throw new Error(`OAuth error: ${oauthError}`);
    }

    // Step 3: Get and validate tokens
    const token = searchParams.get('token');
    const state = searchParams.get('state');

    // If no token but have state, we might be in the middle of the OAuth flow
    if (!token && state) {
      console.log('Received state but no token, waiting for completion...');
      return; // Wait for the complete callback
    }

    // If no token and no state, start the login process
    if (!token && !state) {
      console.log('No token or state found, starting login process...');
      startGoogleLogin();
      return;
    }

    // Validate state for security
    console.log('Validating OAuth state...');
    if (!state) {
      throw new Error('No state parameter received');
    }

    // Step 4: Verify OAuth State
    console.log('Verifying OAuth state...');
    await TokenService.verifyOAuthState(state);

    // Step 5: Process Tokens
    console.log('Processing authentication tokens...');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');
    
    // Step 6: Clean URL and Initialize Session
    console.log('Initializing user session...');
    // Remove sensitive data from URL
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Fetch and verify user data
    // Note: api.get('/auth/me') is implicitly called by setAuthData via useEffect in AuthContext
    // We just need to set the tokens and user data.
    // For now, we don't have the user object, so we'll let the context fetch it.
    // A better approach would be for the /google/callback to return the user object as well.
    setAuthData(null, token, refreshToken, expiresIn); // Set tokens, user will be fetched by context
    
    console.log('User session initialized successfully');
    
    // Redirect to the intended destination or home
    const redirectPath = searchParams.get('redirect') || '/';
    console.log('Redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
  };
  useEffect(() => {
    const processAuth = async () => {
      try {
        await handleCallback();
      } catch (error) {
        console.error('Authentication failed:', error);
        
        // Clean up on failure
        TokenService.clearTokens();
        setError(error.message || 'Failed to initialize authentication');

        // Redirect to login with specific error
        const errorParam = error.message === 'Invalid or expired authentication request' 
          ? 'invalid_state' 
          : 'auth_failed';
          
        setTimeout(() => {
          navigate(`/login?error=${errorParam}`, { replace: true });
        }, 3000);
      }
    };

    processAuth();
  }, [searchParams, navigate, setAuthData]);

  return (
    <Box
      display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={2}>
      <LoadingSpinner />
      {error ? (
        <Typography color="error" variant="body1" align="center">{error}</Typography>
      ) : (
        <Typography variant="body1" align="center">Completing sign in...</Typography>
      )}
    </Box>
  );
};

export default AuthCallback;