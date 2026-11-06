import { createRoot } from 'react-dom/client'
import 'duo-react/style.css'
import './style.css'
import { Benchmark } from './benchmark'

const root = document.getElementById('root')
if (!root) throw new Error('Missing benchmark root')
createRoot(root).render(<Benchmark />)
