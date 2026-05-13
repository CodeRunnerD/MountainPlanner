/**
 * Full seed script for local Supabase development.
 * Clears existing data and inserts comprehensive mock data.
 * Run with: node scripts/seed-full.js
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
  envContent.split('\n').filter(l => l.includes('=')).map(l => {
    const idx = l.indexOf('=')
    return [l.slice(0, idx), l.slice(idx + 1)]
  })
)

const supabaseUrl = env.VITE_SUPABASE_URL.trim()
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY.trim()

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function clearData() {
  console.log('Clearing existing data...')
  await admin.from('summit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('transport_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('participant_equipment').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('trip_equipment_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('trip_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('route_skill_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('route_waypoints').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('medical_info').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('sensitive_data_vault').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('Data cleared.')
}

async function seed() {
  console.log('=== Full Seed Script ===')
  await clearData()

  // Get existing users
  const { data: { users } } = await admin.auth.admin.listUsers()
  const userMap = {}
  for (const u of users) {
    userMap[u.email] = u.id
  }

  const carlosId = userMap['carlos@example.com']
  const anaId = userMap['ana@example.com']
  const luisId = userMap['luis@example.com']
  const mariaId = userMap['maria@example.com']
  const diegoId = userMap['diego@example.com']

  console.log('Users:', { carlos: carlosId, ana: anaId, luis: luisId, maria: mariaId, diego: diegoId })

  // Update profiles with full info
  const profileUpdates = [
    { id: carlosId, display_name: 'Carlos Montaña', avatar_url: 'https://i.pravatar.cc/150?u=user-1', phone: '+57 300 123 4567', neighborhood: 'Chapinero', lat: 4.6483, lng: -74.0628 },
    { id: anaId, display_name: 'Ana Rios', avatar_url: 'https://i.pravatar.cc/150?u=user-2', phone: '+57 310 987 6543', neighborhood: 'Usaquén', lat: 4.7021, lng: -74.0308 },
    { id: luisId, display_name: 'Luis Peña', avatar_url: 'https://i.pravatar.cc/150?u=user-3', phone: '+57 320 555 8888', neighborhood: 'Suba', lat: 4.7436, lng: -74.0827 },
    { id: mariaId, display_name: 'María Torres', avatar_url: 'https://i.pravatar.cc/150?u=user-4', phone: '+57 315 444 2222', neighborhood: 'Teusaquillo', lat: 4.6243, lng: -74.0892 },
    { id: diegoId, display_name: 'Diego Herrera', avatar_url: 'https://i.pravatar.cc/150?u=user-5', phone: '+57 317 777 3333', neighborhood: 'Envigado', lat: 6.1676, lng: -75.5838 },
  ]

  for (const p of profileUpdates) {
    await admin.from('profiles').update(p).eq('id', p.id)
  }
  console.log('Profiles updated.')

  // Routes
  const { data: routes, error: routeErr } = await admin.from('routes').insert([
    {
      name: 'Cumbre del Nevado del Tolima',
      description: 'Ascenso técnico al Nevado del Tolima por la ruta tradicional. Requiere experiencia en hielo y nieve.',
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      story: 'El Nevado del Tolima es uno de los picos más icónicos de la Cordillera Central. Con 5.216 msnm, su cumbre nevada ha sido el objetivo de montañistas colombianos por décadas.\n\nLa ruta tradicional parte desde la Finca El Silencio en el departamento del Tolima. El primer día consiste en una caminata de aproximadamente 8 km hasta el campamento base a 4.100 msnm. El segundo día es el ataque a cumbre: se sale a las 2:00 AM para evitar los fuertes vientos de la tarde y alcanzar la cumbre al amanecer.\n\nEl recorrido incluye pasos por glaciar activo, por lo que es obligatorio el uso de crampones y piolet. La exposición en algunos tramos es considerable y se requiere manejo básico de cuerdas para los pasos más técnicos.',
      difficulty: 'expert',
      gpx_parsed: { distance: 28.5, elevation_gain: 2200, elevation_loss: 2200 },
      source_url: 'https://wikiloc.com/rutas-senderismo/nevado-del-tolima',
      created_by: carlosId,
    },
    {
      name: 'Laguna de Iguaque',
      description: 'Caminata cultural y ecológica por la laguna sagrada de Iguaque en el Parque Nacional de Iguaque.',
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      story: 'La laguna de Iguaque es considerada el ombligo del mundo en la mitología Muisca. Ubicada a 3.680 msnm en el Parque Nacional de Iguaque, esta ruta combina naturaleza, historia y espiritualidad.\n\nEl recorrido inicia en la entrada del parque y asciende gradualmente por un sendero bien marcado que atraviesa bosques de frailejón y páramo. A mitad de camino se encuentra la laguna Chiquita, un excelente punto para descansar antes del tramo final.\n\nLa llegada a la laguna de Iguaque ofrece un paisaje sobrecogedor: aguas cristalinas rodeadas de frailejones y montañas. Es una ruta accesible para principiantes en buena condición física.',
      difficulty: 'beginner',
      gpx_parsed: { distance: 14.2, elevation_gain: 800, elevation_loss: 800 },
      source_url: 'https://wikiloc.com/rutas-senderismo/laguna-de-iguaque',
      created_by: anaId,
    },
    {
      name: 'Pico de Loro',
      description: 'Clásica ruta del Pico de Loro en el Parque Nacional Natural Farallones de Cali. Vistas espectaculares del Valle del Cauca.',
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      story: 'El Pico de Loro, con 2.860 msnm, es uno de los cerros tutelares de Cali y una de las rutas más populares del suroccidente colombiano. Su nombre proviene de la forma del pico, que recuerda al pico de un loro.\n\nLa ruta inicia desde el sector de Peñas Blancas en el Pance. El sendero es exigente desde el inicio, con pendientes pronunciadas que demandan buena condición física. A medida que se asciende, el bosque húmedo tropical da paso a bosque de niebla.\n\nLa cumbre ofrece una vista panorámica 360 grados del Valle del Cauca: de un lado se ve Cali y Yumbo, del otro los Farallones y la Cordillera Occidental. Es una ruta de un solo día, ideal para quienes buscan un reto moderado con gran recompensa visual.',
      difficulty: 'intermediate',
      gpx_parsed: { distance: 18.0, elevation_gain: 1400, elevation_loss: 1400 },
      source_url: 'https://wikiloc.com/rutas-senderismo/pico-de-loro',
      created_by: carlosId,
    },
    {
      name: 'Cocuy Circuito Clásico',
      description: 'Circuito de 5 días por el Parque Nacional Natural El Cocuy. Incluye ascensos a Ritacuba Blanco y Pan de Azúcar.',
      cover_image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&q=80',
      story: 'El Parque Nacional Natural El Cocuy alberga el sistema glaciar más grande de Colombia después del Nevado de Santa Isabel. El circuito clásico es una travesía de 5 días que recorre los valles de Lagunillas, Cóncavo y la Sierra Nevada del Cocuy.\n\nEl primer día lleva desde la cabaña de Kanwara hasta el valle de Lagunillas. El segundo día asciende a Ritacuba Blanco (5.410 msnm), el pico más alto del parque. Los días siguientes incluyen el paso por el Paso de Bellavista, la laguna Grande de la Sierra y el Pan de Azúcar.\n\nEs una expedición que demanda excelente condición física, aclimatación previa y experiencia en acampada de altura. Los paisajes de páramo, glaciares y lagunas de color esmeralda hacen de este uno de los trekings más impresionantes de Sudamérica.',
      difficulty: 'advanced',
      gpx_parsed: { distance: 52.0, elevation_gain: 3500, elevation_loss: 3500 },
      source_url: 'https://wikiloc.com/rutas-senderismo/cocuy-circuito',
      created_by: anaId,
    },
  ]).select()

  if (routeErr) {
    console.error('Failed to create routes:', routeErr)
    return
  }

  console.log(`Created ${routes.length} routes`)

  const routeTolima = routes.find(r => r.name.includes('Tolima'))
  const routeIguaque = routes.find(r => r.name.includes('Iguaque'))
  const routePico = routes.find(r => r.name.includes('Pico de Loro'))
  const routeCocuy = routes.find(r => r.name.includes('Cocuy'))

  // Waypoints
  await admin.from('route_waypoints').insert([
    { route_id: routeTolima.id, name: 'Finca El Silencio', lat: 4.6583, lng: -75.3228, elevation: 3200, order_index: 0, type: 'start' },
    { route_id: routeTolima.id, name: 'Campamento Base', lat: 4.6601, lng: -75.3154, elevation: 4100, order_index: 1, type: 'waypoint' },
    { route_id: routeTolima.id, name: 'Cumbre Nevado del Tolima', lat: 4.6742, lng: -75.3247, elevation: 5215, order_index: 2, type: 'summit' },
    { route_id: routeTolima.id, name: 'Retorno Finca', lat: 4.6583, lng: -75.3228, elevation: 3200, order_index: 3, type: 'end' },
    { route_id: routeIguaque.id, name: 'Entrada Parque', lat: 5.4167, lng: -73.4500, elevation: 2800, order_index: 0, type: 'start' },
    { route_id: routeIguaque.id, name: 'Laguna de Iguaque', lat: 5.4234, lng: -73.4456, elevation: 3680, order_index: 1, type: 'summit' },
    { route_id: routeIguaque.id, name: 'Salida', lat: 5.4167, lng: -73.4500, elevation: 2800, order_index: 2, type: 'end' },
    { route_id: routePico.id, name: 'Base Farallones', lat: 3.4167, lng: -76.5333, elevation: 1800, order_index: 0, type: 'start' },
    { route_id: routePico.id, name: 'Pico de Loro', lat: 3.4256, lng: -76.5289, elevation: 2860, order_index: 1, type: 'summit' },
    { route_id: routePico.id, name: 'Retorno', lat: 3.4167, lng: -76.5333, elevation: 1800, order_index: 2, type: 'end' },
  ])
  console.log('Waypoints created.')

  // Skills
  await admin.from('route_skill_requirements').insert([
    { route_id: routeTolima.id, skill_tag: 'Manejo de cuerdas' },
    { route_id: routeTolima.id, skill_tag: 'Autodetención en hielo' },
    { route_id: routeTolima.id, skill_tag: 'Uso de crampones' },
    { route_id: routeTolima.id, skill_tag: 'Nivel físico avanzado' },
    { route_id: routeCocuy.id, skill_tag: 'Manejo de cuerdas' },
    { route_id: routeCocuy.id, skill_tag: 'Acampada de altura' },
    { route_id: routeCocuy.id, skill_tag: 'Nivel físico avanzado' },
    { route_id: routePico.id, skill_tag: 'Nivel físico intermedio' },
  ])
  console.log('Skills created.')

  // Trips
  const { data: trips, error: tripErr } = await admin.from('trips').insert([
    {
      route_id: routeTolima.id,
      organizer_id: carlosId,
      title: 'Ascenso Tolima — Enero 2026',
      meeting_point: 'Parqueadero Terminal Salitre, Bogotá',
      meeting_lat: 4.6473,
      meeting_lng: -74.0955,
      start_date: '2026-01-15T04:00:00Z',
      end_date: '2026-01-17T20:00:00Z',
      pace: 'medium',
      status: 'open',
      max_participants: 8,
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      story: 'Una aventura inolvidable al Nevado del Tolima. Partimos desde Ibagué a las 4:00 AM con el equipo completo. La primera jornada nos llevó a establecer el campamento base a 4,100 msnm. La noche fue fría pero despejada, con una vía láctea impresionante.\n\nEl segundo día iniciamos el ataque a cumbre a las 2:00 AM. Las condiciones de hielo eran perfectas y todos los participantes lograron llegar a la cumbre a las 7:30 AM. El glaciar se veía espectacular con la luz del amanecer.',
    },
    {
      route_id: routePico.id,
      organizer_id: anaId,
      title: 'Pico de Loro Weekend',
      meeting_point: 'Calle 5 # 10-20, Cali',
      meeting_lat: 3.4516,
      meeting_lng: -76.5319,
      start_date: '2025-12-20T06:00:00Z',
      end_date: '2025-12-21T18:00:00Z',
      pace: 'sport',
      status: 'completed',
      max_participants: 12,
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      story: 'El Pico de Loro nunca decepciona. Esta vez salimos desde Cali con un grupo de 8 personas. El ascenso fue rápido gracias al buen ritmo del grupo.\n\nEn la cumbre tuvimos una neblina matutina que se disipó justo al mediodía, regalándonos vistas panorámicas del Valle del Cauca. Bajamos por la tarde y celebramos con cervezas artesanales en Pance.',
    },
    {
      route_id: routeIguaque.id,
      organizer_id: carlosId,
      title: 'Iguaque Cultural Walk',
      meeting_point: 'Plaza de Bolívar, Villa de Leyva',
      meeting_lat: 5.6333,
      meeting_lng: -73.5333,
      start_date: '2026-02-08T07:00:00Z',
      end_date: '2026-02-08T16:00:00Z',
      pace: 'slow',
      status: 'draft',
      max_participants: 15,
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      story: 'Una caminata suave y cultural por los caminos de la laguna sagrada de Iguaque. Aprendimos sobre la mitología Muisca y la importancia ecológica de este ecosistema de páramo.',
    },
    {
      route_id: routeCocuy.id,
      organizer_id: anaId,
      title: 'Cocuy 5D — Carnavales 2026',
      meeting_point: 'Aeropuerto El Dorado, Bogotá',
      meeting_lat: 4.7014,
      meeting_lng: -74.1469,
      start_date: '2026-02-28T05:00:00Z',
      end_date: '2026-03-04T19:00:00Z',
      pace: 'medium',
      status: 'open',
      max_participants: 6,
      cover_image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&q=80',
      story: 'El circuito clásico del Cocuy es una experiencia de 5 días que todo montañista colombiano debe vivir. Incluye ascensos a Ritacuba Blanco y Pan de Azúcar.',
    },
    {
      route_id: routeIguaque.id,
      organizer_id: anaId,
      title: 'Iguaque al Amanecer',
      meeting_point: 'Villa de Leyva, Boyacá',
      meeting_lat: 5.6333,
      meeting_lng: -73.5333,
      start_date: '2025-11-15T05:00:00Z',
      end_date: '2025-11-15T14:00:00Z',
      pace: 'slow',
      status: 'completed',
      max_participants: 10,
      cover_image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
      story: 'Salida madrugadora para ver el amanecer desde la laguna de Iguaque. El paramo se tiñó de dorado y rosa mientras subíamos. Una experiencia mágica que recomendamos a todos.',
    },
  ]).select()

  if (tripErr) {
    console.error('Failed to create trips:', tripErr)
    return
  }

  console.log(`Created ${trips.length} trips`)

  const tripTolima = trips.find(t => t.title.includes('Tolima'))
  const tripPico = trips.find(t => t.title.includes('Pico de Loro'))
  const tripCocuy = trips.find(t => t.title.includes('Cocuy'))

  // Trip participants
  const { data: participants } = await admin.from('trip_participants').insert([
    { trip_id: tripTolima.id, profile_id: anaId, status: 'confirmed', needs_transport: false },
    { trip_id: tripTolima.id, profile_id: luisId, status: 'confirmed', needs_transport: true },
    { trip_id: tripTolima.id, profile_id: mariaId, status: 'pending', needs_transport: true },
    { trip_id: tripPico.id, profile_id: carlosId, status: 'confirmed', needs_transport: false },
    { trip_id: tripPico.id, profile_id: luisId, status: 'confirmed', needs_transport: true },
    { trip_id: tripPico.id, profile_id: diegoId, status: 'confirmed', needs_transport: true },
    { trip_id: tripCocuy.id, profile_id: carlosId, status: 'confirmed', needs_transport: false },
    { trip_id: tripCocuy.id, profile_id: luisId, status: 'pending', needs_transport: true },
  ]).select()

  console.log(`Created ${participants?.length ?? 0} participants`)

  // Equipment
  const { data: equipment } = await admin.from('trip_equipment_requirements').insert([
    { trip_id: tripTolima.id, item_name: 'Crampones', mandatory: true },
    { trip_id: tripTolima.id, item_name: 'Piolet', mandatory: true },
    { trip_id: tripTolima.id, item_name: 'Casco', mandatory: true },
    { trip_id: tripTolima.id, item_name: 'Gafas de sol UV400', mandatory: true },
    { trip_id: tripTolima.id, item_name: 'Botas de montaña', mandatory: true },
    { trip_id: tripTolima.id, item_name: 'Cuerda 60m', mandatory: false },
    { trip_id: tripPico.id, item_name: 'Botas de trekking', mandatory: true },
    { trip_id: tripPico.id, item_name: 'Ropa impermeable', mandatory: true },
    { trip_id: tripPico.id, item_name: 'Cantimplora 2L', mandatory: true },
  ]).select()

  console.log(`Created ${equipment?.length ?? 0} equipment items`)

  // Vehicles
  const { data: vehicles } = await admin.from('vehicles').insert([
    { owner_id: carlosId, trip_id: tripTolima.id, model: 'Toyota Land Cruiser Prado', capacity: 4, tags: ['4x4', 'Baúl amplio', 'Aire acondicionado'], is_confirmed: true },
    { owner_id: anaId, trip_id: tripTolima.id, model: 'Mitsubishi Montero Sport', capacity: 3, tags: ['4x4', 'Tracción doble'], is_confirmed: true },
  ]).select()

  console.log(`Created ${vehicles?.length ?? 0} vehicles`)

  // Transport assignments
  if (participants && vehicles) {
    await admin.from('transport_assignments').insert([
      { vehicle_id: vehicles[0].id, participant_id: participants[1].id, assigned_by: carlosId },
      { vehicle_id: vehicles[1].id, participant_id: participants[2].id, assigned_by: carlosId },
    ])
    console.log('Transport assignments created.')
  }

  // Medical info
  await admin.from('medical_info').insert([
    { profile_id: carlosId, blood_type: 'O+', allergies: ['Polen', 'Picadura de abeja'], medications: 'Ninguna', notes: 'Portador de EpiPen' },
    { profile_id: anaId, blood_type: 'A-', allergies: [], medications: 'Ninguna', notes: '' },
  ])
  console.log('Medical info created.')

  // Summit logs
  await admin.from('summit_log').insert([
    { profile_id: carlosId, trip_id: tripTolima.id, route_id: routeTolima.id, completed_at: '2026-01-16T11:30:00Z', notes: 'Condiciones perfectas. Sin viento en cumbre.' },
    { profile_id: anaId, trip_id: tripPico.id, route_id: routePico.id, completed_at: '2025-12-20T13:00:00Z', notes: 'Neblina en la mañana pero se despejó al mediodía.' },
  ])
  console.log('Summit logs created.')

  console.log('\n=== Seed complete! ===')
}

seed().catch(console.error)
