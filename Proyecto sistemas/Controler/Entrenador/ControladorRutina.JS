const API_CLIENTE = "https://localhost:7086/api/Cliente";
const API_PADECIMIENTO_CLIENTE =
  "https://localhost:7086/api/AsignarPadecimientos";
const API_PADECIMIENTO_GENERAL = "https://localhost:7086/api/Padecimiento";
const API_EJERCICIOS = "https://localhost:7086/api/Ejercicio";
const API_RUTINA = "https://localhost:7086/api/Rutina";

let clienteSeleccionado = null;
let rutinaSugerida = [];

window.listaPadecimientos = [];

// Cargar lista global de padecimientos
$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, (data) => {
  window.listaPadecimientos = data;
});

// 🔍 BUSCAR CLIENTES
$("#clienteBuscador").on("input", function () {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) return;

  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const filtrados = clientes.filter(
      (c) =>
        c.Nombre.toLowerCase().includes(texto) ||
        c.Email.toLowerCase().includes(texto)
    );

    const $lista = $("#listaResultados");
    $lista.empty();
    filtrados.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} - ${c.Email}</li>`
      );
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

// 📋 CARGAR INFO CLIENTE
function cargarInfoCliente(clienteId) {
  $.get(`${API_CLIENTE}/obtenerClientePorId/${clienteId}`, (cliente) => {
    $("#clienteNombre").text(cliente.Nombre);
    $("#clientePeso").text(cliente.Peso + " kg");
    $("#clienteAltura").text(cliente.Altura + " cm");
    $("#clienteEntrenador").text(cliente.Entrenador?.Nombre || "-");

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

function generarRutina(clienteId) {
  console.log("Generando rutina para clienteId:", clienteId);

  Promise.all([
    $.get(`${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`),
    $.get(`${API_EJERCICIOS}/listaEjercicios`),
  ])
    .then(([padecimientos, ejercicios]) => {
      console.log("Padecimientos recibidos:", padecimientos);
      console.log("Ejercicios recibidos:", ejercicios);

      const zonasAfectadas = [];
      padecimientos.forEach((p) => {
        const zonas = (p.AreaMuscularAfectada || "")
          .split(",")
          .map((z) => z.trim().toLowerCase());
        const severidad = (p.Severidad || "").toLowerCase();

        zonas.forEach((z) => {
          if (z !== "") {
            zonasAfectadas.push({
              zona: z,
              severidad: severidad,
            });
          }
        });
      });

      console.log("Zonas afectadas + severidad:", zonasAfectadas);

      const ejerciciosUnicos = new Set();
      rutinaSugerida = ejercicios.filter((e) => {
        const zonasEjercicio = (e.AreaMuscularAfectada || "")
          .split(",")
          .map((z) => z.trim().toLowerCase())
          .filter((z) => z !== "");

        console.log(`Ejercicio: ${e.Nombre} - Zonas:`, zonasEjercicio);

        const afectaZonaGrave = zonasEjercicio.some((zonaEj) =>
          zonasAfectadas.some(
            (p) => p.zona === zonaEj && p.severidad === "grave"
          )
        );

        const afectaZonaModeradoLeve = zonasEjercicio.some((zonaEj) =>
          zonasAfectadas.some(
            (p) =>
              p.zona === zonaEj &&
              (p.severidad === "moderado" || p.severidad === "leve")
          )
        );

        let incluir = false;

        if (zonasAfectadas.length === 0) {
          incluir = true;
        } else if (afectaZonaGrave) {
          incluir = e.Dificultad.toLowerCase() === "baja";
        } else if (afectaZonaModeradoLeve) {
          incluir = ["baja", "media"].includes(e.Dificultad.toLowerCase());
        } else {
          incluir = true;
        }

        if (incluir && !ejerciciosUnicos.has(e.IdEjercicio)) {
          ejerciciosUnicos.add(e.IdEjercicio);
          return true;
        }

        return false;
      });

      console.log("Rutina sugerida FINAL:", rutinaSugerida);
      mostrarTablaRutina();
    })
    .catch((err) => {
      console.error("Error generando rutina:", err);
      alert("Ocurrió un error al generar la rutina.");
    });
}

// 📋 MOSTRAR TABLA RUTINA
function mostrarTablaRutina() {
  const $tbody = $("#tablaRutina tbody");
  $tbody.empty();

  rutinaSugerida.forEach((ej, index) => {
    $tbody.append(`
      <tr>
        <td>${ej.Nombre}</td>
        <td>${ej.Descripcion}</td>
        <td>${ej.AreaMuscular}</td>
        <td>${ej.Dificultad}</td>
        <td>${ej.AreaMuscularAfectada}</td>
        <td>
          <input type="number" class="form-control reps-input" value="12" min="1" data-index="${index}">
        </td>
        <td>
          <input type="text" class="form-control comentario-input" placeholder="Comentario opcional" data-index="${index}">
        </td>
        <td class="text-center">
          <button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${index})">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </td>
      </tr>
    `);
  });
}

// 🗑️ ELIMINAR EJERCICIO
function eliminarEjercicio(index) {
  rutinaSugerida.splice(index, 1);
  mostrarTablaRutina();
}

// 💾 GUARDAR RUTINA
$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || rutinaSugerida.length === 0) {
    alert(
      "Selecciona un cliente y asegúrate de que la rutina tenga ejercicios."
    );
    return;
  }

  const ejercicios = rutinaSugerida.map((ej, i) => {
    const $row = $("#tablaRutina tbody tr").eq(i);
    const repeticiones = parseInt($row.find(".reps-input").val()) || 0;
    const comentarioInput = $row.find(".comentario-input").val();
    const comentario = comentarioInput ? comentarioInput.trim() : "";

    return {
      IdEjercicio: ej.IdEjercicio,
      Comentario: comentario,
      NombreEjercicio: ej.Nombre,
      DescripcionEjercicio: ej.Descripcion,
      AreaMuscular: ej.AreaMuscular,
      AreaMuscularAfectada: ej.AreaMuscularAfectada,
      Repeticiones: repeticiones,
      GuiaEjercicio: ej.GuiaEjercicio,
      Dificultad: ej.Dificultad,
    };
  });

  const dto = {
    FechaInicio: new Date(),
    FechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    IdCliente: clienteSeleccionado,
    Ejercicios: ejercicios,
  };

  console.log("DTO a enviar:", dto);

  $.ajax({
    url: `${API_RUTINA}/crearRutinaCompleta`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dto),
    success: () => alert("✅ Rutina guardada correctamente"),
    error: () => alert("❌ Error al guardar rutina"),
  });
});

// 🔄 NORMALIZAR ZONAS


//GENERADOR DE RUTINA CON IA


// document.getElementById("btnRecomendarIA").addEventListener("click", async () => {
//   const idCliente = localStorage.getItem("clienteSeleccionadoId"); // ✅ Asegúrate de guardar esto al seleccionar el cliente
//   const nombreCliente = document.getElementById("clienteNombre").textContent;

//   if (!idCliente) {
//     alert("Selecciona un cliente antes de continuar.");
//     return;
//   }

// const payload = {
//   IdCliente: parseInt(idCliente),
//   NombreCliente: nombreCliente,
//   Padecimientos: [],
//   EjerciciosDisponibles: []
// };


//   try {
//     const res = await fetch("https://localhost:7086/api/IAEjercicios/recomendar", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload)
//     });

//     if (!res.ok) throw new Error("Error al llamar la IA");

//     const data = await res.json();

//     const tabla = document.getElementById("tablaRutina").querySelector("tbody");
// tabla.innerHTML = "";
// console.log("Respuesta IA:", data.ejerciciosRecomendados);
// data.ejerciciosRecomendados.forEach(ej => {
//   const fila = document.createElement("tr");
//   fila.innerHTML = `
//     <td>${ej.Nombre || "-"}</td>
//     <td>${ej.Descripcion || "-"}</td>
//     <td>${ej.AreaMuscular || "-"}</td>
//     <td>${ej.Dificultad || "-"}</td>
//     <td>${ej.AreaAfectada || "-"}</td>
//     <td><input type="number" value="${ej.Repeticiones || 10}" min="1" /></td>
//     <td><input type="text" placeholder="Comentario..." /></td>
//     <td><button class="eliminar">Eliminar</button></td>
//   `;
//   tabla.appendChild(fila);
// });



// //     data.ejerciciosRecomendados.forEach(ejercicio => {
// //   const fila = document.createElement("tr");
// //   fila.innerHTML = `
// //     <td>${ejercicio.Nombre}</td>
// //     <td>${ejercicio.Descripcion || "-"}</td>
// //     <td>${ejercicio.AreaMuscular || "-"}</td>
// //     <td>${ejercicio.Dificultad || "-"}</td>
// //     <td>${ejercicio.AreaAfectada || "-"}</td>
// //     <td><input type="number" value="10" /></td>
// //     <td><input type="text" placeholder="Comentario..." /></td>
// //     <td><button class="eliminar">Eliminar</button></td>
// //   `;
// //   document.querySelector("#tablaRutina tbody").appendChild(fila);
// // });



//     document.getElementById("rutinaGenerada").style.display = "block";
//   } catch (err) {
//     alert("Hubo un error al generar la rutina con IA");
//     console.error(err);
//   }



  
// });



// // const idCliente = document.getElementById("clienteId").value;

// // if (!idCliente) {
// //   alert("Selecciona un cliente antes de continuar.");
// //   return;
// // }

// // 🔍 Buscar clientes y guardar el ID seleccionado
// $("#clienteBuscador").on("input", function () {
//   const texto = $(this).val().toLowerCase();
//   if (texto.length < 2) return;

//   $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
//     const filtrados = clientes.filter((c) =>
//       c.Nombre.toLowerCase().includes(texto) || c.Email.toLowerCase().includes(texto)
//     );

//     const $lista = $("#listaResultados");
//     $lista.empty();
//     filtrados.forEach((c) => {
//       $lista.append(`<li data-id="${c.IdUsuario}">${c.Nombre} - ${c.Email}</li>`);
//     });

//     // Evento al seleccionar un cliente
//     $lista.find("li").on("click", function () {
//       const id = $(this).data("id");
//       const nombre = $(this).text();

//       clienteSeleccionado = id;
//       localStorage.setItem("clienteSeleccionadoId", id); // ✅ GUARDADO CLAVE PARA IA

//       $("#nombreCliente").text(nombre);
//       $("#rutinaGenerada").show();
//       $("#infoCliente").show();
//       cargarInfoCliente(id);
//       generarRutina(id);

//       $lista.empty();
//       $("#clienteBuscador").val("");
//     });
//   });
// });

document.getElementById("btnRecomendarIA").addEventListener("click", async () => {
  const idCliente = localStorage.getItem("clienteSeleccionadoId");
  const nombreCliente = document.getElementById("clienteNombre").textContent;

  if (!idCliente) {
    alert("Selecciona un cliente antes de continuar.");
    return;
  }

  const payload = {
    IdCliente: parseInt(idCliente),
    NombreCliente: nombreCliente,
    Padecimientos: [],
    EjerciciosDisponibles: []
  };

  try {
    const res = await fetch("https://localhost:7086/api/IAEjercicios/recomendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error al llamar la IA");

    const data = await res.json();
    const tabla = document.querySelector("#tablaRutina tbody");
    tabla.innerHTML = "";

    // Recorrer y mostrar los ejercicios recomendados
    data.ejerciciosRecomendados.forEach(ej => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${ej.Nombre || "-"}</td>
        <td>${ej.Descripcion || "-"}</td>
        <td>${ej.AreaMuscular || "-"}</td>
        <td>${ej.Dificultad || "-"}</td>
        <td>${ej.AreaAfectada || "-"}</td>
        <td><input type="number" value="${ej.Repeticiones || 10}" min="1" /></td>
        <td><input type="text" placeholder="Comentario..." /></td>
        <td><button class="eliminar">Eliminar</button></td>
      `;
      tabla.appendChild(fila);
    });

    document.getElementById("rutinaGenerada").style.display = "block";
  } catch (err) {
    alert("Hubo un error al generar la rutina con IA");
    console.error(err);
  }
});
