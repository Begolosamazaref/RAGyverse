import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PDFUploader from './components/PDFUploader';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Navbar from './components/Navbar';
import History from './components/History';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken) {
      setToken(storedToken);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  return (
    <Router>
      <div className="app">
        <Navbar token={token} username={username} onLogout={handleLogout} />
        <main className="main">
          <Routes>
            <Route path="/login" element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} />
            <Route path="/register" element={token ? <Navigate to="/" /> : <Register setToken={setToken} />} />
            <Route
              path="/"
              element={token ? <PDFUploader token={token} /> : <Navigate to="/login" />}
            />
            <Route
              path="/history"
              element={token ? <History token={token} /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
        <footer className="footer">
          <p>© 2025 RAGyverse. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;