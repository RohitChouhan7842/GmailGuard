import api from './api';
import { encryptData, decryptData } from './cryptoService';

export const TokenService = {
  // For OAuth state verification with encryption and timestamp
  generateState: () => {
    try {
      // Generate a random state token using Web Crypto API
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      const state = Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Add a timestamp for expiration check
      const stateWithTimestamp = {
        value: state,
        timestamp: new Date().getTime()
      };
      
      return encryptData(JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to generate OAuth state:', error);
      throw new Error('OAuth state generation failed');
    }
  },
  
  // Store tokens securely with encryption
  setTokens: (accessToken, refreshToken = null, idToken = null, expiresIn = null) => {
    try {
      // Validate tokens before storing
      TokenService.validateTokens(accessToken, refreshToken, idToken);

      // Store encrypted access token
      localStorage.setItem('access_token', encryptData(accessToken));
      
      // Store encrypted refresh token if provided
      if (refreshToken) {
        localStorage.setItem('refresh_token', encryptData(refreshToken));
      }
      
      // Store encrypted ID token if provided (for OIDC)
      if (idToken) {
        localStorage.setItem('id_token', encryptData(idToken));
      }

      // Store expiration with padding for network delays (subtract 30 seconds)
      if (expiresIn) {
        const expiresAt = new Date().getTime() + (parseInt(expiresIn) - 30) * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }

      // Set Authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return true; // Return success
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Token storage failed');
    }
  },

  // Get decrypted tokens with safety checks
  getAccessToken: () => {
    try {
      const encryptedToken = localStorage.getItem('access_token');
      return encryptedToken ? decryptData(encryptedToken) : null;
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      TokenService.clearTokens(); // Clear potentially corrupted tokens
      return null;
    }
  },

  getRefreshToken: () => {
    try {
      const encryptedToken = localStorage.getItem('refresh_token');
      return encryptedToken ? decryptData(encryptedToken) : null;
    } catch (error) {
      console.error('Failed to decrypt refresh token:', error);
      TokenService.clearTokens(); // Clear potentially corrupted tokens
      return null;
    }
  },

  getIdToken: () => {
    try {
      const encryptedToken = localStorage.getItem('id_token');
      return encryptedToken ? decryptData(encryptedToken) : null;
    } catch (error) {
      console.error('Failed to decrypt ID token:', error);
      TokenService.clearTokens(); // Clear potentially corrupted tokens
      return null;
    }
  },

  getTokenExpiry: () => {
    try {
      const expiresAt = localStorage.getItem('token_expires_at');
      return expiresAt ? parseInt(expiresAt) : null;
    } catch (error) {
      console.error('Failed to get token expiry:', error);
      return null;
    }
  },

  // Enhanced token validation with multiple checks
  hasValidTokens: async () => {
    try {
      const accessToken = TokenService.getAccessToken();
      const expiresAt = TokenService.getTokenExpiry();
      const currentTime = new Date().getTime();
      
      // Check token presence
      if (!accessToken) {
        return false;
      }

      // Check token expiration with early refresh window (5 minutes)
      if (expiresAt) {
        const earlyRefreshWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (currentTime >= expiresAt - earlyRefreshWindow) {
          // Token is expired or close to expiring
          // Try to refresh if we have a refresh token
          if (TokenService.getRefreshToken()) {
            try {
              const newAccessToken = await TokenService.refreshAccessToken();
              return !!newAccessToken; // Return true if refresh was successful
            } catch (error) {
              return false;
            }
          }
          return false;
        }
      }
      
      // Check token format
      try {
        TokenService.validateTokens(accessToken);
      } catch (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },

  // Validate token format
  validateTokens: (accessToken, refreshToken = null, idToken = null) => {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) {
      throw new Error('Invalid access token format');
    }
    
    if (refreshToken && (typeof refreshToken !== 'string' || refreshToken.length < 10)) {
      console.warn('Invalid refresh token format');
    }
    
    if (idToken && (typeof idToken !== 'string' || idToken.length < 10)) {
      console.warn('Invalid ID token format');
    }
    
    return true;
  },

  // Enhanced OAuth state management with encryption
  saveOAuthState: (encryptedState) => {
    try {
      // State is already encrypted by generateState()
      localStorage.setItem('oauth_state', encryptedState);
    } catch (error) {
      console.error('Failed to save OAuth state:', error);
      throw new Error('OAuth state storage failed');
    }
  },

  verifyOAuthState: (receivedState) => {
    try {
      const encryptedSavedState = localStorage.getItem('oauth_state');
      
      // Clean up stored state immediately
      localStorage.removeItem('oauth_state');
      
      if (!encryptedSavedState) {
        throw new Error('No saved OAuth state found');
      }

      // Decrypt and parse saved state
      const savedStateObj = JSON.parse(decryptData(encryptedSavedState));
      
      // Check if state has expired (15 minutes)
      const currentTime = new Date().getTime();
      const stateAge = currentTime - savedStateObj.timestamp;
      if (stateAge > 15 * 60 * 1000) {
        throw new Error('OAuth state has expired');
      }
      
      // Verify state matches
      if (savedStateObj.value !== receivedState) {
        throw new Error('OAuth state mismatch');
      }

      return true;
    } catch (error) {
      console.error('OAuth state verification failed:', error);
      throw error;
    }
  },

  // Refresh access token with request ID for security
  refreshAccessToken: async () => {
    const refreshToken = TokenService.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Generate a random request ID
      const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const response = await api.post('/auth/refresh-token', {
        refresh_token: refreshToken,
        request_id: requestId
      });

      if (!response.success) {
        throw new Error('Token refresh failed');
      }

      const { access_token, refresh_token, expires_in } = response;
      
      // Store new tokens and always use new refresh token if provided
      TokenService.setTokens(
        access_token,
        refresh_token, // Use new refresh token from server for security
        null,
        expires_in
      );

      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      TokenService.clearTokens();
      throw error;
    }
  },

  // Clear all tokens and authentication state
  clearTokens: () => {
    // Clear all stored tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('oauth_state');
    
    // Clear Authorization header
    delete api.defaults.headers.common['Authorization'];
  }
};

export default TokenService;