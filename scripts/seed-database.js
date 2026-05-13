/**
 * Seed script for local Supabase development.
 * Run with: node scripts/seed-database.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envPath = join(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('='))
)

const supabaseUrl = env.VITE_SUPABASE_URL.trim()
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY.trim()

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const users = [
  { email: 'carlos@example.com', password: 'password123', display_name: 'Carlos Montaña', role: 'organizer', neighborhood: 'Chapinero' },
  { email: 'ana@example.com', password: 'password123', display_name: 'Ana Rios', role: 'guide', neighborhood: 'Usaquén' },
  { email: 'luis@example.com', password: 'password123', display_name: 'Luis Peña', role: 'participant', neighborhood: 'Suba' },
  { email: 'maria@example.com', password: 'password123', display_name: 'María Torres', role: 'participant', neighborhood: 'Teusaquillo' },
  { email: 'diego@example.com', password: 'password123', display_name: 'Diego Herrera', role: 'participant', neighborhood: 'Envigado' },
]

async function seed() {
  console.log('Seeding local database...')

  // Create auth users (triggers auto-create profile)
  const createdUsers = []
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        display_name: u.display_name,
        role: u.role,
      }
    })
    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message)
      continue
    }
    createdUsers.push({ ...u, id: data.user.id })
    console.log(`Created user: ${u.display_name} (${data.user.id})`)
  }

  const profileIds = createdUsers.map(u => u.id)

  // Update profiles with extra fields
  for (const u of createdUsers) {
    await admin.from('profiles').update({
      neighborhood: u.neighborhood,
      phone: '+57 300 000 0000',
    }).eq('id', u.id)
  }

  // Create routes
  const { data: routes, error: routeErr } = await admin.from('routes').insert([
    {
      name: 'Cumbre del Nevado del Tolima',
      description: 'Ascenso técnico al Nevado del Tolima por la ruta tradicional. Requiere experiencia en hielo y nieve.',
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      difficulty: 'expert',
      gpx_parsed: { distance: 28.5, elevation_gain: 2200, elevation_loss: 2200 },
      source_url: 'https://wikiloc.com/rutas-senderismo/nevado-del-tolima',
      created_by: profileIds[0],
    },
    {
      name: 'Laguna de Iguaque',
      description: 'Caminata cultural y ecológica por la laguna sagrada de Iguaque.',
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      difficulty: 'beginner',
      gpx_parsed: { distance: 14.2, elevation_gain: 800, elevation_loss: 800 },
      source_url: 'https://wikiloc.com/rutas-senderismo/laguna-de-iguaque',
      created_by: profileIds[1],
    },
    {
      name: 'Pico de Loro',
      description: 'Clásica ruta del Pico de Loro en el Parque Nacional Natural Farallones de Cali.',
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      difficulty: 'intermediate',
      gpx_parsed: { distance: 18.0, elevation_gain: 1400, elevation_loss: 1400 },
      source_url: 'https://wikiloc.com/rutas-senderismo/pico-de-loro',
      created_by: profileIds[0],
    },
    {
      name: 'Cocuy Circuito Clásico',
      description: 'Circuito de 5 días por el Parque Nacional Natural El Cocuy.',
      cover_image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&q=80',
      difficulty: 'advanced',
      gpx_parsed: { distance: 52.0, elevation_gain: 3500, elevation_loss: 3500 },
      source_url: 'https://wikiloc.com/rutas-senderismo/cocuy-circuito',
      created_by: profileIds[1],
    },
  ]).select()

  if (routeErr) {
    console.error('Failed to create routes:', routeErr)
    return
  }

  console.log(`Created ${routes.length} routes`)

  // Create waypoints, skills, trips, etc. can be added here as needed
  console.log('Seed complete!')
}

seed().catch(console.error)
