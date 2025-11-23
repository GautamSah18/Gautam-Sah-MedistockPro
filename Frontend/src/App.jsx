import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Document from './components/Document';
import Register from './components/Register';

function App() {
  return (
    <div className="app">
      <Routes>
      
        <Route path="/register" element={<Register />} />
        <Route path="/documents" element={<Document />} />
        <Route path="/" element={<Navigate to="/register" replace />} />
      </Routes>
    </div>
  );
}

export default App;
