const { getDb } = require('./database');

// Check and update token statuses based on time
const checkAndUpdateTokens = () => {
  const db = getDb();
  
  if (!db) {
    return;
  }

  // Step 1: Mark tokens as "serving" after 5 minutes of being called
  // Get all tokens that are called but not yet serving
  // Check if they've been called for 5 minutes or more
  db.all(
    `SELECT * FROM tokens 
     WHERE status = 'called' 
     AND called_at IS NOT NULL
     AND datetime(called_at, '+5 minutes') <= datetime('now')`,
    (err, calledTokens) => {
      if (err) {
        // Only log error if it's not a "table doesn't exist" error (which is expected during startup)
        if (err.code !== 'SQLITE_ERROR' || !err.message.includes('no such table')) {
          console.error('Error checking called tokens:', err);
        }
        return;
      }

      // Mark these tokens as serving
      calledTokens.forEach(token => {
        db.run(
          `UPDATE tokens SET status = 'serving' WHERE id = ?`,
          [token.id],
          (err) => {
            if (err) {
              console.error(`Error updating token ${token.id} to serving:`, err);
            } else {
              console.log(`Token #${token.token_number} automatically marked as serving (5 min wait completed)`);
              
              // Broadcast update
              if (global.broadcastQueueUpdate) {
                db.get('SELECT * FROM tokens WHERE id = ?', [token.id], (err, updatedToken) => {
                  if (!err && updatedToken) {
                    global.broadcastQueueUpdate({ type: 'token_serving', token: updatedToken });
                  }
                });
              }
            }
          }
        );
      });
    }
  );

  // Step 2: Mark tokens as "served" after 1 minute of serving (6 minutes total from called_at)
  // Get all tokens that are serving
  // Check if they've been called for 6 minutes or more (5 min wait + 1 min serving)
  db.all(
    `SELECT * FROM tokens 
     WHERE status = 'serving' 
     AND called_at IS NOT NULL
     AND datetime(called_at, '+6 minutes') <= datetime('now')`,
    (err, servingTokens) => {
      if (err) {
        // Only log error if it's not a "table doesn't exist" error (which is expected during startup)
        if (err.code !== 'SQLITE_ERROR' || !err.message.includes('no such table')) {
          console.error('Error checking serving tokens:', err);
        }
        return;
      }

      // Mark these tokens as served
      servingTokens.forEach(token => {
        db.run(
          `UPDATE tokens 
           SET status = 'served', served_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [token.id],
          (err) => {
            if (err) {
              console.error(`Error updating token ${token.id} to served:`, err);
            } else {
              console.log(`Token #${token.token_number} automatically marked as served (1 min serving completed)`);
              
              // Broadcast update
              if (global.broadcastQueueUpdate) {
                db.get('SELECT * FROM tokens WHERE id = ?', [token.id], (err, updatedToken) => {
                  if (!err && updatedToken) {
                    global.broadcastQueueUpdate({ type: 'token_served', token: updatedToken });
                  }
                });
              }
            }
          }
        );
      });
    }
  );
};

// Start the scheduler - check every 30 seconds
const startTokenScheduler = () => {
  console.log('Token scheduler started - checking every 30 seconds');
  
  // Run immediately on start
  checkAndUpdateTokens();
  
  // Then run every 30 seconds
  setInterval(checkAndUpdateTokens, 30000);
};

module.exports = { startTokenScheduler, checkAndUpdateTokens };

