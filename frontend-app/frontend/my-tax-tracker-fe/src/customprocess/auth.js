// auth.js

// Login: backend should redirect to Cognito, so this may just be a redirect
export function loginWithCognito() {
  console.log("Redirecting to Cognito login URL:", import.meta.env.VITE_API_LOGIN_URL);
  window.location.href = `${import.meta.env.VITE_API_LOGIN_URL}`; // or your Cognito login URL
}

// Refresh token: gets new access token using refresh token in cookie
export async function refreshToken() {
  console.log("Attempting to refresh token via backend /auth/refresh endpoint.");
  const res = await fetch('http://localhost:8000/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Ensures cookies (including refresh token) are sent
  });

  if (!res.ok) {
    console.error(`Refresh token request failed with status: ${res.status}`);
    // If the refresh endpoint itself returns an error (e.g., 401, 400),
    // it means the refresh token is likely invalid or expired.
    // Clear local storage token and throw to trigger logout in calling functions.
    localStorage.removeItem('access_token');
    // The backend's /auth/refresh endpoint should also clear cookies on its side.
    throw new Error(`Refresh failed with status ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const newAccessToken = data.access_token;

  if (newAccessToken) {
    localStorage.setItem('access_token', newAccessToken); // SAVE THE NEW TOKEN
    console.log("New access token successfully obtained and saved to localStorage.");
  } else {
    // If backend didn't return a token, treat as a refresh failure
    console.error("Refresh failed: Backend did not return a new access_token.");
    localStorage.removeItem('access_token');
    throw new Error('Refresh failed: No new access token received');
  }

  return newAccessToken; // Return the new access token
}

// Utility function to perform fetch requests with authentication headers and refresh logic
async function authenticatedFetch(url, options = {}) {
  let accessToken = localStorage.getItem('access_token');
  let headers = { ...options.headers };

  // Attach Authorization header if a token exists
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Ensures cookies are sent with every request
  };

  console.log(`Making initial request to: ${url} with token: ${accessToken ? 'Present' : 'Absent'}`);
  let res = await fetch(url, fetchOptions);

  // If the response is 401 Unauthorized, we will NOT attempt to refresh or redirect here.
  // Instead, we will simply return the response so the calling component can handle it.
  // This allows the ReceiptManagement component to display its own error.
  if (res.status === 401) {
    console.warn(`Request to ${url} returned 401. Not attempting refresh or redirect. Propagating error.`);
    // We explicitly return the response so the calling component can check res.ok and res.status
    return res; 
  }

  // For any other status, or if not 401, just return the response
  return res;
}

export async function fetchWithAuth(url, options = {}) {
  return authenticatedFetch(url, options);
}

export async function postWithAuth(url, body, options = {}) {
  let headers = { ...options.headers };
  let fetchOptions = {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  };

  // Only set Content-Type for JSON bodies if not FormData
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  fetchOptions.headers = headers; // Apply content-type here

  return authenticatedFetch(url, fetchOptions);
}
