const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Generate a new token
router.post('/generate', (req, res) => {
  const db = getDb();
  
  // Get the highest token number
  db.get('SELECT MAX(token_number) as max_token FROM tokens', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const nextTokenNumber = (row.max_token || 0) + 1;
    
    // Insert new token
    db.run(
      'INSERT INTO tokens (token_number, status) VALUES (?, ?)',
      [nextTokenNumber, 'waiting'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get the created token
        db.get('SELECT * FROM tokens WHERE id = ?', [this.lastID], (err, token) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Broadcast update
          if (global.broadcastQueueUpdate) {
            global.broadcastQueueUpdate({ type: 'token_generated', token });
          }
          
          res.json({ success: true, token });
        });
      }
    );
  });
});

// Get token by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  const tokenId = req.params.id;
  
  db.get('SELECT * FROM tokens WHERE id = ?', [tokenId], (err, token) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    res.json(token);
  });
});

// Get token history
router.get('/history/all', (req, res) => {
  const db = getDb();
  
  db.all(
    `SELECT t.*, c.name as counter_name 
     FROM tokens t 
     LEFT JOIN counters c ON t.counter_id = c.id 
     ORDER BY t.created_at DESC 
     LIMIT 100`,
    (err, tokens) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tokens);
    }
  );
});

module.exports = router;

