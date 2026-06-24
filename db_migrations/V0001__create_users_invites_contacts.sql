CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nick TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invites (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  owner_nick TEXT NOT NULL,
  used_by_nick TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  owner_nick TEXT NOT NULL,
  contact_nick TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_nick, contact_nick)
);
