import React, { useState, useEffect } from 'react';
import api, { Token, QueueStatus, WaitingTime } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const CustomerView: React.FC = () => {
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [waitingTime, setWaitingTime] = useState<WaitingTime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueStatus = async () => {
    try {
      const status = await api.getQueueStatus();
      setQueueStatus(status);
    } catch (err: any) {
      console.error('Error fetching queue status:', err);
    }
  };

  const fetchWaitingTime = async () => {
    try {
      const time = await api.getWaitingTime();
      setWaitingTime(time);
    } catch (err: any) {
      console.error('Error fetching waiting time:', err);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    fetchWaitingTime();
    const interval = setInterval(() => {
      fetchQueueStatus();
      fetchWaitingTime();
    }, 5000); // Poll every 5 seconds as fallback

    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time updates
  useWebSocket((data) => {
    if (data.type === 'token_generated' || 
        data.type === 'token_called' || 
        data.type === 'token_serving' || 
        data.type === 'token_served' ||
        data.type === 'counter_added' ||
        data.type === 'counter_closed' ||
        data.type === 'counter_reopened' ||
        data.type === 'tokens_reassigned') {
      fetchQueueStatus();
      fetchWaitingTime();
    }
  });

  const handleGenerateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await api.generateToken();
      setCurrentToken(token);
    } catch (err: any) {
      setError(err.message || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Get Your Token</h2>
        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>
            {error}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleGenerateToken}
          disabled={loading}
          style={{ width: '100%', fontSize: '18px', padding: '15px' }}
        >
          {loading ? 'Generating...' : 'Generate Token'}
        </button>

        {currentToken && (
          <div className="token-display">
            <h3>Your Token Number</h3>
            <div className="token-number">{currentToken.token_number}</div>
            <p>Please wait for your number to be called</p>
          </div>
        )}
      </div>

      {waitingTime && (
        <div className="waiting-time">
          <div>Estimated Waiting Time</div>
          <div className="time">{waitingTime.estimatedMinutes} minutes</div>
          <div style={{ fontSize: '14px', color: '#856404' }}>
            {waitingTime.waitingCount} people ahead • {waitingTime.activeCounters} counter(s) active
          </div>
        </div>
      )}

      <div className="card">
        <h2>Live Queue Display</h2>
        {queueStatus && queueStatus.counters.length > 0 ? (
          <div className="queue-grid">
            {queueStatus.counters.map((counterQueue) => (
              <div key={counterQueue.counter.id} className="counter-card">
                <h3>{counterQueue.counter.name}</h3>
                
                {counterQueue.nowServing ? (
                  <div className="now-serving">
                    <div className="label">Now Serving</div>
                    <div className="number">{counterQueue.nowServing.token_number}</div>
                  </div>
                ) : (
                  <div className="now-serving" style={{ background: '#6c757d' }}>
                    <div className="label">No one serving</div>
                  </div>
                )}

                {counterQueue.nextUp.length > 0 && (
                  <div className="next-up">
                    <h4>Next Up</h4>
                    {counterQueue.nextUp.map((token) => (
                      <div key={token.id} className="next-token">
                        Token #{token.token_number}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
                  {counterQueue.waitingCount} waiting
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No active counters available</p>
        )}

        {queueStatus && queueStatus.waitingQueue.length > 0 && (
          <div className="waiting-queue">
            <h3>Waiting Queue</h3>
            <div className="queue-list">
              {queueStatus.waitingQueue.map((token) => (
                <div key={token.id} className="queue-item">
                  #{token.token_number}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerView;

