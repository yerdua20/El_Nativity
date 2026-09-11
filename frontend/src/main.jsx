import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Pas de StrictMode : son double-montage des effets en dev casse
// react-leaflet (MapContainer initialise deux fois la carte sur le
// même noeud DOM, ce qui fait planter tout l'écran sur /carte avec
// "Cannot read properties of undefined (reading '_leaflet_events')").
createRoot(document.getElementById('root')).render(<App />)
