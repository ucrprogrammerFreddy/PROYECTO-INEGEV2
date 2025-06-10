const API_BASE = "http://mi-api-powergym-2025.somee.com/api";

// ✅ Se ejecuta una sola vez al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  const clienteId = sessionStorage.getItem("clienteId");

  if (!clienteId) {
    alert("Cliente no identificado. Por favor, inicie sesión.");
    window.location.href = '/Proyecto sistemas/View/Cliente/Login.html';
    return;
  }

  console.log(`🔍 Cliente ID obtenido: ${clienteId}`);
  
  // Cargar rutinas del cliente
  cargarRutinasCliente(clienteId);
});

// 🔹 FUNCIÓN PARA CARGAR RUTINAS DEL CLIENTE
async function cargarRutinasCliente(clienteId) {
  // Mostrar indicador de carga
  mostrarCargando(true);

  try {
    const endpoint = `${API_BASE}/Rutina/obtenerRutinasPorCliente/${clienteId}`;
    console.log(`🔍 Llamando al endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`📡 Respuesta del servidor: ${response.status} - ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const rutinas = await response.json();
    console.log('✅ Rutinas básicas obtenidas:', rutinas);

    if (!rutinas || rutinas.length === 0) {
      mostrarRutinas([]);
      actualizarContadorRutinas([]);
      return;
    }

    // Procesar rutinas y expandir ejercicios
    const ejerciciosCompletos = procesarRutinasYEjercicios(rutinas);
    
    console.log('✅ Ejercicios procesados:', ejerciciosCompletos);
    mostrarRutinas(ejerciciosCompletos);
    actualizarContadorRutinas(ejerciciosCompletos);

  } catch (error) {
    console.error('❌ Error al cargar rutinas:', error);
    mostrarError('No se pudieron cargar las rutinas. Verifique su conexión o contacte al administrador.');
  } finally {
    mostrarCargando(false);
  }
}

// 🔹 PROCESAR RUTINAS Y EXTRAER EJERCICIOS
function procesarRutinasYEjercicios(rutinas) {
  const ejerciciosCompletos = [];
  
  rutinas.forEach((rutina, rutinaIndex) => {
    if (rutina.Ejercicios && rutina.Ejercicios.length > 0) {
      rutina.Ejercicios.forEach((ejercicio, ejercicioIndex) => {
        ejerciciosCompletos.push({
          // Información de la rutina
          IdRutina: rutina.IdRutina,
          FechaInicio: rutina.FechaInicio,
          FechaFin: rutina.FechaFin,
          NumeroRutina: rutinaIndex + 1,
          
          // Información del ejercicio
          IdEjercicio: ejercicio.IdEjercicio,
          NombreEjercicio: ejercicio.NombreEjercicio,
          DescripcionEjercicio: ejercicio.DescripcionEjercicio,
          AreaMuscular: ejercicio.AreaMuscular,
          AreaMuscularAfectada: ejercicio.AreaMuscularAfectada,
          Repeticiones: ejercicio.Repeticiones,
          VideoUrl: ejercicio.GuiaEjercicio,
          Dificultad: ejercicio.Dificultad,
          Comentario: ejercicio.Comentario,
          
          // Información adicional
          NombreInstructor: 'Asignado', // Por defecto, ya que no viene en la estructura
          NumeroEjercicioEnRutina: ejercicioIndex + 1
        });
      });
    }
  });
  
  return ejerciciosCompletos;
}

// 🔹 ACTUALIZAR CONTADOR DE RUTINAS
function actualizarContadorRutinas(ejercicios) {
  const contador = document.getElementById('totalRutinas');
  if (contador) {
    const total = ejercicios ? ejercicios.length : 0;
    contador.textContent = `${total} ejercicio${total !== 1 ? 's' : ''} asignado${total !== 1 ? 's' : ''}`;
    contador.className = total > 0 ? 'badge bg-success fs-6' : 'badge bg-secondary fs-6';
  }
}

// 🔹 MOSTRAR RUTINAS EN LA TABLA
function mostrarRutinas(ejercicios) {
  const tbody = document.getElementById('tablaRutinas');
  
  if (!ejercicios || ejercicios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          <i class="fas fa-dumbbell mb-2 fs-1"></i><br>
          <strong>No tienes rutinas asignadas actualmente</strong><br>
          <small>Contacta a tu instructor para que te asigne una rutina personalizada</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = ejercicios.map((ejercicio, index) => `
    <tr>
      <td class="text-center">
        <span class="fw-bold">${ejercicio.NombreInstructor || 'Asignado'}</span>
      </td>
      <td class="fw-bold text-primary">${ejercicio.NombreEjercicio || 'N/A'}</td>
      <td class="text-center">
        <span class="badge bg-primary">${ejercicio.AreaMuscular || 'General'}</span>
        ${ejercicio.AreaMuscularAfectada ? 
          `<br><small class="text-muted">${ejercicio.AreaMuscularAfectada}</small>` : 
          ''
        }
      </td>
      <td class="text-center">
        <span class="badge bg-secondary">#${ejercicio.NumeroRutina || (index + 1)}</span>
        ${ejercicio.Dificultad ? 
          `<br><span class="badge ${getDificultadColor(ejercicio.Dificultad)} mt-1">${ejercicio.Dificultad}</span>` : 
          ''
        }
      </td>
      <td class="small">
        <div style="max-width: 200px;">
          <strong>Descripción:</strong><br>
          ${ejercicio.DescripcionEjercicio || 'Sin descripción disponible'}
          ${ejercicio.Comentario ? 
            `<br><br><strong>Comentario:</strong><br><em>${ejercicio.Comentario}</em>` : 
            ''
          }
        </div>
      </td>
      <td class="text-center">
        <span class="fw-bold text-success fs-5">
          ${ejercicio.Repeticiones || 'N/A'}
        </span>
        <br><small class="text-muted">repeticiones</small>
      </td>
      <td class="text-center">
        ${ejercicio.VideoUrl ? 
          `<button class="btn btn-sm btn-outline-danger" onclick="verVideo('${ejercicio.VideoUrl}', '${ejercicio.NombreEjercicio}')">
            <i class="fab fa-youtube"></i> Ver Video
          </button>` : 
          `<span class="text-muted small">
            <i class="fas fa-video-slash"></i> Sin video
          </span>`
        }
      </td>
    </tr>
  `).join('');
}

// 🔹 OBTENER COLOR SEGÚN DIFICULTAD
function getDificultadColor(dificultad) {
  switch(dificultad?.toLowerCase()) {
    case 'baja': return 'bg-success';
    case 'media': return 'bg-warning';
    case 'alta': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

// 🔹 VER VIDEO EN MODAL
function verVideo(videoUrl, nombreEjercicio) {
  // Crear modal dinámicamente
  const modalHtml = `
    <div class="modal fade" id="videoModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fab fa-youtube text-danger"></i> 
              ${nombreEjercicio}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            <div class="ratio ratio-16x9">
              <iframe src="${convertirUrlYoutube(videoUrl)}" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen>
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remover modal anterior si existe
  const modalAnterior = document.getElementById('videoModal');
  if (modalAnterior) {
    modalAnterior.remove();
  }

  // Agregar nuevo modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('videoModal'));
  modal.show();
}

// 🔹 CONVERTIR URL DE YOUTUBE PARA EMBED
function convertirUrlYoutube(url) {
  if (!url) return '';
  
  // Si ya es una URL de embed, devolverla tal como está
  if (url.includes('embed')) return url;
  
  // Convertir URL normal de YouTube a embed
  let videoId = '';
  
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// 🔹 MOSTRAR/OCULTAR INDICADOR DE CARGA
function mostrarCargando(mostrar, mensaje = 'Cargando rutinas...') {
  const tbody = document.getElementById('tablaRutinas');
  
  if (mostrar) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2 mb-0 text-muted">${mensaje}</p>
        </td>
      </tr>
    `;
  }
}

// 🔹 MOSTRAR ERROR
function mostrarError(mensaje) {
  const tbody = document.getElementById('tablaRutinas');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4">
        <div class="text-danger">
          <i class="fas fa-exclamation-triangle fs-1 mb-2"></i>
          <p class="mb-0">${mensaje}</p>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      </td>
    </tr>
  `;

  // También actualizar el contador
  const contador = document.getElementById('totalRutinas');
  if (contador) {
    contador.textContent = 'Error';
    contador.className = 'badge bg-danger fs-6';
  }
}