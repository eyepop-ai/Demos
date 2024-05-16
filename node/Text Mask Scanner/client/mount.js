import { createRoot } from 'react-dom/client'
import { createApp } from './base.jsx'
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(createApp())
