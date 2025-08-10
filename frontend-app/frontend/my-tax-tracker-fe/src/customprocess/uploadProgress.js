import axios from 'axios';
import { refreshToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  let token = localStorage.getItem('access_token');

  // Helper to send the request
  const sendRequest = (tokenToUse) =>
    axios.post(`${API_BASE_URL}/receipts/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${tokenToUse}`,
      },
      withCredentials: true,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent);
      }
    });

  try {
    return await sendRequest(token);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      try {
        token = await refreshToken();
        if (!token) throw new Error('No access token after refresh');
        localStorage.setItem('access_token', token);
        return await sendRequest(token);
      } catch (refreshErr) {
        localStorage.removeItem('access_token');
        throw refreshErr;
      }
    }
    throw err;
  }
};

export default uploadFile;