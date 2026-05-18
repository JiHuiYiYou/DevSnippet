import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Apply saved theme before React mounts to prevent flash
const root = document.documentElement
try {
  const raw = localStorage.getItem('devsnippet-settings')
  const settings = raw ? JSON.parse(raw) : null
  if (settings?.theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.add('light')
  }
} catch {
  root.classList.add('light')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
