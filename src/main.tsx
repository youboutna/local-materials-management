
import "reflect-metadata"; // Import reflect-metadata at the top
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
