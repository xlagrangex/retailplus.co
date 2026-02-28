#!/usr/bin/env node

/**
 * Script per arricchire i dati delle farmacie con Google Places API (New)
 *
 * Uso: GOOGLE_PLACES_API_KEY=xxx node scripts/enrich-farmacie.mjs
 *
 * Oppure aggiungi GOOGLE_PLACES_API_KEY nel file .env
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file manually (no dependencies needed)
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch { /* .env file is optional */ }
}

loadEnv()

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!API_KEY) {
  console.error('ERROR: GOOGLE_PLACES_API_KEY non configurata.')
  console.error('Uso: GOOGLE_PLACES_API_KEY=xxx node scripts/enrich-farmacie.mjs')
  console.error('Oppure aggiungi GOOGLE_PLACES_API_KEY=xxx al file .env')
  process.exit(1)
}

// Paths
const DATA_PATH = join(__dirname, '..', 'src', 'data', 'farmacie-import.json')
const REPORT_PATH = join(__dirname, 'enrichment-report.json')

// Rate limiting config
const REQUESTS_PER_SECOND = 8 // Stay under Google's 10/s limit
const DELAY_MS = Math.ceil(1000 / REQUESTS_PER_SECOND)
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

// ─── Google Places API (New) ─────────────────────────────────────────────

async function searchPlace(query) {
  const url = 'https://places.googleapis.com/v1/places:searchText'

  const body = {
    textQuery: query,
    languageCode: 'it',
    regionCode: 'IT',
    maxResultCount: 1,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.addressComponents',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Places API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.places?.[0] || null
}

// ─── Parse address components ────────────────────────────────────────────

function extractAddressInfo(place) {
  if (!place) return null

  const result = {
    indirizzo: place.formattedAddress || '',
    lat: place.location?.latitude || 0,
    lng: place.location?.longitude || 0,
    cap: '',
    citta: '',
  }

  // Extract CAP and city from addressComponents
  if (place.addressComponents) {
    for (const comp of place.addressComponents) {
      const types = comp.types || []
      if (types.includes('postal_code')) {
        result.cap = comp.longText || comp.shortText || ''
      }
      if (types.includes('locality')) {
        result.citta = comp.longText || comp.shortText || ''
      }
      // Fallback: some Italian addresses use administrative_area_level_3 for city
      if (types.includes('administrative_area_level_3') && !result.citta) {
        result.citta = comp.longText || comp.shortText || ''
      }
    }
  }

  return result
}

// ─── Build search query ──────────────────────────────────────────────────

function buildQuery(farmacia) {
  const nome = farmacia.nome || ''
  const indirizzo = farmacia.indirizzo || ''
  const citta = farmacia.citta || ''
  const provincia = farmacia.provincia || ''

  // Clean up the name for better search results
  let cleanName = nome
    .replace(/\bS\.?N\.?C\.?\b/gi, '')
    .replace(/\bS\.?R\.?L\.?\b/gi, '')
    .replace(/\bS\.?A\.?S\.?\b/gi, '')
    .replace(/\bS\.?P\.?A\.?\b/gi, '')
    .replace(/\bDELL[A']?\b/gi, '')
    .replace(/\bDOTT\.?SSA?\b/gi, '')
    .replace(/\bDR\.?SSA?\b/gi, '')
    .replace(/\bD\.?SSA?\b/gi, '')
    .replace(/\s+&\s+C\.?/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Build query using all available fields for best geocoding accuracy
  const parts = [cleanName, 'farmacia']
  if (indirizzo) parts.push(indirizzo)
  if (citta) parts.push(citta)
  if (provincia && provincia !== '#N/A') parts.push(provincia)
  if (!citta && !indirizzo) parts.push('Italia')

  return parts.join(' ')
}

// ─── Sleep utility ───────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Main enrichment logic ───────────────────────────────────────────────

async function enrichFarmacie() {
  console.log('=== Enrichment Farmacie con Google Places API ===\n')

  // Load data
  const farmacie = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
  console.log(`Farmacie totali: ${farmacie.length}`)

  // Skip already enriched — new farmacie have default coords (41.9, 12.5)
  const isDefaultCoords = (f) => (f.lat === 0 && f.lng === 0) || (Math.abs(f.lat - 41.9) < 0.01 && Math.abs(f.lng - 12.5) < 0.01)
  const toEnrich = farmacie.filter(f => isDefaultCoords(f))
  const alreadyEnriched = farmacie.length - toEnrich.length

  if (alreadyEnriched > 0) {
    console.log(`Gia arricchite: ${alreadyEnriched} (saltate)`)
  }
  console.log(`Da arricchire: ${toEnrich.length}\n`)

  if (toEnrich.length === 0) {
    console.log('Tutte le farmacie sono gia arricchite!')
    return
  }

  // Stats
  const report = {
    timestamp: new Date().toISOString(),
    totale: farmacie.length,
    daArricchire: toEnrich.length,
    trovate: 0,
    nonTrovate: 0,
    errori: 0,
    dettagli: [],
  }

  let processed = 0

  for (const farmacia of toEnrich) {
    processed++
    const query = buildQuery(farmacia)

    let place = null
    let error = null
    let attempts = 0

    // Retry loop
    while (attempts < MAX_RETRIES) {
      attempts++
      try {
        place = await searchPlace(query)
        break // Success
      } catch (err) {
        error = err.message
        if (attempts < MAX_RETRIES) {
          console.warn(`  Retry ${attempts}/${MAX_RETRIES} per "${farmacia.nome}": ${error}`)
          await sleep(RETRY_DELAY_MS * attempts)
        }
      }
    }

    const info = extractAddressInfo(place)

    const detail = {
      id: farmacia.id,
      nome: farmacia.nome,
      query,
      found: !!info,
      error: error && !info ? error : null,
    }

    if (info) {
      // Only update lat/lng — keep indirizzo/cap/citta from Excel import
      farmacia.lat = info.lat
      farmacia.lng = info.lng
      // Fill indirizzo/cap/citta only if empty (not from Excel)
      if (!farmacia.indirizzo) farmacia.indirizzo = info.indirizzo
      if (!farmacia.cap) farmacia.cap = info.cap
      if (!farmacia.citta && info.citta) farmacia.citta = info.citta
      farmacia.note = 'Coordinate da Google Places API'

      detail.indirizzo = farmacia.indirizzo
      detail.lat = info.lat
      detail.lng = info.lng
      report.trovate++

      process.stdout.write(`\r[${processed}/${toEnrich.length}] OK: ${farmacia.nome.substring(0, 50).padEnd(50)}`)
    } else {
      farmacia.note = 'Da verificare manualmente - non trovata su Google Places'
      report.nonTrovate++

      if (error) {
        report.errori++
        console.log(`\n[${processed}/${toEnrich.length}] ERRORE: ${farmacia.nome} — ${error}`)
      } else {
        console.log(`\n[${processed}/${toEnrich.length}] NON TROVATA: ${farmacia.nome}`)
      }
    }

    report.dettagli.push(detail)

    // Rate limiting
    await sleep(DELAY_MS)

    // Save progress every 50 records (in case of interruption)
    if (processed % 50 === 0) {
      writeFileSync(DATA_PATH, JSON.stringify(farmacie, null, 2), 'utf-8')
      writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8')
      console.log(`\n  [Checkpoint] Salvate ${processed} farmacie`)
    }
  }

  // Final save
  writeFileSync(DATA_PATH, JSON.stringify(farmacie, null, 2), 'utf-8')
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8')

  // Summary
  console.log('\n\n=== RISULTATO ===')
  console.log(`Trovate:      ${report.trovate}/${report.daArricchire}`)
  console.log(`Non trovate:  ${report.nonTrovate}`)
  console.log(`Errori:       ${report.errori}`)
  console.log(`\nReport salvato in: ${REPORT_PATH}`)
  console.log(`Dati aggiornati in: ${DATA_PATH}`)
}

// Run
enrichFarmacie().catch(err => {
  console.error('\nErrore fatale:', err)
  process.exit(1)
})
