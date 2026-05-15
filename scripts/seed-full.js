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

  // Get or create users
  const { data: { users: existingUsers } } = await admin.auth.admin.listUsers()
  const userMap = {}
  for (const u of existingUsers) {
    userMap[u.email] = u.id
  }

  const seedUsers = [
    { email: 'carlos@example.com', password: 'password123', display_name: 'Carlos Montaña', role: 'organizer', approval_status: 'active' },
    { email: 'ana@example.com', password: 'password123', display_name: 'Ana Rios', role: 'expedition_lead', approval_status: 'active' },
    { email: 'luis@example.com', password: 'password123', display_name: 'Luis Peña', role: 'participant', approval_status: 'active' },
    { email: 'maria@example.com', password: 'password123', display_name: 'María Torres', role: 'participant', approval_status: 'active' },
    { email: 'diego@example.com', password: 'password123', display_name: 'Diego Herrera', role: 'participant', approval_status: 'active' },
  ]

  for (const u of seedUsers) {
    if (!userMap[u.email]) {
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
      userMap[u.email] = data.user.id
      console.log(`Created user: ${u.display_name}`)
    } else {
      console.log(`User already exists: ${u.email}`)
    }
  }

  const carlosId = userMap['carlos@example.com']
  const anaId = userMap['ana@example.com']
  const luisId = userMap['luis@example.com']
  const mariaId = userMap['maria@example.com']
  const diegoId = userMap['diego@example.com']

  console.log('Users:', { carlos: carlosId, ana: anaId, luis: luisId, maria: mariaId, diego: diegoId })

  // Update profiles with full info
  const profileUpdates = [
    { id: carlosId, display_name: 'Carlos Montaña', avatar_url: 'https://i.pravatar.cc/150?u=user-1', role: 'organizer',     approval_status: 'active', phone: '+593 99 123 4567', neighborhood: 'La Floresta', lat: -0.2053, lng: -78.4908 },
    { id: anaId, display_name: 'Ana Rios', avatar_url: 'https://i.pravatar.cc/150?u=user-2', role: 'expedition_lead',     approval_status: 'active', phone: '+593 98 987 6543', neighborhood: 'González Suárez', lat: -0.1984, lng: -78.4823 },
    { id: luisId, display_name: 'Luis Peña', avatar_url: 'https://i.pravatar.cc/150?u=user-3', role: 'participant',     approval_status: 'active', phone: '+593 99 555 8888', neighborhood: 'Cumbayá', lat: -0.2006, lng: -78.4406 },
    { id: mariaId, display_name: 'María Torres', avatar_url: 'https://i.pravatar.cc/150?u=user-4', role: 'participant',     approval_status: 'active', phone: '+593 98 444 2222', neighborhood: 'Iñaquito', lat: -0.1761, lng: -78.4850 },
    { id: diegoId, display_name: 'Diego Herrera', avatar_url: 'https://i.pravatar.cc/150?u=user-5', role: 'participant',     approval_status: 'active', phone: '+593 99 777 3333', neighborhood: 'Tumbaco', lat: -0.2206, lng: -78.4008 },
  ]

  for (const p of profileUpdates) {
    await admin.from('profiles').update(p).eq('id', p.id)
  }
  console.log('Profiles updated.')

  // Routes
  const { data: routes, error: routeErr } = await admin.from('routes').insert([
    {
      name: 'Cotopaxi - Ruta Normal José Ribas',
      description: 'Ascenso al volcán Cotopaxi (5,897 m), segunda cumbre más alta del Ecuador. Ruta clásica que parte desde el refugio José Ribas a 4,864 m.',
      cover_image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&q=80',
      story: 'El volcán Cotopaxi es el ícono del Ecuador y una de las montañas más altas del mundo activas. Con 5.897 msnm, su cumbre nevada ha atraído a montañistas de todo el mundo por más de un siglo.\n\nLa ruta normal parte desde el refugio José Ribas a 4.864 msnm. El ascenso comienza en la medianoche para evitar los fuertes vientos de la tarde y alcanzar la cumbre al amanecer. Los primeros kilómetros atraviesan campo de piedras volcánicas hasta alcanzar el glaciar aproximadamente a 5.000 msnm.\n\nUna vez en el hielo, el uso de crampones y piolet es obligatorio. La pendiente promedio es de 30-35 grados, con algunos tramos que llegan a 40 grados cerca de la cumbre. El cráter del Cotopaxi es impresionante: un ancho de 800 metros y una profundidad de más de 1.000 metros. Desde la cumbre se divisan los volcanes Antisana, Cayambe y Chimborazo en días despejados.',
      difficulty: 'advanced',
      gpx_parsed: { distance: 4, elevation_gain: 1033, elevation_loss: 1033 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/cotopaxi-ruta-normal',
      created_by: carlosId,
    },
    {
      name: 'Chimborazo - Ruta Whymper (Cumbre Máxima)',
      description: 'Ascenso al Chimborazo (6,263 m), el punto más alejado del centro de la Tierra. Ruta clásica Whymper desde el refugio Whymper.',
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      story: 'El Chimborazo es una montaña legendaria. Con 6.263 msnm, no es la más alta del mundo, pero gracias al abultamiento ecuatorial de la Tierra, su cumbre es el punto más alejado del centro del planeta, superando incluso al Everest.\n\nLa ruta Whymper, nombrada en honor al primer ascensionista Edward Whymper en 1880, parte desde el refugio Whymper a 5.000 msnm. El ascenso técnico atraviesa glaciar activo con grietas y seracs que exigen navegación cuidadosa.\n\nEl recorrido incluye una parada en el campo alto a 5.600 msnm antes del empuje final hacia las dos cumbres: Veintimilla (6.263 m) y Whymper (6.267 m). La altura extrema y la exposición hacen de este ascenso uno de los más desafiantes de Sudamérica. Solo alrededor del 50% de los intentos logran la cumbre debido a las condiciones meteorológicas impredecibles.',
      difficulty: 'expert',
      gpx_parsed: { distance: 8, elevation_gain: 1300, elevation_loss: 1300 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/chimborazo-ruta-whymper',
      created_by: anaId,
    },
    {
      name: 'Rucu Pichincha - Ruta Normal desde Quito',
      description: 'Ascenso al Rucu Pichincha (4,696 m), volcán activo visible desde Quito. Accesible desde la ciudad, ruta popular para aclimatación.',
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      story: 'El Rucu Pichincha es el guardián de Quito. Con 4.696 msnm, esta cumbre volcánica es visible desde casi cualquier punto de la capital ecuatoriana y es una de las rutas de aclimatación más populares del país.\n\nLa ruta normal utiliza el Teleférico de Quito, que parte desde 2.950 msnm y lleva a los caminantes hasta los 3.945 msnm en solo 20 minutos. Desde allí, el sendero asciende por una cresta herbosa con pendientes moderadas.\n\nA mitad de camino se cruza con la ruta hacia el Guagua Pichincha, el hermano gemelo del Rucu. El tramo final incluye una corta sección de trepada en roca (II grado) antes de alcanzar la cumbre. Desde arriba, la vista de Quito a 4.696 metros de altura es simplemente espectacular: una ciudad de 3 millones de habitantes extendida a tus pies, rodeada por la Cordillera de los Andes.',
      difficulty: 'intermediate',
      gpx_parsed: { distance: 8, elevation_gain: 800, elevation_loss: 800 },
      source_url: 'https://www.wikiloc.com/rutas-senderismo/rucu-pichincha',
      created_by: carlosId,
    },
    {
      name: 'Iliniza Norte - Ruta de la Arista',
      description: 'Ascenso al Iliniza Norte (5,126 m), excelente para entrenamiento antes de Cotopaxi o Chimborazo. Ruta técnica por arista.',
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      story: 'El Iliniza Norte es la montaña de entrenamiento por excelencia en Ecuador. Con 5.126 msnm, ofrece la combinación perfecta de altura, técnica y accesibilidad para quienes se preparan para el Cotopaxi o el Chimborazo.\n\nLa ruta de la arista parte desde el refugio Nuevos Horizontes a 4.268 msnm. Los primeros kilómetros atraviesan un campo de piedras volcánicas hasta llegar a "La Cueva", un refugio natural de roca a 4.700 msnm que marca el inicio de la parte técnica.\n\nDesde La Cueva, la ruta sigue una arista rocosa expuesta que exige el uso de manos y pies con cuidado. Hay pasos de trepada de hasta III grado. La arista ofrece exposición hacia ambos lados, con vistas impresionantes del Iliniza Sur (5.248 m) y los valles circundantes. La cumbre es una plataforma rocosa desde donde se divisan el Cotopaxi, el Antisana y el Cayambe en días claros.',
      difficulty: 'advanced',
      gpx_parsed: { distance: 6, elevation_gain: 900, elevation_loss: 900 },
      source_url: 'https://www.wikiloc.com/rutas-alpinismo/iliniza-norte',
      created_by: anaId,
    },
  ]).select()

  if (routeErr) {
    console.error('Failed to create routes:', routeErr)
    return
  }

  console.log(`Created ${routes.length} routes`)

  const routeCotopaxi = routes.find(r => r.name.includes('Cotopaxi'))
  const routeChimborazo = routes.find(r => r.name.includes('Chimborazo'))
  const routePichincha = routes.find(r => r.name.includes('Pichincha'))
  const routeIliniza = routes.find(r => r.name.includes('Iliniza'))

  // Waypoints
  await admin.from('route_waypoints').insert([
    { route_id: routeCotopaxi.id, name: 'Refugio José Ribas', lat: -0.6833, lng: -78.4386, elevation: 4864, order_index: 0, type: 'start' },
    { route_id: routeCotopaxi.id, name: 'Campamento de piedra', lat: -0.6767, lng: -78.4344, elevation: 5200, order_index: 1, type: 'waypoint' },
    { route_id: routeCotopaxi.id, name: 'Cumbre Cotopaxi', lat: -0.6838, lng: -78.4382, elevation: 5897, order_index: 2, type: 'summit' },
    { route_id: routeCotopaxi.id, name: 'Refugio José Ribas', lat: -0.6833, lng: -78.4386, elevation: 4864, order_index: 3, type: 'end' },

    { route_id: routeChimborazo.id, name: 'Refugio Whymper', lat: -1.4697, lng: -78.8175, elevation: 5000, order_index: 0, type: 'start' },
    { route_id: routeChimborazo.id, name: 'Campo alto', lat: -1.4667, lng: -78.8167, elevation: 5600, order_index: 1, type: 'waypoint' },
    { route_id: routeChimborazo.id, name: 'Cumbre Chimborazo (Veintimilla)', lat: -1.4692, lng: -78.8175, elevation: 6263, order_index: 2, type: 'summit' },
    { route_id: routeChimborazo.id, name: 'Cumbre Chimborazo (Whymper)', lat: -1.4694, lng: -78.8178, elevation: 6267, order_index: 3, type: 'summit' },
    { route_id: routeChimborazo.id, name: 'Refugio Whymper', lat: -1.4697, lng: -78.8175, elevation: 5000, order_index: 4, type: 'end' },

    { route_id: routePichincha.id, name: 'Estación Teleférico Quito', lat: -0.1876, lng: -78.5085, elevation: 3945, order_index: 0, type: 'start' },
    { route_id: routePichincha.id, name: 'Cruce de Guagua Pichincha', lat: -0.1756, lng: -78.5981, elevation: 4200, order_index: 1, type: 'waypoint' },
    { route_id: routePichincha.id, name: 'Cumbre Rucu Pichincha', lat: -0.1869, lng: -78.5708, elevation: 4696, order_index: 2, type: 'summit' },
    { route_id: routePichincha.id, name: 'Estación Teleférico Quito', lat: -0.1876, lng: -78.5085, elevation: 3945, order_index: 3, type: 'end' },

    { route_id: routeIliniza.id, name: 'Refugio Nuevos Horizontes', lat: -0.6594, lng: -78.7156, elevation: 4268, order_index: 0, type: 'start' },
    { route_id: routeIliniza.id, name: 'La Cueva', lat: -0.6589, lng: -78.7133, elevation: 4700, order_index: 1, type: 'waypoint' },
    { route_id: routeIliniza.id, name: 'Cumbre Iliniza Norte', lat: -0.6606, lng: -78.7142, elevation: 5126, order_index: 2, type: 'summit' },
    { route_id: routeIliniza.id, name: 'Refugio Nuevos Horizontes', lat: -0.6594, lng: -78.7156, elevation: 4268, order_index: 3, type: 'end' },
  ])
  console.log('Waypoints created.')

  // Skills
  await admin.from('route_skill_requirements').insert([
    { route_id: routeCotopaxi.id, skill_tag: 'Uso de crampones' },
    { route_id: routeCotopaxi.id, skill_tag: 'Manejo de piolet' },
    { route_id: routeCotopaxi.id, skill_tag: 'Aclimatación a gran altura' },
    { route_id: routeCotopaxi.id, skill_tag: 'Físico avanzado' },
    { route_id: routeChimborazo.id, skill_tag: 'Uso de crampones' },
    { route_id: routeChimborazo.id, skill_tag: 'Técnicas de autodetención' },
    { route_id: routeChimborazo.id, skill_tag: 'Manejo de piolet' },
    { route_id: routeChimborazo.id, skill_tag: 'Aclimatación extrema' },
    { route_id: routeChimborazo.id, skill_tag: 'Físico de élite' },
    { route_id: routePichincha.id, skill_tag: 'Trekking de altura' },
    { route_id: routePichincha.id, skill_tag: 'Aclimatación moderada' },
    { route_id: routePichincha.id, skill_tag: 'Físico intermedio' },
    { route_id: routeIliniza.id, skill_tag: 'Trekking técnico' },
    { route_id: routeIliniza.id, skill_tag: 'Uso de manos' },
    { route_id: routeIliniza.id, skill_tag: 'Aclimatación a gran altura' },
    { route_id: routeIliniza.id, skill_tag: 'Físico avanzado' },
  ])
  console.log('Skills created.')

  // Trips
  const { data: trips, error: tripErr } = await admin.from('trips').insert([
    {
      route_id: routeCotopaxi.id,
      organizer_id: carlosId,
      title: 'Ascenso Cotopaxi — Enero 2026',
      meeting_point: 'Estacionamiento Teleférico Quito, Ecuador',
      meeting_lat: -0.1876,
      meeting_lng: -78.5085,
      start_date: '2026-01-15T04:00:00Z',
      end_date: '2026-01-17T20:00:00Z',
      pace: 'medium',
      status: 'open',
      max_participants: 8,
      cover_image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&q=80',
      story: 'Una aventura inolvidable al volcán Cotopaxi. Partimos desde Quito a las 4:00 AM con el equipo completo. La primera jornada nos llevó al refugio José Ribas a 4.864 msnm para aclimatación. La noche fue fría pero despejada, con una vía láctea impresionante sobre el cono perfecto del volcán.\n\nEl segundo día iniciamos el ataque a cumbre a la medianoche. Las condiciones de hielo eran perfectas y todos los participantes lograron llegar a la cumbre a las 7:30 AM. El cráter humeante se veía espectacular con la luz del amanecer y el Chimborazo asomaba en el horizonte.',
    },
    {
      route_id: routePichincha.id,
      organizer_id: anaId,
      title: 'Rucu Pichincha Weekend',
      meeting_point: 'Estación Teleférico Quito, Quito',
      meeting_lat: -0.1876,
      meeting_lng: -78.5085,
      start_date: '2025-12-20T06:00:00Z',
      end_date: '2025-12-21T18:00:00Z',
      pace: 'sport',
      status: 'completed',
      max_participants: 12,
      cover_image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
      story: 'El Rucu Pichincha nunca decepciona. Esta vez salimos desde el Teleférico de Quito con un grupo de 8 personas. El ascenso fue rápido gracias al buen ritmo del grupo y la aclimatación previa.\n\nEn la cumbre tuvimos una neblina matutina que se disipó justo al mediodía, regalándonos vistas panorámicas de Quito y los valles circundantes. Bajamos por la tarde y celebramos con cervezas artesanales en La Floresta.',
    },
    {
      route_id: routeIliniza.id,
      organizer_id: carlosId,
      title: 'Iliniza Norte - Entrenamiento de Arista',
      meeting_point: 'El Chaupi, Provincia de Cotopaxi',
      meeting_lat: -0.6719,
      meeting_lng: -78.7286,
      start_date: '2026-02-08T07:00:00Z',
      end_date: '2026-02-08T16:00:00Z',
      pace: 'slow',
      status: 'draft',
      max_participants: 15,
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      story: 'Una salida de entrenamiento perfecta para preparar el Cotopaxi. La arista del Iliniza Norte ofrece la combinación ideal de altura y técnica sin llegar al extremo del glaciar.\n\nEl grupo practicó movimientos en roca expuesta y navegación de arista. Desde la cumbre se veía el Cotopaxi completamente despejado, una vista que motivó a todos para la próxima expedición.',
    },
    {
      route_id: routeChimborazo.id,
      organizer_id: anaId,
      title: 'Chimborazo 5D — Carnavales 2026',
      meeting_point: 'Riobamba, Chimborazo',
      meeting_lat: -1.6716,
      meeting_lng: -78.6479,
      start_date: '2026-02-28T05:00:00Z',
      end_date: '2026-03-04T19:00:00Z',
      pace: 'medium',
      status: 'open',
      max_participants: 6,
      cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      story: 'El Chimborazo es el sueño de todo andinista ecuatoriano. Esta expedición de 5 días incluye días de aclimatación progresiva en el refugio Whymper y campo alto antes del intento de cumbre.\n\nLos participantes recorrerán los 1.300 metros de desnivel positivo desde el refugio hasta la cumbre máxima, pasando por la cumbre Veintimilla. El objetivo es alcanzar el punto más alejado del centro de la Tierra.',
    },
    {
      route_id: routePichincha.id,
      organizer_id: anaId,
      title: 'Rucu Pichincha al Amanecer',
      meeting_point: 'Teleférico de Quito, Quito',
      meeting_lat: -0.1876,
      meeting_lng: -78.5085,
      start_date: '2025-11-15T05:00:00Z',
      end_date: '2025-11-15T14:00:00Z',
      pace: 'slow',
      status: 'completed',
      max_participants: 10,
      cover_image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
      story: 'Salida madrugadora para ver el amanecer desde el Rucu Pichincha. El cielo de Quito se tiñó de dorado y rosa mientras subíamos por la arista. Desde la cumbre, la ciudad amanecía lentamente a nuestros pies.\n\nUna experiencia mágica que demuestra que no hace falta ir muy lejos para encontrar aventura: desde el centro de Quito hasta los 4.696 msnm en menos de 6 horas.',
    },
  ]).select()

  if (tripErr) {
    console.error('Failed to create trips:', tripErr)
    return
  }

  console.log(`Created ${trips.length} trips`)

  const tripCotopaxi = trips.find(t => t.title.includes('Cotopaxi'))
  const tripPichincha = trips.find(t => t.title.includes('Rucu Pichincha Weekend'))
  const tripChimborazo = trips.find(t => t.title.includes('Chimborazo'))

  // Trip participants
  const { data: participants } = await admin.from('trip_participants').insert([
    { trip_id: tripCotopaxi.id, profile_id: anaId, status: 'confirmed', needs_transport: false },
    { trip_id: tripCotopaxi.id, profile_id: luisId, status: 'confirmed', needs_transport: true },
    { trip_id: tripCotopaxi.id, profile_id: mariaId, status: 'pending', needs_transport: true },
    { trip_id: tripPichincha.id, profile_id: carlosId, status: 'confirmed', needs_transport: false },
    { trip_id: tripPichincha.id, profile_id: luisId, status: 'confirmed', needs_transport: true },
    { trip_id: tripPichincha.id, profile_id: diegoId, status: 'confirmed', needs_transport: true },
    { trip_id: tripChimborazo.id, profile_id: carlosId, status: 'confirmed', needs_transport: false },
    { trip_id: tripChimborazo.id, profile_id: luisId, status: 'pending', needs_transport: true },
  ]).select()

  console.log(`Created ${participants?.length ?? 0} participants`)

  // Equipment
  const { data: equipment } = await admin.from('trip_equipment_requirements').insert([
    { trip_id: tripCotopaxi.id, item_name: 'Crampones', mandatory: true },
    { trip_id: tripCotopaxi.id, item_name: 'Piolet', mandatory: true },
    { trip_id: tripCotopaxi.id, item_name: 'Casco', mandatory: true },
    { trip_id: tripCotopaxi.id, item_name: 'Gafas de sol UV400', mandatory: true },
    { trip_id: tripCotopaxi.id, item_name: 'Botas de montaña', mandatory: true },
    { trip_id: tripCotopaxi.id, item_name: 'Cuerda 60m', mandatory: false },
    { trip_id: tripPichincha.id, item_name: 'Botas de trekking', mandatory: true },
    { trip_id: tripPichincha.id, item_name: 'Ropa impermeable', mandatory: true },
    { trip_id: tripPichincha.id, item_name: 'Cantimplora 2L', mandatory: true },
  ]).select()

  console.log(`Created ${equipment?.length ?? 0} equipment items`)

  // Vehicles
  const { data: vehicles } = await admin.from('vehicles').insert([
    { owner_id: carlosId, trip_id: tripCotopaxi.id, model: 'Toyota Land Cruiser Prado', capacity: 4, tags: ['4x4', 'Baúl amplio', 'Aire acondicionado'], is_confirmed: true },
    { owner_id: anaId, trip_id: tripCotopaxi.id, model: 'Mitsubishi Montero Sport', capacity: 3, tags: ['4x4', 'Tracción doble'], is_confirmed: true },
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
    { profile_id: carlosId, trip_id: tripCotopaxi.id, route_id: routeCotopaxi.id, completed_at: '2026-01-16T11:30:00Z', notes: 'Condiciones perfectas. Sin viento en cumbre. Vista del Chimborazo.' },
    { profile_id: anaId, trip_id: tripPichincha.id, route_id: routePichincha.id, completed_at: '2025-12-20T13:00:00Z', notes: 'Neblina en la mañana pero se despejó al mediodía. Vista de Quito espectacular.' },
  ])
  console.log('Summit logs created.')

  console.log('\n=== Seed complete! ===')
}

seed().catch(console.error)
