import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from './auth'; // Assuming auth.js is in the same directory or correctly imported

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null); // Will be 'valid' or null
  const [loading, setLoading] = useState(true); // Indicates if auth check is in progress

  useEffect(() => {
    async function checkAuth() {
      console.log("AuthContext: Starting initial authentication check for /auth/me...");
      try {
        // Use fetchWithAuth which includes the token refresh logic
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`); 
        
        if (res.ok) {
          setAccessToken('valid');
          console.log("AuthContext: /auth/me check successful. Access token is valid.");
        } else {
          // If res.ok is false here, it means authenticatedFetch did NOT successfully refresh and retry.
          // This implies refreshToken() failed or the retry still resulted in a non-ok status.
          setAccessToken(null);
          console.warn(`AuthContext: /auth/me check failed with status ${res.status}. Access token set to null.`);
        }
      } catch (error) {
        // This catch block will be hit if fetchWithAuth (or refreshToken within it) throws an error.
        // The authenticatedFetch utility should already handle redirection on refresh failure.
        setAccessToken(null);
        console.error("AuthContext: Error during /auth/me check, setting access token to null:", error);
      } finally {
        setLoading(false);
        console.log("AuthContext: Authentication check completed.");
      }
    }

    // Call the authentication check function when the component mounts
    checkAuth();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, loading }}>
      {/* Render children only when authentication check is complete */}
      {!loading ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
