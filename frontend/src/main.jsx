import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./study.css"
import "./theme.css"
import { AeroBackdrop } from "./components/Brand"
import { AuthProvider } from "./context/AuthContext"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <AeroBackdrop />
      <App />
    </AuthProvider>
  </StrictMode>
)
