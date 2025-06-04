const API_CLIENTE = "https://localhost:7086/api/Cliente";
const API_PADECIMIENTO_CLIENTE = "https://localhost:7086/api/AsignarPadecimientos";
const API_PADECIMIENTO_GENERAL = "https://localhost:7086/api/Padecimiento";
const API_EJERCICIOS = "https://localhost:7086/api/Ejercicio";
const API_RUTINA = "https://localhost:7086/api/Rutina";

let clienteSeleccionado = null;
let rutinaSugerida = [];

window.listaPadecimientos = [];

$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, (data) => {
  window.listaPadecimientos = data;
});

// 🔍 Buscar clientes
$("#clienteBuscador").on("input", function () {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) return;

  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const filtrados = clientes.filter((c) =>
      c.Nombre.toLowerCase().includes(texto) || c.Email.toLowerCase().includes(texto)
    );

    const $lista = $("#listaResultados");
    $lista.empty();
    filtrados.forEach((c) => {
      $lista.append(`<li data-id="${c.IdUsuario}">${c.Nombre} - ${c.Email}</li>`);
    });

    $lista.find("li").on("click", function () {
      const id = $(this).data("id");
      const nombre = $(this).text();
      clienteSeleccionado = id;
      $("#nombreCliente").text(nombre);
      $("#rutinaGenerada").show();
      $("#infoCliente").show();
      cargarInfoCliente(id);
      generarRutina(id);
      $lista.empty();
      $("#clienteBuscador").val("");
    });
  });
});

function cargarInfoCliente(clienteId) {
  $.get(`${API_CLIENTE}/obtenerClientePorId/${clienteId}`, (cliente) => {
    $("#clienteNombre").text(cliente.Nombre);
    $("#clientePeso").text(cliente.Peso + " kg");
    $("#clienteAltura").text(cliente.Altura + " cm");
    $("#clienteEntrenador").text(cliente.Entrenador?.Nombre || "-");

    $.get(`${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`, (padecimientos) => {
      const lista = padecimientos.map(p => {
        const nombre = (
          window.listaPadecimientos.find(
            x => Number(x.IdPadecimiento) === Number(p.IdPadecimiento)
          ) || {}
        ).Nombre || `ID ${p.IdPadecimiento}`;
        return `${nombre} (${p.Severidad})`;
      }).join(", ");

      $("#clientePadecimientos").text(lista || "-");
    });
  });
}

function generarRutina(clienteId) {
  console.log("Generando rutina para clienteId:", clienteId);

  Promise.all([
    $.get(`${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`),
    $.get(`${API_EJERCICIOS}/listaEjercicios`)
  ])
  .then(([padecimientos, ejercicios]) => {
    console.log("Padecimientos recibidos:", padecimientos);
    console.log("Ejercicios recibidos:", ejercicios);

    // Procesamos las zonas afectadas del cliente
    const zonasAfectadas = [];

    padecimientos.forEach(p => {
      const zonas = (p.areaMuscularAfectada || "").split(",").map(z => z.trim().toLowerCase());
      const severidad = (p.Severidad || "").toLowerCase();

      zonas.forEach(z => {
        if (z !== "") {
          zonasAfectadas.push({ zona: normalizarZona(z), severidad: severidad });
        }
      });
    });

    console.log("Zonas afectadas + severidad:", zonasAfectadas);

    // Crear un Set para evitar duplicados
    const ejerciciosUnicos = new Set();
    rutinaSugerida = ejercicios.filter(e => {
      const zonasEjercicio = (e.areaMuscularAfectada || "")
        .split(",")
        .map(z => normalizarZona(z))
        .filter(z => z !== "");

      console.log(`Ejercicio: ${e.Nombre}, ZonasEjercicio normalizadas:`, zonasEjercicio);

      const afectaZonaGrave = zonasEjercicio.some(zonaEj =>
        zonasAfectadas.some(p => p.zona === zonaEj && p.severidad === "grave")
      );

      console.log(`→ Afecta zona grave?`, afectaZonaGrave);

      // ✅ Si el ejercicio NO afecta zona grave Y NO está repetido → lo agregamos
      if (!afectaZonaGrave && !ejerciciosUnicos.has(e.idEjercicio)) {
        ejerciciosUnicos.add(e.idEjercicio);
        return true;
      }

      return false;
    });

    console.log("Rutina sugerida FINAL:", rutinaSugerida);

    mostrarTablaRutina();
  })
  .catch(err => {
    console.error("Error generando rutina:", err);
    alert("Ocurrió un error al generar la rutina.");
  });
}



function mostrarTablaRutina() {
  const $tbody = $("#tablaRutina tbody");
  $tbody.empty();

  rutinaSugerida.forEach((ej, index) => {
    $tbody.append(`
      <tr>
        <td>${ej.Nombre}</td>
        <td>${ej.AreaMuscular}</td>
        <td><input type="number" value="3" min="1" class="series-input" data-index="${index}"></td>
        <td><input type="number" value="12" min="1" class="reps-input" data-index="${index}"></td>
        <td><button onclick="eliminarEjercicio(${index})">Eliminar</button></td>
      </tr>
    `);
  });
}


function eliminarEjercicio(index) {
  rutinaSugerida.splice(index, 1);
  mostrarTablaRutina();
}

$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || rutinaSugerida.length === 0) {
    alert("Selecciona un cliente y asegúrate de que la rutina tenga ejercicios.");
    return;
  }

  const ejercicios = rutinaSugerida.map((ej, i) => {
    const $row = $("#tablaRutina tbody tr").eq(i);
    const series = parseInt($row.find(".series-input").val()) || 0;
    const repeticiones = parseInt($row.find(".reps-input").val()) || 0;

    return {
      idEjercicio: ej.idEjercicio,
      series: series,
      repeticiones: repeticiones
    };
  });

  const dto = {
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    idCliente: clienteSeleccionado,
    ejercicios: ejercicios
  };

  $.ajax({
    url: `${API_RUTINA}/crearRutinaCompleta`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dto),
    success: () => alert("✅ Rutina guardada correctamente"),
    error: () => alert("❌ Error al guardar rutina")
  });
});

// Diccionario de sinónimos / normalización
function normalizarZona(zona) {
  const mapa = {
    "hombros": "hombro",
    "hombro": "hombro",
    "rodillas": "rodilla",
    "rodilla": "rodilla",
    "piernas": "pierna",
    "pierna": "pierna",
    "pectoral": "pectoral",
    "pectorales": "pectoral",
    "abdomen": "abdomen",
    "abdominales": "abdomen",
    "espalda": "espalda",
    "columna": "columna",
    "columna vertebral": "columna",
    "columna lumbar": "columna",
    "hernia": "hernia",
    "hernia inguinal": "hernia",
    "cadera": "cadera",
    "cuello": "cuello",
    "muñecas": "muñeca",
    "muñeca": "muñeca",
    "brazos": "brazo",
    "brazo": "brazo",
    "pantorrillas": "pantorrilla",
    "pantorrilla": "pantorrilla",
    "glúteos": "glúteo",
    "glúteo": "glúteo",
    "tobillos": "tobillo",
    "tobillo": "tobillo",
    "corazon": "corazon",
    "cardiaco": "corazon",
    "pulmones": "pulmones",
    "respiratorio": "pulmones",
    "fuerza": "debilidad muscular",
    "debilidad muscular": "debilidad muscular",
    "visual": "visual",
    "auditivo": "auditivo",
    "neurologico": "neurologico",
    "neurológico": "neurologico",
    "otro": "otro"
  };

  const zonaNormalizada = zona.trim().toLowerCase();
  return mapa[zonaNormalizada] || zonaNormalizada;
}
