import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { EntriesProvider } from './data/EntriesProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* basename picks up whatever "base" is set to in vite.config.js, so
        routing still works whether this is hosted at the domain root or
        under /scp-catalogue/ */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <EntriesProvider>
          <App />
        </EntriesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
