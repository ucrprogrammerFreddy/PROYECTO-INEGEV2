import { ClienteModel } from "../../Model/ClienteModel.js";

// Definimos la base de la URL para las peticiones a la API
const API_BASE = "https://localhost:7086/api";

// Variable global para lista de padecimientos
window.listaPadecimientos = [];

/**
 * Carga la lista de entrenadores desde la API y los agrega al combobox.
 * @param {Function|null} callback - Función opcional a ejecutar después de cargar los entrenadores.
 */
export function cargarEntrenadores(callback = null) {
  const $select = $("#entrenador");

  $.get(`${API_BASE}/Entrenador/listaEntrenador`, function (data) {
    $select
      .empty()
      .append(`<option value="">Seleccione un entrenador</option>`);
    const idsAgregados = new Set();

    data.forEach((ent) => {
      if (!idsAgregados.has(ent.idIdUsuario)) {
        $select.append(
          `<option value="${ent.idIdUsuario}">${ent.Nombre}</option>`
        );
        idsAgregados.add(ent.idIdUsuario);
      }
    });

    if (callback) callback();
  }).fail(function () {
    alert("Error al cargar entrenadores.");
  });
}

/**
 * Carga y muestra los padecimientos disponibles en forma de checkboxes + select de severidad.
 * @param {Array} padecimientosSeleccionados - IDs de padecimientos que deben aparecer seleccionados.
 * @param {Object} severidadesSeleccionadas - Diccionario idPadecimiento: severidad (opcional para edición)
 */
export function cargarPadecimientos(
  padecimientosSeleccionados = [],
  severidadesSeleccionadas = {}
) {
  $.get(`${API_BASE}/Padecimiento/listaPadecimientos`, function (data) {
    window.listaPadecimientos = data; // Guarda la lista globalmente para usar en historial

    const $container = $("#padecimientosList");
    $container.empty();

    data.forEach((p) => {
      const checked = padecimientosSeleccionados.includes(p.IdPadecimiento)
        ? "checked"
        : "";
      const severidad = severidadesSeleccionadas[p.IdPadecimiento] || "";

      const checkbox = `
        <div class="d-flex align-items-center mb-2 gap-2">
          <input class="form-check-input padecimiento-item" type="checkbox" value="${
            p.IdPadecimiento
          }" id="pad-${p.IdPadecimiento}" ${checked}>
          <label class="form-check-label me-2" for="pad-${p.IdPadecimiento}">${
        p.Nombre
      }</label>
          <select class="form-select form-select-sm severidad-padecimiento" data-padecimiento="${
            p.IdPadecimiento
          }" style="width: auto; display: ${
        checked ? "inline-block" : "none"
      };">
            <option value="">Severidad</option>
            <option value="Leve" ${
              severidad === "Leve" ? "selected" : ""
            }>Leve</option>
            <option value="Moderado" ${
              severidad === "Moderado" ? "selected" : ""
            }>Moderado</option>
            <option value="Grave" ${
              severidad === "Grave" ? "selected" : ""
            }>Grave</option>
          </select>
        </div>`;

      $container.append(checkbox);
    });

    // Mostrar/ocultar el select de severidad solo si el checkbox está seleccionado
    $container.find('input[type="checkbox"]').on("change", function () {
      const $select = $(this)
        .closest("div")
        .find("select.severidad-padecimiento");
      $select.toggle(this.checked);
      if (!this.checked) $select.val(""); // Limpia si se desmarca
    });
  }).fail(function () {
    alert("Error al cargar padecimientos.");
  });
}

/**
 * Registra un historial de padecimiento para cada padecimiento seleccionado del cliente.
 * Llama al endpoint '/PadecimientoHistorial/crearHistorialPadecimiento' por cada padecimiento.
 * @param {number} idCliente - ID del cliente.
 * @param {decimal} peso - Peso del cliente al momento de registro.
 * @param {Array} listaPadecimientos - Lista de objetos {IdPadecimiento, Severidad}.
 */
function registrarHistorialPadecimientosParaCliente(
  idCliente,
  peso,
  listaPadecimientos
) {
  if (!listaPadecimientos || listaPadecimientos.length === 0) return;

  listaPadecimientos.forEach((p) => {
    const nombrePadecimiento =
      window.listaPadecimientos.find(
        (x) => x.IdPadecimiento === p.IdPadecimiento
      )?.Nombre || "";

    $.ajax({
      url: `${API_BASE}/PadecimientoHistorial/crearHistorialPadecimiento`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        IdCliente: idCliente,
        IdPadecimiento: p.IdPadecimiento,
        NombrePadecimiento: nombrePadecimiento,
        Peso: peso,
        Severidad: p.Severidad,
      }),
      success: function () {
        // Opcional: mostrar "Historial registrado" o sumar a una lista de éxitos
      },
      error: function (xhr) {
        alert(
          "Error al registrar historial de padecimiento: " + xhr.responseText
        );
      },
    });
  });
}

/**
 * Registra un nuevo cliente. Si tiene padecimientos los asigna y guarda historial de padecimientos.
 */
export function registrarCliente() {
  let cliente;
  try {
    cliente = obtenerClienteDesdeFormulario("Crear");
  } catch (err) {
    // Ya se alertó el error
    return;
  }

  // Validación de email en backend
  $.ajax({
    url: `${API_BASE}/Cliente/CrearCliente`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(cliente),
    success: (res) => {
      const clienteId = res.IdUsuario;

      if (!clienteId || clienteId === 0) {
        alert("❌ No se obtuvo un ID válido del cliente.");
        return;
      }

      const peso = cliente.Peso || 0;
      const imc =
        cliente.Altura && cliente.Altura > 0
          ? (peso / (cliente.Altura * cliente.Altura)).toFixed(2)
          : 0;
      const padecimientos = cliente.PadecimientosCompletos || [];

      // Registrar historial de salud
      registrarHistorialSaludCompleto(
        clienteId,
        peso,
        imc,
        new Date().toISOString(),
        () => {
          // Solo después del historial, asigna los padecimientos y registra historial de padecimientos
          if (padecimientos.length > 0) {
            asignarPadecimientos(clienteId, padecimientos);
            registrarHistorialPadecimientosParaCliente(
              clienteId,
              peso,
              padecimientos
            );
          } else {
            alert("✅ Cliente registrado sin padecimientos");
            location.href = "ListaClientes.html";
          }
        }
      );
    },
    error: (xhr) => {
      if (xhr.status === 409) {
        alert(
          "❌ " + (xhr.responseJSON?.mensaje || "El correo ya está registrado.")
        );
      } else {
        alert("❌ Error al registrar cliente: " + xhr.responseText);
      }
    },
  });
}

/**
 * Carga la información de un cliente desde localStorage y la muestra en el formulario de edición.
 */
export function cargarClienteEditar() {
  // Recupera el cliente guardado en localStorage
  const cliente = JSON.parse(localStorage.getItem("clienteEditar"));
  if (!cliente) return;

  cargarEntrenadores(() => {
    $("#entrenador").val(
      cliente.Entrenador?.idIdUsuario ||
        cliente.EntrenadorId ||
        cliente.idIdUsuario
    );
  });

  $("#nombre").val(cliente.Nombre);
  $("#clave").val(cliente.Clave);
  $("#correo").val(cliente.Email);
  $("#telefono").val(cliente.Telefono);
  $("#fechaNacimiento").val(cliente.FechaNacimiento.split("T")[0]);
  $("#genero").val(cliente.Genero);
  $("#altura").val(cliente.Altura);
  $("#peso").val(cliente.Peso);

  if (cliente.PadecimientosClientes?.length > 0) {
    $("#padecimiento").prop("checked", true);
    $("#contenedorPadecimientos").show();
    const ids = cliente.PadecimientosClientes.map(
      (p) =>
        p.PadecimientoId || p.IdPadecimiento || p.Padecimiento?.IdPadecimiento
    );
    const severidades = {};
    cliente.PadecimientosClientes.forEach((p) => {
      const id =
        p.PadecimientoId || p.IdPadecimiento || p.Padecimiento?.IdPadecimiento;
      severidades[id] = p.Severidad || "";
    });
    cargarPadecimientos(ids, severidades);
  }

  $("#formularioEditar")
    .off("submit")
    .submit(function (e) {
      e.preventDefault();
      actualizarCliente(cliente.IdUsuario);
    });
}

/**
 * Actualiza la información de un cliente existente y sus padecimientos.
 * También guarda historial de padecimientos por cada padecimiento asignado.
 * @param {number} id - ID del cliente a actualizar.
 */
export function actualizarCliente(id) {
  const cliente = obtenerClienteDesdeFormulario("Editar");
  cliente.IdUsuario = id;

  $.ajax({
    url: `${API_BASE}/Cliente/editarCliente`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(cliente),
    success: () => {
      $.ajax({
        url: `${API_BASE}/AsignarPadecimientos/eliminarPadecimiento/${id}`,
        type: "DELETE",
        complete: () => {
          if (
            cliente.PadecimientosCompletos &&
            cliente.PadecimientosCompletos.length > 0
          ) {
            asignarPadecimientos(id, cliente.PadecimientosCompletos);
            registrarHistorialPadecimientosParaCliente(
              id,
              cliente.Peso,
              cliente.PadecimientosCompletos
            );
          } else {
            // Registrar historial "sin padecimientos" cuando se eliminan todos
            $.ajax({
              url: `${API_BASE}/PadecimientoHistorial/crearHistorialPadecimiento`,
              method: "POST",
              contentType: "application/json",
              data: JSON.stringify({
                IdCliente: id,
                IdPadecimiento: null,
                NombrePadecimiento: "Sin padecimientos",
                Peso: cliente.Peso || 0,
                Severidad: "",
              }),
              complete: function () {
                alert("✅ Cliente actualizado sin padecimientos");
                location.href = "ListaClientes.html";
              },
              error: function (xhr) {
                alert(
                  "❌ Error al registrar historial de padecimiento: " +
                    xhr.responseText
                );
              },
            });
          }
        },
        error: (xhr) => {
          alert(
            "❌ Error al eliminar padecimientos previos: " + xhr.responseText
          );
        },
      });
    },
    error: (xhr) => {
      if (xhr.status === 409) {
        alert(
          "❌ " + (xhr.responseJSON?.mensaje || "El correo ya está registrado.")
        );
      } else {
        alert("❌ Error al actualizar cliente: " + xhr.responseText);
      }
    },
  });
}

/**
 * Registra el historial de salud de un cliente.
 * IMPORTANTE: Usa el endpoint correcto '/HistorialSalud/crearHistorialSalud'
 * @param {number} idCliente
 * @param {number} peso
 * @param {number} imc
 * @param {string} fecha - Fecha en formato ISO
 * @param {function} callback - Se llama al finalizar exitosamente la petición
 */
function registrarHistorialSaludCompleto(
  idCliente,
  peso,
  imc,
  fecha = new Date().toISOString(),
  callback
) {
  $.ajax({
    url: `${API_BASE}/HistorialSalud/crearHistorialSalud`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      ClienteId: idCliente,
      Fecha: fecha,
      Peso: peso,
      IndiceMasaCorporal: imc || 0, // coincide con el modelo backend
    }),
    success: (res) => {
      if (callback) callback(res.IdHistorialSalud || res.idHistorialSalud);
    },
    error: (xhr, status, error) => {
      console.error(
        "Error al registrar historial de salud:",
        xhr.responseText || error
      );
      alert(
        "❌ No se pudo guardar el historial de salud. Detalle: " +
          (xhr.responseText || error)
      );
    },
  });
}

/**
 * Asigna los padecimientos seleccionados a un cliente usando el endpoint correcto.
 * @param {number} idCliente
 * @param {Array} padecimientosCompletos - Array de objetos {IdPadecimiento, Severidad}
 */
function asignarPadecimientos(idCliente, padecimientosCompletos) {
  if (!padecimientosCompletos || padecimientosCompletos.length === 0) return;

  const dto = {
    IdCliente: idCliente,
    Padecimientos: padecimientosCompletos.map((p) => ({
      IdPadecimiento: p.IdPadecimiento,
      Severidad: p.Severidad,
    })),
  };

  $.ajax({
    url: `${API_BASE}/AsignarPadecimientos/asignarPadecimientos`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dto),
    success: function () {
      alert("✅ Cliente y padecimientos asignados correctamente");
      location.href = "ListaClientes.html";
    },
    error: function (xhr) {
      alert("❌ Error al asignar padecimientos: " + xhr.responseText);
    },
  });
}

/**
 * Extrae los valores del formulario y los estructura como un objeto cliente.
 * @param {string} tipo - "Crear" o "Editar" para diferenciar el prefijo de los campos.
 * @returns {Object} Cliente estructurado para enviar al backend
 */
function obtenerClienteDesdeFormulario(tipo) {
  const padecimientosCompletos = [];

  function getCampo(id, isNumber = false, isFloat = false) {
    const val = $(`#${id}`).val();
    if (isNumber) {
      const num = isFloat ? parseFloat(val) : parseInt(val, 10);
      return isNaN(num) ? null : num;
    }
    return val ? val.trim() : "";
  }

  const entrenadorId = getCampo("entrenador", true);

  // Padecimientos y severidad
  $("#padecimientosList input:checked").each(function () {
    const idPadecimiento = parseInt(this.value, 10);
    const severidad = $(this)
      .closest("div")
      .find("select.severidad-padecimiento")
      .val();
    if (!isNaN(idPadecimiento) && severidad) {
      padecimientosCompletos.push({
        IdPadecimiento: idPadecimiento,
        Severidad: severidad,
      });
    }
  });

  // Fecha de nacimiento y validación
  let fechaNacStr = getCampo("fechaNacimiento").trim();
  if (!fechaNacStr) {
    alert("Debes ingresar la fecha de nacimiento.");
    throw new Error("Fecha de nacimiento vacía");
  }
  let fechaNacISO = fechaNacStr;
  const fechaNac = new Date(fechaNacISO);
  const hoy = new Date();
  if (isNaN(fechaNac.getTime()) || fechaNac > hoy) {
    alert("❌ La fecha de nacimiento no puede ser en el futuro o inválida.");
    throw new Error("Fecha de nacimiento inválida");
  }

  // Validación extra para campos requeridos
  const nombre = getCampo("nombre");
  const clave = getCampo("clave");
  const email = getCampo("correo");
  const genero = getCampo("genero");
  if (!nombre || !clave || !email || !genero) {
    alert(
      "Por favor, rellena todos los campos obligatorios (nombre, clave, correo, género)."
    );
    throw new Error("Campos requeridos vacíos");
  }

  const cliente = {
    IdUsuario: tipo === "Crear" ? 0 : getCampo("idUsuario", true) || 0,
    Nombre: nombre,
    Clave: clave,
    Email: email,
    Telefono: getCampo("telefono"),
    FechaNacimiento: fechaNacISO,
    Genero: genero,
    Altura: getCampo("altura", true, true) || 0,
    Peso: getCampo("peso", true, true) || 0,
    EstadoPago: true,
    EntrenadorId: entrenadorId || 0,
    Padecimientos: padecimientosCompletos.map((p) => p.IdPadecimiento),
    PadecimientosCompletos: padecimientosCompletos, // para asignar con severidad
  };

  return cliente;
}

/**
 * Lista todos los clientes en la tabla HTML.
 */
export function listarClientes() {
  $.get(`${API_BASE}/Cliente/listaClientes`, function (data) {
    const tbody = $("#cliente-tbody");
    tbody.empty();

    data.forEach((c) => {
      // Padecimientos es ya un array de nombres
      const padecimientos = c.Padecimientos && c.Padecimientos.length > 0
        ? c.Padecimientos.join(", ")
        : "-";

      // Construir la fila
      const fila = `
        <tr>
            <td>${c.Nombre}</td>
            <td>${c.Email}</td>
            <td>${c.Telefono}</td>
            <td>${c.Altura}</td>
            <td>${c.Peso}</td>
            <td>${c.NombreEntrenador}</td>
            <td>${c.EstadoPago}</td>
            <td>${padecimientos}</td>
            <td>
                <button class='btn btn-sm btn-primary' onclick='editarCliente(${JSON.stringify(
                  c
                ).replace(/"/g, "&quot;")})'>Editar</button>
                <button class='btn btn-sm btn-danger' onclick='eliminarCliente(${c.IdUsuario})'>Eliminar</button>
            </td>
        </tr>`;
      tbody.append(fila);
    });
  });
}


/**
 * Función global para editar un cliente.
 * Almacena el cliente en localStorage y redirige a la página de edición.
 */
window.editarCliente = function (cliente) {
  localStorage.setItem("clienteEditar", JSON.stringify(cliente));
  window.location.href = "EditarCliente.html";
};

/**
 * Función global para eliminar un cliente.
 * Pide confirmación antes de eliminar y actualiza la lista.
 */
window.eliminarCliente = function (id) {
  if (!confirm("¿Deseas eliminar este cliente?")) return;
  $.ajax({
    url: `${API_BASE}/Cliente/eliminarCliente/${id}`,
    method: "DELETE",
    success: () => {
      alert("Cliente eliminado correctamente");
      listarClientes();
    },
    error: () => alert("Error al eliminar cliente"),
  });
};
