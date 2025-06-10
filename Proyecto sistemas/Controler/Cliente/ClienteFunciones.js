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
    // Primero obtener datos del cliente para conseguir el nombre del entrenador
    const datosCliente = await obtenerDatosCliente(clienteId);
    
    // Luego obtener las rutinas
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
    console.log('✅ Rutinas obtenidas:', rutinas);

    if (!rutinas || rutinas.length === 0) {
      mostrarSinRutinas();
      return;
    }

    // Enriquecer rutinas con el nombre del entrenador del cliente
    const rutinasConEntrenador = rutinas.map(rutina => ({
      ...rutina,
      NombreEntrenador: datosCliente?.NombreEntrenador || datosCliente?.NombreInstructor || 'Entrenador Asignado'
    }));

    console.log('✅ Rutinas enriquecidas con entrenador:', rutinasConEntrenador[0]);

    // Guardar rutinas en sessionStorage para usar en la página de detalle
    sessionStorage.setItem('rutinasCliente', JSON.stringify(rutinasConEntrenador));
    sessionStorage.setItem('datosCliente', JSON.stringify(datosCliente));

    // Mostrar rutinas en la tabla
    mostrarRutinas(rutinasConEntrenador);
    actualizarContadorRutinas(rutinasConEntrenador);

  } catch (error) {
    console.error('❌ Error al cargar rutinas:', error);
    mostrarError('No se pudieron cargar las rutinas. Verifique su conexión o contacte al administrador.');
  } finally {
    mostrarCargando(false);
  }
}

// 🔹 OBTENER DATOS DEL CLIENTE
async function obtenerDatosCliente(clienteId) {
  try {
    // Intentar diferentes endpoints posibles para obtener datos del cliente
    const endpointsPosibles = [
      `${API_BASE}/Cliente/obtenerClientePorId/${clienteId}`,
      `${API_BASE}/historialsalud/cliente/${clienteId}/estado-actual`,
      `${API_BASE}/Cliente/${clienteId}`,
      `${API_BASE}/Usuario/${clienteId}`
    ];

    for (const endpoint of endpointsPosibles) {
      try {
        console.log(`🔍 Intentando obtener datos del cliente desde: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Datos del cliente obtenidos:', data);
          console.log('🔍 ESTRUCTURA COMPLETA DEL CLIENTE:');
          console.log('Propiedades disponibles:', Object.keys(data));
          console.log('Datos completos:', JSON.stringify(data, null, 2));
          
          // Si el endpoint devuelve datos en formato {Cliente: {...}}, extraer el cliente
          let datosCliente = data.Cliente || data;
          
          // Si viene en el formato del historial de salud, usar los datos del cliente anidados
          if (data.Cliente && data.Cliente.NombreEntrenador) {
            datosCliente = data.Cliente;
            console.log('✅ Datos del cliente extraídos del historial:', datosCliente);
            return datosCliente;
          }
          
          // Si viene directamente el cliente con NombreEntrenador
          if (datosCliente.NombreEntrenador || datosCliente.EntrenadorId) {
            console.log('✅ Cliente encontrado con entrenador:', datosCliente);
            return datosCliente;
          }
          
          // Si es el endpoint principal y tiene datos básicos del cliente
          if (endpoint.includes('obtenerClientePorId') && datosCliente.Nombre) {
            console.log('✅ Datos básicos del cliente obtenidos:', datosCliente);
            return datosCliente;
          }
        }
      } catch (error) {
        console.log(`⚠️ No se pudo obtener cliente desde ${endpoint}:`, error.message);
      }
    }

    console.log('⚠️ No se pudo obtener información del cliente desde ningún endpoint');
    return null;

  } catch (error) {
    console.error('❌ Error al obtener datos del cliente:', error);
    return null;
  }
}

// 🔹 ENRIQUECER RUTINAS CON INFORMACIÓN DEL INSTRUCTOR
async function enriquecerRutinasConInstructor(rutinas) {
  // Intentar diferentes endpoints para obtener información del instructor
  const endpointsPosibles = [
    `${API_BASE}/Instructor/obtenerInstructorPorCliente/${sessionStorage.getItem("clienteId")}`,
    `${API_BASE}/Cliente/${sessionStorage.getItem("clienteId")}/instructor`,
    `${API_BASE}/Usuario/instructor/${sessionStorage.getItem("clienteId")}`
  ];

  for (const endpoint of endpointsPosibles) {
    try {
      console.log(`🔍 Intentando obtener instructor desde: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const instructorData = await response.json();
        console.log('✅ Datos del instructor obtenidos:', instructorData);
        
        // Enriquecer cada rutina con la información del instructor
        return rutinas.map(rutina => ({
          ...rutina,
          NombreInstructor: instructorData.Nombre || instructorData.NombreCompleto || instructorData.NombreInstructor || 'Instructor Asignado'
        }));
      }
    } catch (error) {
      console.log(`⚠️ No se pudo obtener instructor desde ${endpoint}:`, error.message);
    }
  }

  // Si no se pudo obtener el instructor, devolver rutinas originales
  console.log('⚠️ No se pudo obtener información del instructor desde ningún endpoint');
  return rutinas;
}

// 🔹 MOSTRAR RUTINAS EN LA TABLA (NO EJERCICIOS)
function mostrarRutinas(rutinas) {
  const tbody = document.getElementById('tablaRutinas');
  
  tbody.innerHTML = rutinas.map((rutina, index) => {
    const totalEjercicios = rutina.Ejercicios ? rutina.Ejercicios.length : 0;
    const musculosUnicos = obtenerMusculosUnicos(rutina.Ejercicios || []);
    const duracion = calcularDuracionRutina(rutina.FechaInicio, rutina.FechaFin);
    
    // Usar el nombre del entrenador que viene enriquecido desde los datos del cliente
    const nombreEntrenador = rutina.NombreEntrenador || 'Entrenador Asignado';
    
    return `
      <tr class="rutina-row" style="cursor: pointer;" onclick="abrirDetalleRutina(${rutina.IdRutina}, ${index + 1})">
        <td class="text-center">
          <span class="fw-bold">${nombreEntrenador}</span>
        </td>
        <td>
          <div>
            <span class="fw-bold text-primary">Rutina Completa #${index + 1}</span>
            <br>
            <small class="text-muted">${totalEjercicios} ejercicios incluidos</small>
          </div>
        </td>
        <td class="text-center">
          <small class="text-muted">${musculosUnicos}</small>
        </td>
        <td class="text-center">
          <span class="badge bg-primary fs-6"># ${index + 1}</span>
        </td>
        <td class="small">
          <div style="max-width: 200px;">
            <strong>Período:</strong><br>
            <i class="fas fa-calendar"></i> ${formatearFecha(rutina.FechaInicio)} - ${formatearFecha(rutina.FechaFin)}
            <br><strong>Duración:</strong> ${duracion}
            <br><strong>Ejercicios:</strong> ${totalEjercicios}
          </div>
        </td>
        <td class="text-center">
          <span class="fw-bold text-success fs-5">${totalEjercicios}</span>
          <br><small class="text-muted">ejercicios</small>
        </td>
        <td class="text-center">
          <button class="btn btn-ver-detalle" onclick="event.stopPropagation(); abrirDetalleRutina(${rutina.IdRutina}, ${index + 1})">
            <i class="fas fa-eye"></i> Ver Detalle
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Agregar efecto hover
  const filas = document.querySelectorAll('.rutina-row');
  filas.forEach(fila => {
    fila.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f8f9fa';
    });
    fila.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '';
    });
  });
}

// 🔹 OBTENER INSTRUCTOR DEL PRIMER EJERCICIO (si no viene en la rutina principal)
function obtenerInstructorDePrimerEjercicio(ejercicios) {
  if (!ejercicios || ejercicios.length === 0) return null;
  
  // Buscar en el primer ejercicio si tiene información del instructor
  const primerEjercicio = ejercicios[0];
  return primerEjercicio.NombreInstructor || 
         primerEjercicio.Instructor || 
         primerEjercicio.InstructorAsignado || 
         null;
}

// 🔹 FUNCIÓN PARA ABRIR DETALLE DE RUTINA
function abrirDetalleRutina(idRutina, numeroRutina) {
  // Guardar información de la rutina seleccionada
  sessionStorage.setItem('rutinaSeleccionadaId', idRutina);
  sessionStorage.setItem('rutinaSeleccionadaNumero', numeroRutina);
  
  // Redirigir a la página de detalle
  window.location.href = '/Proyecto sistemas/View/Cliente/DetalleRutina.html';
}

// 🔹 OBTENER MÚSCULOS ÚNICOS
function obtenerMusculosUnicos(ejercicios) {
  if (!ejercicios || ejercicios.length === 0) return 'Sin ejercicios';
  
  const musculos = [...new Set(ejercicios.map(ej => ej.AreaMuscular))];
  if (musculos.length <= 2) {
    return musculos.join(', ');
  }
  return `${musculos.slice(0, 2).join(', ')} +${musculos.length - 2}`;
}

// 🔹 CALCULAR DURACIÓN DE LA RUTINA
function calcularDuracionRutina(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferencia = fin - inicio;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  
  if (dias <= 7) return `${dias} día${dias !== 1 ? 's' : ''}`;
  if (dias <= 30) return `${Math.ceil(dias / 7)} semana${Math.ceil(dias / 7) !== 1 ? 's' : ''}`;
  return `${Math.ceil(dias / 30)} mes${Math.ceil(dias / 30) !== 1 ? 'es' : ''}`;
}

// 🔹 FORMATEAR FECHA
function formatearFecha(fechaISO) {
  const date = new Date(fechaISO);
  return date.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// 🔹 ACTUALIZAR CONTADOR DE RUTINAS
function actualizarContadorRutinas(rutinas) {
  const contador = document.getElementById('totalRutinas');
  if (contador) {
    const total = rutinas ? rutinas.length : 0;
    contador.textContent = `${total} rutina${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`;
    contador.className = total > 0 ? 'badge bg-success fs-6' : 'badge bg-secondary fs-6';
  }
}

// 🔹 MOSTRAR CUANDO NO HAY RUTINAS
function mostrarSinRutinas() {
  const tbody = document.getElementById('tablaRutinas');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted py-5">
        <i class="fas fa-dumbbell mb-3 fs-1"></i><br>
        <h5>No tienes rutinas asignadas</h5>
        <p>Contacta a tu instructor para que te asigne una rutina personalizada</p>
      </td>
    </tr>
  `;
  
  actualizarContadorRutinas([]);
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
          <h5 class="text-danger">Error al cargar</h5>
          <p class="mb-3">${mensaje}</p>
          <button class="btn btn-outline-primary" onclick="location.reload()">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      </td>
    </tr>
  `;

  const contador = document.getElementById('totalRutinas');
  if (contador) {
    contador.textContent = 'Error';
    contador.className = 'badge bg-danger fs-6';
  }
}