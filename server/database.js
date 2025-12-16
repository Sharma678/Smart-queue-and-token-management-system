const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'queue.db');

let db;

const initDatabase = (callback) => {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      if (callback) callback(err);
    } else {
      console.log('Connected to SQLite database');
      createTables(callback);
    }
  });
};

const createTables = (callback) => {
  // Counters table
  db.run(`
    CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating counters table:', err);
      if (callback) callback(err);
      return;
    }

    // Tokens table
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_number INTEGER NOT NULL,
        counter_id INTEGER,
        status TEXT NOT NULL DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        called_at DATETIME,
        served_at DATETIME,
        FOREIGN KEY (counter_id) REFERENCES counters(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating tokens table:', err);
        if (callback) callback(err);
        return;
      }

      // Create index for faster queries
      db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status)`, (err) => {
        if (err) {
          console.error('Error creating status index:', err);
        }
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_counter ON tokens(counter_id)`, (err) => {
        if (err) {
          console.error('Error creating counter index:', err);
        }
      });

      // Insert default counter if none exists
      db.get('SELECT COUNT(*) as count FROM counters', (err, row) => {
        if (err) {
          console.error('Error checking counters:', err);
        } else if (row.count === 0) {
          db.run("INSERT INTO counters (name, status) VALUES ('Counter 1', 'active')", (err) => {
            if (err) {
              console.error('Error creating default counter:', err);
            } else {
              console.log('Default counter created');
            }
            // Call callback after all initialization is complete
            if (callback) callback(null);
          });
        } else {
          // Call callback after all initialization is complete
          if (callback) callback(null);
        }
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    initDatabase();
  }
  return db;
};

module.exports = { initDatabase, getDb };

