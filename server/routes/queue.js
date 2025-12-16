const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get current queue status
router.get('/status', (req, res) => {
  const db = getDb();
  
  // Get active counters
  db.all('SELECT * FROM counters WHERE status = ? ORDER BY id', ['active'], (err, counters) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get tokens for each counter
    const queuePromises = counters.map(counter => {
      return new Promise((resolve, reject) => {
        // Get currently serving token (status = 'serving')
        db.all(
          `SELECT * FROM tokens 
           WHERE counter_id = ? AND status = 'serving' 
           ORDER BY called_at ASC 
           LIMIT 1`,
          [counter.id],
          (err, servingTokens) => {
            if (err) return reject(err);
            
            // Get next tokens that are called but not yet serving (waiting for 5 min)
            db.all(
              `SELECT * FROM tokens 
               WHERE counter_id = ? AND status = 'called' 
               ORDER BY called_at ASC 
               LIMIT 5`,
              [counter.id],
              (err, nextTokens) => {
                if (err) return reject(err);
                
                db.get(
                  `SELECT COUNT(*) as count FROM tokens 
                   WHERE counter_id = ? AND status = 'waiting'`,
                  [counter.id],
                  (err, waitingRow) => {
                    if (err) return reject(err);
                    
                    resolve({
                      counter,
                      nowServing: servingTokens[0] || null,
                      nextUp: nextTokens.slice(0, 3),
                      waitingCount: waitingRow.count
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
    
    // Get overall waiting queue
    db.all(
      `SELECT * FROM tokens 
       WHERE status = 'waiting' 
       ORDER BY token_number ASC`,
      (err, waitingQueue) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        Promise.all(queuePromises).then(counterQueues => {
          res.json({
            counters: counterQueues,
            waitingQueue: waitingQueue.slice(0, 10) // Show first 10 waiting
          });
        }).catch(err => {
          res.status(500).json({ error: err.message });
        });
      }
    );
  });
});

// Call next token for a counter
router.post('/call-next', (req, res) => {
  const db = getDb();
  const { counterId } = req.body;
  
  if (!counterId) {
    return res.status(400).json({ error: 'Counter ID is required' });
  }
  
  // Check if counter has anyone currently serving
  db.get(
    `SELECT COUNT(*) as count FROM tokens 
     WHERE counter_id = ? AND status = 'serving'`,
    [counterId],
    (err, servingRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const hasServingToken = servingRow.count > 0;
      
      // Get the next waiting token
      db.get(
        `SELECT * FROM tokens 
         WHERE status = 'waiting' 
         ORDER BY token_number ASC 
         LIMIT 1`,
        (err, token) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (!token) {
            return res.status(404).json({ error: 'No tokens in queue' });
          }
          
          // If someone is serving, mark them as served and assign new token as "called"
          // If no one is serving, assign new token immediately as "serving"
          if (hasServingToken) {
            // Mark current serving token as served (manual override)
            db.run(
              `UPDATE tokens 
               SET status = 'served', served_at = CURRENT_TIMESTAMP 
               WHERE counter_id = ? AND status = 'serving'`,
              [counterId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                // Assign new token as "called" (will become serving after 5 min)
                db.run(
                  `UPDATE tokens 
                   SET counter_id = ?, status = 'called', called_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`,
                  [counterId, token.id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    
                    // Get updated token
                    db.get('SELECT * FROM tokens WHERE id = ?', [token.id], (err, updatedToken) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      
                      // Broadcast update
                      if (global.broadcastQueueUpdate) {
                        global.broadcastQueueUpdate({ type: 'token_called', token: updatedToken });
                      }
                      
                      res.json({ success: true, token: updatedToken });
                    });
                  }
                );
              }
            );
          } else {
            // No one serving - assign immediately as "serving"
            db.run(
              `UPDATE tokens 
               SET counter_id = ?, status = 'serving', called_at = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [counterId, token.id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                // Get updated token
                db.get('SELECT * FROM tokens WHERE id = ?', [token.id], (err, updatedToken) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  
                  // Broadcast update
                  if (global.broadcastQueueUpdate) {
                    global.broadcastQueueUpdate({ type: 'token_serving', token: updatedToken });
                  }
                  
                  res.json({ success: true, token: updatedToken });
                });
              }
            );
          }
        }
      );
    }
  );
});

// Mark token as serving
router.put('/:tokenId/serving', (req, res) => {
  const db = getDb();
  const tokenId = req.params.tokenId;
  
  db.run(
    `UPDATE tokens SET status = 'serving' WHERE id = ?`,
    [tokenId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM tokens WHERE id = ?', [tokenId], (err, token) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Broadcast update
        if (global.broadcastQueueUpdate) {
          global.broadcastQueueUpdate({ type: 'token_serving', token });
        }
        
        res.json({ success: true, token });
      });
    }
  );
});

// Mark token as served
router.put('/:tokenId/served', (req, res) => {
  const db = getDb();
  const tokenId = req.params.tokenId;
  
  db.run(
    `UPDATE tokens SET status = 'served', served_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [tokenId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM tokens WHERE id = ?', [tokenId], (err, token) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Broadcast update
        if (global.broadcastQueueUpdate) {
          global.broadcastQueueUpdate({ type: 'token_served', token });
        }
        
        res.json({ success: true, token });
      });
    }
  );
});

// Calculate estimated waiting time
router.get('/waiting-time', (req, res) => {
  const db = getDb();
  
  // Get average service time from recent served tokens
  db.all(
    `SELECT 
       (julianday(served_at) - julianday(called_at)) * 24 * 60 as service_time_minutes
     FROM tokens 
     WHERE served_at IS NOT NULL 
       AND called_at IS NOT NULL
       AND served_at > datetime('now', '-1 day')
     ORDER BY served_at DESC 
     LIMIT 20`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate average service time
      const serviceTimes = rows.map(r => r.service_time_minutes).filter(t => t > 0);
      const avgServiceTime = serviceTimes.length > 0
        ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
        : 5; // Default 5 minutes if no history
      
      // Get active counters count
      db.get(
        'SELECT COUNT(*) as count FROM counters WHERE status = ?',
        ['active'],
        (err, counterRow) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Get waiting tokens count
          db.get(
            'SELECT COUNT(*) as count FROM tokens WHERE status = ?',
            ['waiting'],
            (err, waitingRow) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              const activeCounters = counterRow.count || 1;
              const waitingCount = waitingRow.count || 0;
              const estimatedMinutes = Math.ceil((waitingCount / activeCounters) * avgServiceTime);
              
              res.json({
                estimatedMinutes,
                waitingCount,
                activeCounters,
                avgServiceTime: Math.round(avgServiceTime * 10) / 10
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;

