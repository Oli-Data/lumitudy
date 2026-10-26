import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '../context/AuthContext'
import Observatory from './Observatory'
import '../theme.css'
import './observatory.css'

createRoot(document.getElementById('root')).render(<StrictMode><AuthProvider><Observatory /></AuthProvider></StrictMode>)
