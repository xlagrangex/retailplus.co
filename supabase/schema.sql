-- LogPlus Farma — Schema DB
-- Eseguire su Supabase Dashboard > SQL Editor

-- ============================================================
-- TABELLE
-- ============================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('admin', 'brand', 'merchandiser')),
  telefono TEXT
);

CREATE TABLE farmacie (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  indirizzo TEXT NOT NULL,
  citta TEXT NOT NULL,
  provincia TEXT NOT NULL,
  cap TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  telefono TEXT,
  referente TEXT,
  email TEXT,
  note TEXT,
  planogramma_url TEXT
);

CREATE TABLE assegnazioni (
  farmacia_id TEXT REFERENCES farmacie(id) ON DELETE CASCADE,
  merchandiser_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (farmacia_id, merchandiser_id)
);

CREATE TABLE rilievi (
  id TEXT PRIMARY KEY,
  farmacia_id TEXT REFERENCES farmacie(id) ON DELETE CASCADE NOT NULL,
  merchandiser_id TEXT REFERENCES users(id) NOT NULL,
  fase INTEGER NOT NULL CHECK (fase IN (1, 2, 3)),
  -- Fase 1
  profondita_scaffale DOUBLE PRECISION,
  profondita_mensola DOUBLE PRECISION,
  larghezza DOUBLE PRECISION,
  altezza DOUBLE PRECISION,
  num_scaffali INTEGER,
  -- Fase 2
  pezzi_ricevuti BOOLEAN DEFAULT FALSE,
  montaggio_completo BOOLEAN DEFAULT FALSE,
  kit_ricevuto BOOLEAN DEFAULT FALSE,
  problema_kit BOOLEAN DEFAULT FALSE,
  descrizione_problema TEXT,
  foto_problema TEXT[],
  -- Fase 3
  prodotti_posizionati BOOLEAN DEFAULT FALSE,
  -- Comuni
  foto TEXT[] DEFAULT '{}',
  note TEXT,
  completata BOOLEAN DEFAULT FALSE,
  data_completamento DATE,
  ora_completamento TEXT,
  in_attesa_materiale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmacie ENABLE ROW LEVEL SECURITY;
ALTER TABLE assegnazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE rilievi ENABLE ROW LEVEL SECURITY;

-- Per la demo: accesso pubblico in lettura e scrittura (senza Supabase Auth)
-- In produzione si dovranno restringere le policy

CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on farmacie" ON farmacie FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on assegnazioni" ON assegnazioni FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rilievi" ON rilievi FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Creare manualmente dal Supabase Dashboard:
-- 1. Storage > New bucket > "photos" > Public
-- 2. Policy: allow all uploads/reads for demo
