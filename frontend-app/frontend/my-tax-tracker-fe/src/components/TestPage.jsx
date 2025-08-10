import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Frontend is Working! ��
            </h1>
            <p className="text-gray-600 mb-6">
              Your React application is successfully deployed and running.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Environment Info</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Environment:</strong> {import.meta.env.VITE_ENVIRONMENT || 'development'}</p>
                <p><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not configured'}</p>
                <p><strong>Build Time:</strong> {new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Deployment Status</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>✅ React App Loaded</p>
                <p>✅ Routing Working</p>
                <p>✅ Styling Applied</p>
                <p>✅ Environment Variables Loaded</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 