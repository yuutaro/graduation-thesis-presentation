-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Scenarios table to store the actual data
CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept TEXT NOT NULL,
    metadata TEXT, -- Stores JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Artifact logs to track generated data mapping
CREATE TABLE IF NOT EXISTS artifact_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER,
    temp_id TEXT NOT NULL,
    real_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL
);

-- Vector search virtual table using sqlite-vec
-- We assume Google Gemini embeddings with 768 dimensions
-- The rowid in this table will correspond to the id in the scenarios table
CREATE VIRTUAL TABLE IF NOT EXISTS scenarios_vec USING vec0(
    embedding float[768]
);
