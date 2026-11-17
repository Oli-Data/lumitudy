import { AuthProvider } from '../context/AuthContext'
import '../theme.css'

export const metadata = {
  title: {
    default: 'Lumitudy · A brighter way to study',
    template: 'Lumitudy · %s',
  },
  description: 'A brighter way to study. Turn textbook chapters into flashcards, quizzes, and shared study sessions with Lumitudy by CO³ Labs.',
  icons: { icon: '/favicon.svg' },
}

export const viewport = { themeColor: '#f5f6ed' }

const themeScript = "try{document.documentElement.dataset.theme=localStorage.getItem('lumitudy-theme')==='night'?'night':'day'}catch{document.documentElement.dataset.theme='day'}"

export default function RootLayout({ children }) {
  return <html lang="en" data-theme="day" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body><AuthProvider>{children}</AuthProvider></body>
  </html>
}
