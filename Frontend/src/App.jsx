import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import Document from './components/Document';
import Register from './components/Register';
import Inventory from './components/Inventory';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/documents" element={<Document />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;