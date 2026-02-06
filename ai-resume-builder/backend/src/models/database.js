const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'resume_builder.db');
let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      // Users table
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          address TEXT,
          phone_number TEXT,
          linkedin_profile TEXT,
          github_link TEXT,
          experience_years INTEGER DEFAULT 0,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Employment history table
      database.run(`
        CREATE TABLE IF NOT EXISTS employment_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          position TEXT NOT NULL,
          company TEXT NOT NULL,
          location TEXT,
          start_date TEXT,
          end_date TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Education table
      database.run(`
        CREATE TABLE IF NOT EXISTS education (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          degree TEXT NOT NULL,
          institution TEXT NOT NULL,
          location TEXT,
          graduation_date TEXT,
          gpa TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Certifications table
      database.run(`
        CREATE TABLE IF NOT EXISTS certifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          issuer TEXT,
          date_obtained TEXT,
          expiry_date TEXT,
          credential_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Skills table
      database.run(`
        CREATE TABLE IF NOT EXISTS skills (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          skill_name TEXT NOT NULL,
          proficiency_level TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Other/Additional info table
      database.run(`
        CREATE TABLE IF NOT EXISTS additional_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Applications/Job apply history table
      database.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          job_title TEXT,
          company_name TEXT,
          jd_link TEXT NOT NULL,
          jd_content TEXT,
          cv_doc_path TEXT,
          cv_pdf_path TEXT,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'generated',
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = { getDb, initDatabase, runQuery, getOne, getAll };
