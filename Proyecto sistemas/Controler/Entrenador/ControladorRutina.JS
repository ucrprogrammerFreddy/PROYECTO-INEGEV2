// ===============================
// 🔗 APIs   CControladorRutina.Js
// ===============================
const API_BASE = "http://mi-api-powergym-2025.somee.com/api";

const API_CLIENTE = `${API_BASE}/Cliente`;
const API_PADECIMIENTO_CLIENTE = `${API_BASE}/AsignarPadecimientos`;
const API_PADECIMIENTO_GENERAL = `${API_BASE}/Padecimiento`;
const API_EJERCICIOS = `${API_BASE}/Ejercicio`;
const API_RUTINA = `${API_BASE}/Rutina`;
const API_IA_EJERCICIOS = `${API_BASE}/IAEjercicios`;
const API_EJERCICIO_RUTINA = `${API_BASE}/EjercicioRutina`;

// ===============================
// 🔄 Variables globales
// ===============================
let clienteSeleccionado = null;
let rutinaSugerida = [];
let rutinaYaGenerada = false;

window.listaPadecimientos = [];

// ===============================
// 🔄 Cargar lista global de padecimientos
// ===============================
$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, (data) => {
  window.listaPadecimientos = data;
});

// ===============================
// 🎯 FOCUS → cargar todos los clientes
// ===============================
$("#clienteBuscador").on("focus", function () {
  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const $lista = $("#listaResultados").empty();

    clientes.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} – ${c.Email}</li>`
      );
    });

    $lista.find("li").on("click", function () {
      seleccionarCliente($(this));
    });
  });
});

// 🔍 INPUT → filtrar clientes
$("#clienteBuscador").on("input", function () {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) {
    $("#listaResultados").empty();
    return;
  }

  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const filtrados = clientes.filter(
      (c) =>
        c.Nombre.toLowerCase().includes(texto) ||
        c.Email.toLowerCase().includes(texto)
    );

    const $lista = $("#listaResultados").empty();

    filtrados.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} – ${c.Email}</li>`
      );
    });

    $lista.find("li").on("click", function () {
      seleccionarCliente($(this));
    });
  });
});

// 🚀 BLUR → al salir del campo, ocultar lista
$("#clienteBuscador").on("blur", function () {
  setTimeout(() => {
    $("#listaResultados").empty();
  }, 200);
});

// ===============================
// ✅ Seleccionar cliente - CORREGIDO
// ===============================
function seleccionarCliente($li) {
  const id = $li.data("id");
  const nombre = $li.text();
  
  // 🚀 PRIMERO resetear TODO antes de cambiar cliente
  resetUI();
  
  clienteSeleccionado = parseInt(id);

  $("#nombreCliente").text(nombre);
  $("#infoCliente").show();
  $("#botonGenerarRutinaContainer").show();

  cargarInfoCliente(id);

  $("#listaResultados").empty();
  $("#clienteBuscador").val("");
  
  console.log("✅ Cliente seleccionado:", nombre, "ID:", clienteSeleccionado);
}

// ===============================
// 📋 CARGAR INFO CLIENTE
// ===============================
function cargarInfoCliente(clienteId) {
  $.get(`${API_CLIENTE}/obtenerClientePorId/${clienteId}`, (cliente) => {
    $("#clienteNombre").text(cliente.Nombre);
    $("#clientePeso").text(cliente.Peso + " kg");
    $("#clienteAltura").text(cliente.Altura + " cm");
    $("#clienteEntrenador").text(cliente.NombreEntrenador || "-");

    $.get(
      `${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`,
      (padecimientos) => {
        const lista = padecimientos
          .map((p) => {
            const nombre =
              (
                window.listaPadecimientos.find(
                  (x) => Number(x.IdPadecimiento) === Number(p.IdPadecimiento)
                ) || {}
              ).Nombre || `ID ${p.IdPadecimiento}`;
            return `${nombre} (${p.Severidad})`;
          })
          .join(", ");
        $("#clientePadecimientos").text(lista || "-");
      }
    );
  });
}

// ===============================
// 🚀 BOTÓN GENERAR RUTINA - CORREGIDO
// ===============================
$("#btnGenerarRutina").on("click", function () {
  if (!clienteSeleccionado) {
    alert("Primero selecciona un cliente.");
    return;
  }

  if (rutinaYaGenerada) {
    // Permitir regenerar rutina con confirmación
    if (!confirm("⚠️ Ya has generado una rutina para este cliente. ¿Quieres generar una nueva rutina?")) {
      return;
    }
    // Resetear para regenerar
    rutinaSugerida = [];
    rutinaYaGenerada = false;
    $("#rutinaGenerada").hide();
  }

  // 🚀 Bloquear botón
  $("#btnGenerarRutina").prop("disabled", true).text("Generando...");

  generarRutina(clienteSeleccionado);
});

// ===============================
// 📃 GENERAR RUTINA (IA) - CORREGIDO
// ===============================

function generarRutina(clienteId) {
  console.log("Generando rutina con IA para clienteId:", clienteId);

  const nombreCliente = $("#clienteNombre").text(); // CORREGIDO: usar clienteNombre

  // Mostrar spinner
  $("#spinnerIA").show();

  $.ajax({
    url: `${API_IA_EJERCICIOS}/recomendar`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      IdCliente: clienteId,
      NombreCliente: nombreCliente,
    }),
    timeout: 30000, // ⏱️ 30 segundos de espera máxima
    success(response) {
      console.log("✅ Respuesta IA:", response);
      rutinaSugerida = response.ejerciciosRecomendados || [];

      // Reactivar botón primero
      $("#btnGenerarRutina")
        .prop("disabled", false)
        .html('<i class="fas fa-dumbbell"></i> Generar Rutina');

      if (
        rutinaSugerida.length === 1 &&
        rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente"
      ) {
        alert("⚠️ Ningún ejercicio es apto para este cliente.");
        rutinaSugerida = [];
<<<<<<< Updated upstream
        rutinaYaGenerada = false;
      } else {
        rutinaYaGenerada = true;
        $("#rutinaGenerada").show();
        mostrarTablaRutina();
        
        // Scroll automático a la tabla
        $('html, body').animate({
          scrollTop: $("#rutinaGenerada").offset().top - 50
        }, 500);
=======
        $("#btnGenerarRutina")
          .prop("disabled", false)
          .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
        $("#spinnerIA").hide();
        return;
>>>>>>> Stashed changes
      }

      if (!rutinaSugerida.length) {
        alert("⚠️ No se recibieron ejercicios. Inténtalo de nuevo.");
        $("#btnGenerarRutina")
          .prop("disabled", false)
          .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
        $("#spinnerIA").hide();
        return;
      }

      rutinaYaGenerada = true;
      $("#rutinaGenerada").show();
      mostrarTablaRutina();
    },
    error(xhr, status) {
      console.error("❌ Error recomendando ejercicios:", status, xhr);
      alert("❌ Ocurrió un error al recomendar ejercicios. Intenta de nuevo más tarde.");
    },
    complete() {
      $("#spinnerIA").hide();
      $("#btnGenerarRutina")
        .prop("disabled", false)
        .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
    },
  });
}




// function generarRutina(clienteId) {
//   console.log("Generando rutina con IA para clienteId:", clienteId);

//   const nombreCliente = $("#nombreCliente").text();

//   $.ajax({
//     url: `${API_IA_EJERCICIOS}/recomendar`,
//     method: "POST",
//     contentType: "application/json",
//     data: JSON.stringify({
//       IdCliente: clienteId,
//       NombreCliente: nombreCliente,
//     }),
//     success(response) {
//       console.log("Respuesta IA:", response);
//       console.log("Ejercicios recomendados:", response.ejerciciosRecomendados);

//       rutinaSugerida = response.ejerciciosRecomendados || [];

//       if (
//         !rutinaSugerida.length ||
//         (rutinaSugerida.length === 1 &&
//           rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente")
//       ) {
//         alert("⚠️ Ningún ejercicio es apto para este cliente.");
//         rutinaSugerida = [];
//         $("#btnGenerarRutina")
//           .prop("disabled", false)
//           .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
//       } else {
//         rutinaYaGenerada = true;
//         $("#rutinaGenerada").show();
//         mostrarTablaRutina();
//       }
//     },
//     error(xhr) {
//       console.error(
//         "Error recomendando ejercicios:",
//         xhr.status,
//         xhr.responseText
//       );
//       alert(`❌ Error al recomendar ejercicios.\nStatus: ${xhr.status}`);

//       // Reactivar botón
//       $("#btnGenerarRutina")
//         .prop("disabled", false)
//         .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
//     },
//   });
// }

// ===============================
// 📃 MOSTRAR TABLA
// ===============================
function mostrarTablaRutina() {
  const $tbody = $("#tablaRutina tbody").empty();
  if (!rutinaSugerida.length) {
    $tbody.append(`
      <tr>
        <td colspan="9" class="text-center text-muted">
          No hay ejercicios en la rutina actual.
        </td>
      </tr>
    `);
    return;
  }

  rutinaSugerida.forEach((ej, index) => {
    const guia = ej.GuiaEjercicio
      ? `<a href="${escapeHtml(ej.GuiaEjercicio)}" target="_blank">Ver Guía</a>`
      : "Sin guía";

    $tbody.append(`
      <tr>
        <td>${escapeHtml(ej.Nombre)}</td>
        <td>${escapeHtml(ej.Descripcion)}</td>
        <td>${escapeHtml(ej.AreaMuscular)}</td>
        <td>${escapeHtml(ej.Dificultad)}</td>
        <td>${escapeHtml(ej.AreaAfectada)}</td>
        <td><input type="number" class="form-control reps-input" value="${
          ej.Repeticiones || 12
        }" min="1" data-index="${index}"></td>
        <td>${guia}</td>
        <td><input type="text" class="form-control comentario-input" placeholder="Comentario opcional" data-index="${index}"></td>
        <td class="text-center"><button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${index})"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
      </tr>
    `);
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function eliminarEjercicio(index) {
  rutinaSugerida.splice(index, 1);
  mostrarTablaRutina();
}




$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || !rutinaSugerida.length) {
    alert("Selecciona un cliente y asegúrate de que la rutina tenga ejercicios.");
    return;
  }

const dtoRutina = {

  FechaInicio: new Date().toISOString(),
  FechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
IdCliente: parseInt(clienteSeleccionado),
  Ejercicios: []
};


  console.log("Creando rutina:", dtoRutina);

  $.ajax({
    url: `${API_RUTINA}/crearRutina`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dtoRutina),
    success: function (rutinaCreada) {
      const idRutina = rutinaCreada.IdRutina || rutinaCreada.idRutina;
      console.log("✅ Rutina creada con ID:", idRutina);

      let errores = 0;

      rutinaSugerida.forEach((ej, idx) => {
        const reps = parseInt($(`[data-index="${idx}"].reps-input`).val()) || 0;
        const comentario = $(`[data-index="${idx}"].comentario-input`).val() || "";

        const dtoEj = {
          IdRutina: idRutina,
          IdEjercicio: ej.IdEjercicio,
          Comentario: comentario,
          NombreEjercicio: ej.Nombre,
          DescripcionEjercicio: ej.Descripcion,
          AreaMuscular: ej.AreaMuscular,
          AreaMuscularAfectada: ej.AreaAfectada,
          Repeticiones: reps,
          GuiaEjercicio: ej.GuiaEjercicio,
          Dificultad: ej.Dificultad
        };

        if (!ej.IdEjercicio) {
  console.warn("❌ El ejercicio no tiene IdEjercicio:", ej);
  errores++;
  return;
}



        $.ajax({
          url: `${API_EJERCICIO_RUTINA}/agregarEjercicioRutina`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(dtoEj),
          error: () => errores++
        });
      });

      setTimeout(() => {
        if (errores === 0) {
          alert("✅ Rutina y ejercicios guardados correctamente.");
        } else {
          alert(`⚠️ Rutina creada, pero fallaron ${errores} ejercicios.`);
        }
      }, 500);
    },
    error: function (xhr) {
      console.error("❌ Error creando rutina:", xhr.status, xhr.responseText);
      alert(`❌ Error al crear la rutina (status ${xhr.status}).`);
    }
  });
});




















// ===============================
// 💾 GUARDAR RUTINA - CORREGIDO CON REFRESH
// ===============================
$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || !rutinaSugerida.length) {
    alert("Selecciona un cliente y asegúrate de que la rutina tenga ejercicios.");
    return;
  }

  // Bloquear botón mientras guarda
  $("#guardarRutina").prop("disabled", true).text("Guardando...");

  const dtoRutina = {
    FechaInicio: new Date().toISOString(),
    FechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    IdCliente: parseInt(clienteSeleccionado),
    Ejercicios: []
  };

  console.log("Creando rutina:", dtoRutina);

  $.ajax({
    url: `${API_RUTINA}/crearRutina`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dtoRutina),
    success: function (rutinaCreada) {
      const idRutina = rutinaCreada.IdRutina || rutinaCreada.idRutina;
      console.log("✅ Rutina creada con ID:", idRutina);

      let ejerciciosGuardados = 0;
      let totalEjercicios = rutinaSugerida.length;

      rutinaSugerida.forEach((ej, idx) => {
        const reps = parseInt($(`[data-index="${idx}"].reps-input`).val()) || 0;
        const comentario = $(`[data-index="${idx}"].comentario-input`).val() || "";

        const dtoEj = {
          IdRutina: idRutina,
          IdEjercicio: ej.IdEjercicio,
          Comentario: comentario,
          NombreEjercicio: ej.Nombre,
          DescripcionEjercicio: ej.Descripcion,
          AreaMuscular: ej.AreaMuscular,
          AreaMuscularAfectada: ej.AreaAfectada,
          Repeticiones: reps,
          GuiaEjercicio: ej.GuiaEjercicio,
          Dificultad: ej.Dificultad
        };

        if (!ej.IdEjercicio) {
          console.warn("❌ El ejercicio no tiene IdEjercicio:", ej);
          totalEjercicios--;
          return;
        }

        $.ajax({
          url: `${API_EJERCICIO_RUTINA}/agregarEjercicioRutina`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(dtoEj),
          success: () => {
            ejerciciosGuardados++;
            
            // Cuando todos los ejercicios se han procesado
            if (ejerciciosGuardados === totalEjercicios) {
              alert("✅ Rutina y ejercicios guardados correctamente.");
              
              // 🔄 REFRESH COMPLETO DE LA VISTA
              refreshVista();
            }
          },
          error: () => {
            totalEjercicios--;
            
            // Si ya no quedan ejercicios por procesar
            if (ejerciciosGuardados === totalEjercicios) {
              alert(`⚠️ Rutina creada, pero algunos ejercicios fallaron.`);
              refreshVista();
            }
          }
        });
      });
    },
    error: function (xhr) {
      console.error("❌ Error creando rutina:", xhr.status, xhr.responseText);
      alert(`❌ Error al crear la rutina (status ${xhr.status}).`);
      
      // Reactivar botón
      $("#guardarRutina").prop("disabled", false).text("💾 Guardar Rutina");
    }
  });
});

// ===============================
// 🔄 FUNCIÓN refreshVista → limpia TODO y vuelve al inicio
// ===============================
function refreshVista() {
  // Resetear variables
  clienteSeleccionado = null;
  rutinaSugerida = [];
  rutinaYaGenerada = false;
  
  // Limpiar campos
  $("#clienteBuscador").val("");
  $("#listaResultados").empty();
  
  // Ocultar secciones
  $("#infoCliente").hide();
  $("#botonGenerarRutinaContainer").hide();
  $("#rutinaGenerada").hide();
  
  // Limpiar tabla
  $("#tablaRutina tbody").empty();
  
  // Reactivar botones
  $("#btnGenerarRutina")
    .prop("disabled", false)
    .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
    
  $("#guardarRutina")
    .prop("disabled", false)
    .html('<i class="fas fa-save"></i> Guardar Rutina');
  
  // Enfocar el buscador para nueva búsqueda
  $("#clienteBuscador").focus();
  
  console.log("🔄 Vista completamente refrescada");
}

// ===============================
// 🔄 FUNCIÓN resetUI → limpia rutina pero mantiene cliente
// ===============================
function resetUI() {
  rutinaSugerida = [];
  rutinaYaGenerada = false;
  $("#tablaRutina tbody").empty();
  $("#rutinaGenerada").hide();
  $("#btnGenerarRutina")
    .prop("disabled", false)
    .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
<<<<<<< Updated upstream
    
  $("#guardarRutina")
    .prop("disabled", false)
    .html('<i class="fas fa-save"></i> Guardar Rutina');
}
=======
}



// document.addEventListener("DOMContentLoaded", () => {
//   const idEntrenador = sessionStorage.getItem("idEntrenador");
//   if (!idEntrenador) {
//     alert("⚠️ Sesión expirada. Inicia sesión nuevamente.");
//     return;
//   }

//   fetch(`${API_RUTINA}/obtenerRutinasPorEntrenador/${idEntrenador}`)
//     .then((response) => {
//       if (!response.ok) throw new Error("❌ Error al cargar rutinas");
//       return response.json();
//     })
//     .then((rutinas) => {
//       const tbody = document.querySelector(".table-rutinas tbody");
//       tbody.innerHTML = "";

//       rutinas.forEach((rutina) => {
//         rutina.ejercicios.forEach((ej) => {
//           const fila = `
//             <tr>
//               <td>${sessionStorage.getItem("nombreEntrenador") || "-"}</td>
//               <td>${ej.nombreEjercicio}</td>
//               <td>${ej.areaMuscular}</td>
//               <td>#${rutina.idRutina}</td>
//               <td>${ej.descripcionEjercicio}</td>
//               <td>${ej.repeticiones}</td>
//               <td>
//                 <button class="btn btn-danger btn-sm">Eliminar</button>
//               </td>
//             </tr>
//           `;
//           tbody.insertAdjacentHTML("beforeend", fila);
//         });
//       });
//     })
//     .catch((err) => {
//       console.error(err);
//       alert("❌ No se pudieron cargar las rutinas.");
//     });
// });
>>>>>>> Stashed changes
