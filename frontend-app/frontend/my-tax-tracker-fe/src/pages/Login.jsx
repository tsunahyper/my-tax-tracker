import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const loginURL = import.meta.env.VITE_API_LOGIN_URL

  const handleCognitoSignIn = () => {
    window.location.href = loginURL;
  };

  const handleRequestAccess = () => {
    navigate('/request-access');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-blue-900 relative">
      {/* Add background illustration here */}
      <div className="absolute inset-0 z-0">
        {/* Use an <img> tag or SVG here for the illustration */}
      </div>
      <div className="relative z-10 bg-blue-900 bg-opacity-80 rounded-lg shadow-lg 
                      w-11/12 max-w-xs p-4
                      sm:max-w-md sm:p-8
                      md:max-w-lg md:p-10
                      flex flex-col items-center">
        <h1 className="text-white text-base sm:text-lg md:text-xl font-bold mb-6 text-center tracking-wide">
          MALAYSIAN TAX TRACKER - LOGIN
        </h1>
        <div className="w-full flex flex-col gap-3 sm:gap-4">
          <button
            onClick={handleCognitoSignIn}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded text-sm sm:text-base"
          >
            Sign in with Cognito
          </button>
          <button
            onClick={handleRequestAccess}
            className="w-full bg-gray-100 hover:bg-gray-200 text-blue-900 font-semibold py-2 rounded text-sm sm:text-base"
          >
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;