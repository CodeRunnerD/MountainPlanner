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
  { email: 'carlos@example.com', password: 'password123', display_name: 'Carlos Montaña', role: 'organizer',     approval_status: 'active', neighborhood: 'La Floresta' },
  { email: 'ana@example.com', password: 'password123', display_name: 'Ana Rios', role: 'expedition_lead',     approval_status: 'active', neighborhood: 'González Suárez' },
  { email: 'luis@example.com', password: 'password123', display_name: 'Luis Peña', role: 'participant',     approval_status: 'active', neighborhood: 'Cumbayá' },
  { email: 'maria@example.com', password: 'password123', display_name: 'María Torres', role: 'participant',     approval_status: 'active', neighborhood: 'Iñaquito' },
  { email: 'diego@example.com', password: 'password123', display_name: 'Diego Herrera', role: 'participant',     approval_status: 'active', neighborhood: 'Tumbaco' },
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

  // Update profiles with extra fields and correct approval status
  for (const u of createdUsers) {
    await admin.from('profiles').update({
      neighborhood: u.neighborhood,
      phone: '+593 99 000 0000',
      approval_status: u.approval_status,
    }).eq('id', u.id)
  }

  // Create routes
  const { data: routes, error: routeErr } = await admin.from('routes').insert([
    {
      name: 'Cotopaxi - Ruta Normal José Ribas',
      description: 'Ascenso al volcán Cotopaxi (5,897 m), segunda cumbre más alta del Ecuador. Ruta clásica que parte desde el refugio José Ribas a 4,864 m.',
      cover_image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&q=80',
      difficulty: 'advanced',
      gpx_parsed: { distance: 4, elevation_gain: 1033, elevation_loss: 1033 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/cotopaxi-ruta-normal',
      created_by: profileIds[0],
    },
    {
      name: 'Chimborazo - Ruta Whymper (Cumbre Máxima)',
      description: 'Ascenso al Chimborazo (6,263 m), el punto más alejado del centro de la Tierra. Ruta clásica Whymper desde el refugio Whymper.',
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      difficulty: 'expert',
      gpx_parsed: { distance: 8, elevation_gain: 1300, elevation_loss: 1300 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/chimborazo-ruta-whymper',
      created_by: profileIds[1],
    },
    {
      name: 'Rucu Pichincha - Ruta Normal desde Quito',
      description: 'Ascenso al Rucu Pichincha (4,696 m), volcán activo visible desde Quito. Accesible desde la ciudad, ruta popular para aclimatación.',
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      difficulty: 'intermediate',
      gpx_parsed: { distance: 8, elevation_gain: 800, elevation_loss: 800 },
      source_url: 'https://www.wikiloc.com/rutas-senderismo/rucu-pichincha',
      created_by: profileIds[0],
    },
    {
      name: 'Iliniza Norte - Ruta de la Arista',
      description: 'Ascenso al Iliniza Norte (5,126 m), excelente para entrenamiento antes de Cotopaxi o Chimborazo. Ruta técnica por arista.',
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      difficulty: 'advanced',
      gpx_parsed: { distance: 6, elevation_gain: 900, elevation_loss: 900 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/iliniza-norte',
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
