-- LogPlus Farma — Seed Data
-- Eseguire su Supabase Dashboard > SQL Editor DOPO schema.sql

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (id, email, nome, cognome, ruolo, telefono) VALUES
  ('admin-1', 'admin@logplus.it', 'Giuseppe', 'Mandurino', 'admin', NULL),
  ('brand-1', 'brand@cosmetica.it', 'Marco', 'Rossi', 'brand', NULL),
  ('merch-1', 'anna@logplus.it', 'Anna', 'Bianchi', 'merchandiser', '333-1234567'),
  ('merch-2', 'lucia@logplus.it', 'Lucia', 'Verdi', 'merchandiser', '339-7654321'),
  ('merch-3', 'sara@logplus.it', 'Sara', 'Neri', 'merchandiser', '347-1112233');

-- ============================================================
-- FARMACIE
-- ============================================================

INSERT INTO farmacie (id, nome, indirizzo, citta, provincia, cap, lat, lng, telefono, referente) VALUES
  -- Campania
  ('f1', 'Farmacia Centrale', 'Via Toledo 156', 'Napoli', 'NA', '80134', 40.8428, 14.2498, '081-5551234', 'Dr. Esposito'),
  ('f2', 'Farmacia San Carlo', 'Corso Umberto I 45', 'Napoli', 'NA', '80138', 40.8496, 14.2641, '081-5552345', 'Dr.ssa Russo'),
  ('f3', 'Farmacia Vomero', 'Via Scarlatti 89', 'Napoli', 'NA', '80129', 40.8503, 14.2322, '081-5553456', NULL),
  ('f4', 'Farmacia del Mare', 'Lungomare Caracciolo 12', 'Napoli', 'NA', '80122', 40.8300, 14.2350, '081-5554567', NULL),
  ('f5', 'Farmacia Salerno Centro', 'Corso Vittorio Emanuele 78', 'Salerno', 'SA', '84121', 40.6794, 14.7688, NULL, 'Dr. Adinolfi'),
  -- Lazio
  ('f6', 'Farmacia Piazza Navona', 'Via dei Coronari 22', 'Roma', 'RM', '00186', 41.8994, 12.4731, '06-5551234', NULL),
  ('f7', 'Farmacia Trastevere', 'Viale di Trastevere 100', 'Roma', 'RM', '00153', 41.8825, 12.4708, NULL, 'Dr.ssa Conti'),
  ('f8', 'Farmacia Prati', 'Via Cola di Rienzo 55', 'Roma', 'RM', '00192', 41.9084, 12.4620, NULL, NULL),
  ('f9', 'Farmacia EUR', 'Viale Europa 150', 'Roma', 'RM', '00144', 41.8312, 12.4680, NULL, NULL),
  ('f10', 'Farmacia Tuscolana', 'Via Tuscolana 320', 'Roma', 'RM', '00181', 41.8742, 12.5180, NULL, NULL),
  -- Lombardia
  ('f11', 'Farmacia Duomo', 'Via Torino 15', 'Milano', 'MI', '20123', 45.4628, 9.1830, '02-5551234', 'Dr. Colombo'),
  ('f12', 'Farmacia Brera', 'Via Brera 28', 'Milano', 'MI', '20121', 45.4720, 9.1871, NULL, NULL),
  ('f13', 'Farmacia Navigli', 'Ripa di Porta Ticinese 55', 'Milano', 'MI', '20143', 45.4492, 9.1760, NULL, NULL),
  ('f14', 'Farmacia Porta Garibaldi', 'Corso Como 10', 'Milano', 'MI', '20154', 45.4819, 9.1856, NULL, NULL),
  ('f15', 'Farmacia Bergamo Alta', 'Via Gombito 12', 'Bergamo', 'BG', '24129', 45.7037, 9.6622, NULL, NULL),
  -- Piemonte
  ('f16', 'Farmacia Po', 'Via Po 25', 'Torino', 'TO', '10124', 45.0676, 7.6941, NULL, 'Dr. Ferraris'),
  ('f17', 'Farmacia San Salvario', 'Via Madama Cristina 30', 'Torino', 'TO', '10125', 45.0546, 7.6780, NULL, NULL),
  -- Toscana
  ('f18', 'Farmacia Santa Maria Novella', 'Via della Scala 16', 'Firenze', 'FI', '50123', 43.7734, 11.2486, NULL, 'Dr.ssa Galli'),
  ('f19', 'Farmacia San Lorenzo', 'Via dei Ginori 38', 'Firenze', 'FI', '50129', 43.7756, 11.2539, NULL, NULL),
  ('f20', 'Farmacia Siena', 'Via di Citta 50', 'Siena', 'SI', '53100', 43.3188, 11.3308, NULL, NULL),
  -- Veneto
  ('f21', 'Farmacia San Marco', 'Calle Larga XXII Marzo 2399', 'Venezia', 'VE', '30124', 45.4336, 12.3387, NULL, NULL),
  ('f22', 'Farmacia Padova Centro', 'Via Roma 20', 'Padova', 'PD', '35122', 45.4064, 11.8768, NULL, NULL),
  -- Emilia Romagna
  ('f23', 'Farmacia Bologna Centro', 'Via Rizzoli 10', 'Bologna', 'BO', '40125', 44.4937, 11.3467, NULL, 'Dr. Barbieri'),
  ('f24', 'Farmacia Parma', 'Strada della Repubblica 45', 'Parma', 'PR', '43121', 44.8018, 10.3278, NULL, NULL),
  -- Puglia
  ('f25', 'Farmacia Bari Vecchia', 'Via Sparano 100', 'Bari', 'BA', '70121', 41.1259, 16.8700, NULL, 'Dr.ssa Lorusso'),
  ('f26', 'Farmacia Lecce', 'Via Trinchese 22', 'Lecce', 'LE', '73100', 40.3529, 18.1719, NULL, NULL),
  -- Sicilia
  ('f27', 'Farmacia Palermo Liberta', 'Via Liberta 150', 'Palermo', 'PA', '90143', 38.1271, 13.3475, '091-5551234', NULL),
  ('f28', 'Farmacia Catania Etna', 'Via Etnea 80', 'Catania', 'CT', '95131', 37.5079, 15.0869, NULL, NULL),
  -- Sardegna
  ('f29', 'Farmacia Cagliari Marina', 'Via Roma 75', 'Cagliari', 'CA', '09124', 39.2167, 9.1089, NULL, NULL),
  -- Liguria
  ('f30', 'Farmacia Genova Porto', 'Via XX Settembre 30', 'Genova', 'GE', '16121', 44.4093, 8.9337, NULL, 'Dr. Parodi');

-- ============================================================
-- ASSEGNAZIONI
-- ============================================================

INSERT INTO assegnazioni (farmacia_id, merchandiser_id) VALUES
  -- Anna (merch-1) - Campania + parte Lazio + Sud
  ('f1', 'merch-1'), ('f2', 'merch-1'), ('f3', 'merch-1'), ('f4', 'merch-1'),
  ('f5', 'merch-1'), ('f6', 'merch-1'), ('f7', 'merch-1'),
  ('f25', 'merch-1'), ('f26', 'merch-1'), ('f27', 'merch-1'), ('f28', 'merch-1'),
  -- Lucia (merch-2) - Nord
  ('f8', 'merch-2'), ('f9', 'merch-2'), ('f10', 'merch-2'),
  ('f11', 'merch-2'), ('f12', 'merch-2'), ('f13', 'merch-2'), ('f14', 'merch-2'),
  ('f15', 'merch-2'), ('f16', 'merch-2'), ('f17', 'merch-2'),
  -- Sara (merch-3) - Centro + resto
  ('f18', 'merch-3'), ('f19', 'merch-3'), ('f20', 'merch-3'),
  ('f21', 'merch-3'), ('f22', 'merch-3'), ('f23', 'merch-3'),
  ('f24', 'merch-3'), ('f29', 'merch-3'), ('f30', 'merch-3');

-- ============================================================
-- RILIEVI (dati demo)
-- ============================================================

INSERT INTO rilievi (id, farmacia_id, merchandiser_id, fase, profondita_scaffale, profondita_mensola, larghezza, altezza, num_scaffali, pezzi_ricevuti, montaggio_completo, prodotti_posizionati, foto, completata, data_completamento, ora_completamento, note) VALUES
  -- f1: tutte e 3 le fasi complete
  ('r1', 'f1', 'merch-1', 1, 35, 30, 80, 200, 5, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-15', '10:30', NULL),
  ('r2', 'f1', 'merch-1', 2, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, '{}', TRUE, '2026-02-18', '14:15', 'Plexiglass montato senza problemi, biadesivo tiene bene'),
  ('r3', 'f1', 'merch-1', 3, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, TRUE, '{}', TRUE, '2026-02-20', '11:00', 'Tutti i prodotti posizionati correttamente'),
  -- f2: fase 1 e 2 complete
  ('r4', 'f2', 'merch-1', 1, 30, 28, 90, 180, 4, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-16', '09:45', NULL),
  ('r5', 'f2', 'merch-1', 2, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, '{}', TRUE, '2026-02-19', '16:30', NULL),
  -- f3: solo fase 1
  ('r6', 'f3', 'merch-1', 1, 40, 35, 100, 210, 6, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-17', '11:20', NULL),
  -- f11: tutte complete
  ('r7', 'f11', 'merch-2', 1, 32, 30, 85, 195, 5, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-14', '10:00', NULL),
  ('r8', 'f11', 'merch-2', 2, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, '{}', TRUE, '2026-02-17', '15:30', NULL),
  ('r9', 'f11', 'merch-2', 3, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, TRUE, '{}', TRUE, '2026-02-21', '12:00', NULL),
  -- f18: fase 1 completa
  ('r10', 'f18', 'merch-3', 1, 38, 34, 75, 190, 4, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-18', '09:30', NULL),
  -- f23: tutte complete
  ('r11', 'f23', 'merch-3', 1, 36, 33, 95, 200, 5, FALSE, FALSE, FALSE, '{}', TRUE, '2026-02-13', '10:15', NULL),
  ('r12', 'f23', 'merch-3', 2, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, '{}', TRUE, '2026-02-16', '14:00', NULL),
  ('r13', 'f23', 'merch-3', 3, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, TRUE, '{}', TRUE, '2026-02-19', '11:45', NULL);
