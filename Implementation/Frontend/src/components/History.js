import React, { useState, useEffect } from 'react';
import './History.css';

const History = ({ token }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5001/history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch history');
        }

        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  if (isLoading) {
    return <div className="loading">Loading history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="history-container">
      <h2>Your Activity History</h2>
      {history.length === 0 ? (
        <p>No history found</p>
      ) : (
        <ul className="history-list">
          {history.map((item, index) => (
            <li key={index} className="history-item">
              <div className="history-header">
                <span className="history-action">{item.action}</span>
                <span className="history-time">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="history-details">
                {item.question && (
                  <div className="history-question">
                    <strong>Question:</strong> {item.question}
                  </div>
                )}
                <div className="history-answer">
                  <strong>Answer:</strong> {item.answer || 'No answer available'}
                </div>
                {item.audio_file && (
                  <div className="history-audio">
                    <audio controls src={`http://localhost:5001/audio/${item.audio_file}`}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;