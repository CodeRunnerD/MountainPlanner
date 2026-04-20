1. Gestión de Rutas y Perfiles Técnicos (supabase + react con tanstack , skills ux/ui pro)
Esta sección automatiza la carga de datos desde fuentes externas y define la dificultad.

Integración de Track (GPX/Wikiloc): Importación de archivos para extraer automáticamente:

Distancia total y desnivel positivo/negativo.

Perfil de elevación y puntos de paso (waypoints).

Ficha Técnica de Salida:

Requisitos de Habilidad: Tags obligatorios (ej. "Manejo de cuerdas", "Autodetención en hielo").

Checklist de Equipo: Listado interactivo (Crampones, piolet, arnés, etc.) que el participante debe marcar como "poseído" o "requiere alquiler".

Estimación de Tiempos: Cálculo basado en el ritmo del grupo (lento, medio, deportivo).

2. Registro y Seguridad de Participantes
Privacidad y control sobre quién va a la montaña.

Formulario de Inscripción Dinámico:

Bóveda de Datos Sensibles: Cifrado de extremo a extremo para Cédula/DNI, Pasaporte y Teléfono de Emergencia (solo accesible para el organizador en caso de incidente).

Ficha Médica Rápida: Alergias, tipo de sangre y seguros de montaña activos.

Gestión de Roles:

Organizador/Guía: Control total, edición de ruta y validación de pagos.

Participante: Visualización de info y carga de documentos.

🗺️ Módulo: Tablero de Logística y Transporte (Visual)
Este enfoque se basa en dar visibilidad a la ubicación de todos para que la coordinación sea natural.

1. El Mapa de Disponibilidad (Visualización)
En lugar de asignaciones automáticas, se despliega un mapa interactivo de la salida:

Pines de Ubicación: Se muestran pines en el mapa representando la zona general de cada participante (sin mostrar la dirección exacta por privacidad, solo el barrio o sector).

Pines Azules: Participantes que necesitan transporte.

Pines Verdes: Conductores con espacios disponibles.

Punto de Reunión Destacado: Un marcador especial (icono de bandera) que indica dónde debe converger todo el grupo.

2. Tarjetas de Vehículo (Estado de Ocupación)
Un panel lateral o inferior con tarjetas visuales de los autos confirmados:

Capacidad Visual: Un indicador tipo "batería" o iconos de asientos (ej. [👤][👤][ ][ ]) que muestra cuántos cupos ha declarado el conductor y cuántos están libres.

Etiquetas de Vehículo: "4x4", "Baúl amplio", "Parrilla para bicicletas", para que los pasajeros vean qué auto les conviene más.

3. Selección Manual de "Burbujas de Transporte"
Autogestión: El participante puede ver el mapa, identificar quién vive cerca y escribir: "Vi que estás por mi sector, ¿me puedes llevar?".

Registro Manual: El organizador o el conductor simplemente arrastran al participante a su "tarjeta de vehículo" en la app para marcar que ese cupo ya está ocupado.

Lista de "En Espera": Una columna visual con los avatares de las personas que aún no tienen transporte asignado, para que los conductores puedan ver quién falta.

4. Capa de Ruta Sugerida
Trazo de Referencia: El mapa puede mostrar una línea simple desde el sector del conductor hacia el punto de reunión para que el conductor vea visualmente a qué participantes "sin auto" le quedan de paso sin desviarse.

🚀 Complementos para este enfoque visual:
Filtro de Proximidad: Un botón que diga "Mostrar solo personas a menos de 5km de mi ubicación" para simplificar la vista del mapa.

Resumen Logístico: Un cuadro de texto simple que resuma: "3 autos disponibles, 12 personas registradas, 2 personas aún necesitan transporte".

Exportación de Lista: Poder generar una imagen o PDF rápido de la distribución de los autos para enviarla por el grupo de WhatsApp de la salida.

Logística y Comunicación
Gestión de Transporte: Sistema para organizar quién lleva auto y cuántos cupos ofrece, dividiendo gastos de combustible automáticamente.

Módulo de Clima Integrado: Conexión con APIs de montaña para mostrar el pronóstico en el punto más alto de la ruta 48 horas antes de la salida.
OPCIONAL
3. Automatización de Pagos (WhatsApp Bot Flow)
El puente entre la conversación y la base de datos.

Bot de Recepción de Comprobantes:

El usuario envía una foto del comprobante de transferencia al bot.

OCR (Reconocimiento de Texto): El bot extrae el nombre, número de transacción y monto.

Match de Lista: El bot busca el nombre en la lista de inscritos y cambia el estado de "Pendiente" a "Pagado" (con opción de validación manual rápida para el organizador).

Confirmación Automática: Envío de mensaje de "¡Cupo confirmado!" al participante.
Ideas Complementarias (El "Plus")
Gestión de Alquileres: Si el usuario marca que no tiene casco, la app genera una lista consolidada para que el organizador sepa qué equipo debe gestionar externamente.
Biblioteca de Documentos: Repositorio para reglamentos del club o deslindes de responsabilidad (firmas digitales simples).
Historial de Cumbre: Un "logbook" personal donde se guardan las salidas completadas por cada socio, lo que ayuda al organizador a validar si alguien tiene la experiencia necesaria para una ruta técnica.
Automatización de Pagos (WhatsApp Bot Flow)
El puente entre la conversación y la base de datos.

Bot de Recepción de Comprobantes:

El usuario envía una foto del comprobante de transferencia al bot.

OCR (Reconocimiento de Texto): El bot extrae el nombre, número de transacción y monto.

Match de Lista: El bot busca el nombre en la lista de inscritos y cambia el estado de "Pendiente" a "Pagado" (con opción de validación manual rápida para el organizador).

Confirmación Automática: Envío de mensaje de "¡Cupo confirmado!" al participante.

