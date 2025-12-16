import React, { useState, useEffect } from 'react';
import api, { Counter, Token } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const AdminPanel: React.FC = () => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [tokenHistory, setTokenHistory] = useState<Token[]>([]);
  const [showAddCounter, setShowAddCounter] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignCounterId, setReassignCounterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounters = async () => {
    try {
      const data = await api.getCounters();
      setCounters(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch counters');
    }
  };

  const fetchTokenHistory = async () => {
    try {
      const data = await api.getTokenHistory();
      setTokenHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch token history');
    }
  };

  useEffect(() => {
    fetchCounters();
    fetchTokenHistory();
  }, []);

  // WebSocket for real-time updates
  useWebSocket((data) => {
    if (data.type === 'counter_added' || 
        data.type === 'counter_closed' || 
        data.type === 'counter_reopened' ||
        data.type === 'token_called' ||
        data.type === 'token_served') {
      fetchCounters();
      fetchTokenHistory();
    }
  });

  const handleAddCounter = async () => {
    if (!newCounterName.trim()) {
      setError('Counter name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.createCounter(newCounterName);
      setNewCounterName('');
      setShowAddCounter(false);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to create counter');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCounter = async (counterId: number) => {
    if (!window.confirm('Are you sure you want to close this counter? Tokens will be reassigned to waiting.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.closeCounter(counterId);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to close counter');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenCounter = async (counterId: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.reopenCounter(counterId);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen counter');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (counterId: number, newCounterId: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.reassignCounter(counterId, newCounterId);
      setShowReassignModal(false);
      setReassignCounterId(null);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign counter');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (counterId: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.callNextToken(counterId);
      fetchCounters();
      fetchTokenHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to call next token');
    } finally {
      setLoading(false);
    }
  };

  const activeCounters = counters.filter(c => c.status === 'active');
  const closedCounters = counters.filter(c => c.status === 'closed');

  return (
    <div>
      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Counter Management</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddCounter(true)}
          >
            Add Counter
          </button>
        </div>

        <div className="counter-list">
          {activeCounters.map((counter) => (
            <div key={counter.id} className="counter-item">
              <h4>{counter.name}</h4>
              <span className="status active">Active</span>
              <div className="counter-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleCallNext(counter.id)}
                  disabled={loading}
                  style={{ fontSize: '12px' }}
                >
                  Call Next
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setReassignCounterId(counter.id);
                    setShowReassignModal(true);
                  }}
                  disabled={loading}
                  style={{ fontSize: '12px' }}
                >
                  Reassign
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleCloseCounter(counter.id)}
                  disabled={loading}
                  style={{ fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>
          ))}

          {closedCounters.map((counter) => (
            <div key={counter.id} className="counter-item">
              <h4>{counter.name}</h4>
              <span className="status closed">Closed</span>
              <div className="counter-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleReopenCounter(counter.id)}
                  disabled={loading}
                  style={{ fontSize: '12px' }}
                >
                  Reopen
                </button>
              </div>
            </div>
          ))}
        </div>

        {counters.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
            No counters available. Add your first counter to get started.
          </p>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Token History</h2>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                fetchTokenHistory();
              }
            }}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Counter</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Called At</th>
                  <th>Served At</th>
                </tr>
              </thead>
              <tbody>
                {tokenHistory.map((token) => (
                  <tr key={token.id}>
                    <td><strong>#{token.token_number}</strong></td>
                    <td>{token.counter_name || '-'}</td>
                    <td>
                      <span className={`status-badge ${token.status}`}>
                        {token.status}
                      </span>
                    </td>
                    <td>{new Date(token.created_at).toLocaleString()}</td>
                    <td>{token.called_at ? new Date(token.called_at).toLocaleString() : '-'}</td>
                    <td>{token.served_at ? new Date(token.served_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokenHistory.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                No token history available
              </p>
            )}
          </div>
        )}
      </div>

      {showAddCounter && (
        <div className="modal" onClick={() => setShowAddCounter(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Counter</h3>
              <button className="close-btn" onClick={() => setShowAddCounter(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Counter Name</label>
              <input
                type="text"
                value={newCounterName}
                onChange={(e) => setNewCounterName(e.target.value)}
                placeholder="e.g., Counter 2"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCounter()}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddCounter(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddCounter} disabled={loading}>
                {loading ? 'Adding...' : 'Add Counter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReassignModal && reassignCounterId && (
        <div className="modal" onClick={() => setShowReassignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reassign Tokens</h3>
              <button className="close-btn" onClick={() => setShowReassignModal(false)}>×</button>
            </div>
            {activeCounters.filter(c => c.id !== reassignCounterId).length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No other active counters available for reassignment.
              </p>
            ) : (
              <div className="form-group">
                <label>Select New Counter</label>
                <select
                  onChange={(e) => {
                    const newCounterId = parseInt(e.target.value);
                    if (newCounterId && reassignCounterId) {
                      handleReassign(reassignCounterId, newCounterId);
                    }
                  }}
                >
                  <option value="">Select a counter...</option>
                  {activeCounters
                    .filter(c => c.id !== reassignCounterId)
                    .map((counter) => (
                      <option key={counter.id} value={counter.id}>
                        {counter.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowReassignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

