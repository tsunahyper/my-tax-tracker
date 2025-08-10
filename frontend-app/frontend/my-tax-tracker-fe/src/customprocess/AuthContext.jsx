import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from './auth';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      console.log("AuthContext: Starting initial authentication check for /auth/me...");
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`); 
        
        if (res.ok) {
          setAccessToken('valid');
          console.log("AuthContext: /auth/me check successful. Access token is valid.");
        } else {
          setAccessToken(null);
          console.warn(`AuthContext: /auth/me check failed with status ${res.status}. Access token set to null.`);
        }
      } catch (error) {
        setAccessToken(null);
        console.error("AuthContext: Error during /auth/me check, setting access token to null:", error);
      } finally {
        setLoading(false);
        console.log("AuthContext: Authentication check completed.");
      }
    }

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, loading }}>
      {!loading ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
