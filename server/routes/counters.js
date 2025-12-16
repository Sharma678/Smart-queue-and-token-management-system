const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all counters
router.get('/', (req, res) => {
  const db = getDb();
  
  db.all('SELECT * FROM counters ORDER BY id', (err, counters) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(counters);
  });
});

// Create a new counter
router.post('/', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Counter name is required' });
  }
  
  db.run(
    'INSERT INTO counters (name, status) VALUES (?, ?)',
    [name, 'active'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM counters WHERE id = ?', [this.lastID], (err, counter) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Broadcast update
        if (global.broadcastQueueUpdate) {
          global.broadcastQueueUpdate({ type: 'counter_added', counter });
        }
        
        res.json({ success: true, counter });
      });
    }
  );
});

// Close a counter
router.put('/:id/close', (req, res) => {
  const db = getDb();
  const counterId = req.params.id;
  
  // Update counter status
  db.run(
    'UPDATE counters SET status = ? WHERE id = ?',
    ['closed', counterId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Reassign tokens from this counter back to waiting
      db.run(
        'UPDATE tokens SET counter_id = NULL, status = ? WHERE counter_id = ? AND status = ?',
        ['waiting', counterId, 'called'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          db.get('SELECT * FROM counters WHERE id = ?', [counterId], (err, counter) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Broadcast update
            if (global.broadcastQueueUpdate) {
              global.broadcastQueueUpdate({ type: 'counter_closed', counter });
            }
            
            res.json({ success: true, counter });
          });
        }
      );
    }
  );
});

// Reopen a counter
router.put('/:id/reopen', (req, res) => {
  const db = getDb();
  const counterId = req.params.id;
  
  db.run(
    'UPDATE counters SET status = ? WHERE id = ?',
    ['active', counterId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM counters WHERE id = ?', [counterId], (err, counter) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Broadcast update
        if (global.broadcastQueueUpdate) {
          global.broadcastQueueUpdate({ type: 'counter_reopened', counter });
        }
        
        res.json({ success: true, counter });
      });
    }
  );
});

// Reassign tokens from one counter to another
router.put('/:id/reassign', (req, res) => {
  const db = getDb();
  const counterId = req.params.id;
  const { newCounterId } = req.body;
  
  if (!newCounterId) {
    return res.status(400).json({ error: 'New counter ID is required' });
  }
  
  // Verify new counter exists and is active
  db.get('SELECT * FROM counters WHERE id = ? AND status = ?', [newCounterId, 'active'], (err, newCounter) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!newCounter) {
      return res.status(400).json({ error: 'New counter not found or not active' });
    }
    
    // Reassign tokens
    db.run(
      'UPDATE tokens SET counter_id = ? WHERE counter_id = ? AND status = ?',
      [newCounterId, counterId, 'called'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Broadcast update
        if (global.broadcastQueueUpdate) {
          global.broadcastQueueUpdate({ 
            type: 'tokens_reassigned', 
            fromCounter: counterId, 
            toCounter: newCounterId 
          });
        }
        
        res.json({ 
          success: true, 
          message: `Reassigned ${this.changes} tokens to ${newCounter.name}` 
        });
      }
    );
  });
});

module.exports = router;

