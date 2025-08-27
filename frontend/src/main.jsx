import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import indexedDBService from './services/IndexedDBService.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Background migration from localStorage -> IndexedDB (non-blocking)
void indexedDBService.migrateLocalStorage({
  exactKeys: ['accessToken', 'currentCourseId', 'coursesSavedToHub', 'prolearning_history'],
  prefixes: ['proLearning_', 'course_content_']
});
