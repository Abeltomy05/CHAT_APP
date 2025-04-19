import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Auth0Provider
     domain="dev-bs3kbsdco68rgqbt.us.auth0.com"
     clientId="s5UPg9mlkRYvL1RZ7FPUETXUgsIc9pFs"
     authorizationParams={{
       redirect_uri: window.location.origin,
        prompt: "login"
     }}
     >
    <App />
    </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
)
