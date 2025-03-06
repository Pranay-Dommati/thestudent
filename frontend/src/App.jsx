import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import ChatBotPage from './components/Chatbot/ChatbotPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatBotPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;