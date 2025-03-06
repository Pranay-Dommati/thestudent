import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import Courses from './components/Courses/Courses';
import ChatBotPage from './components/Chatbot/ChatbotPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/chat" element={<ChatBotPage />} />
        <Route 
          path="/courses/:courseId" 
          element={
            <div className="pt-16">

              <Courses.CourseDetailsPage />
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;