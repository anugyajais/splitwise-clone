// src/utils/api.js
// const BASE_URL = 'http://127.0.0.1:8000/api';
const BASE_URL = 'https://splitwise-clone-8y2j.onrender.com/api'; 

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  // Grab the JWT token if we have one saved
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const apiUpload = async (endpoint, file) => {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', file);

  const headers = {
    // Note: Do NOT set 'Content-Type': 'multipart/form-data'. 
    // The browser sets it automatically with the correct boundary boundary.
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed! Status: ${response.status}`);
  }
  
  return response.json();
};