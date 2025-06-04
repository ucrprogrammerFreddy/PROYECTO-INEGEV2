const API_BASE = "https://localhost:7086/api";

// ✅ Se ejecuta una sola vez al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  const vista = document.body.id;
  const clienteId = sessionStorage.getItem("clienteId");

  if (!clienteId) {
    alert("Cliente no identificado.");
    return;
  }

  // ⚙️ Ejecutar lógica según vista
  switch (vista) {
    case "vista-pdf":
      cargarPDF(clienteId);
      break;

    case "vista-principal":
      cargarDatosCliente(clienteId);
      break;

    default:
      console.warn("⚠️ Vista desconocida. No se ejecutó ningún comportamiento.");
  }
});


// 🔹 FUNCIONES PARA VISTA PERFIL (vista-principal)

function cargarDatosCliente(clienteId) {
  fetch(`${API_BASE}/historialsalud/cliente/${clienteId}/estado-actual`)
    .then(response => {
      if (!response.ok) throw new Error("No se pudo obtener el estado actual");
      return response.json();
    })
    .then(data => {
      mostrarDatosPersonales(data.Cliente);
      mostrarSaludFisica(data);
      mostrarPadecimientos(data.Padecimientos);
    })
    .catch(err => console.error("❌ Error general:", err));
}

function mostrarDatosPersonales(cliente) {
  document.getElementById("nombreCompleto").textContent = cliente.Nombre;
  document.getElementById("fechaNacimiento").textContent = formatearFecha(cliente.FechaNacimiento);
  document.getElementById("genero").textContent = cliente.Genero;
  document.getElementById("telefono").textContent = cliente.Telefono;
  document.getElementById("correo").textContent = cliente.Email;
  document.getElementById("altura").textContent = cliente.Altura;
}

function mostrarSaludFisica(data) {
  document.getElementById("peso").textContent = data.Peso;
  document.getElementById("imc").textContent = data.IndiceMasaCorporal;
}

function mostrarPadecimientos(padecimientos) {
  const texto = padecimientos && padecimientos.length > 0
    ? padecimientos.map(p => `${p.Nombre} (${p.Severidad})`).join(", ")
    : "Sin padecimientos registrados.";
  document.getElementById("padecimientos").textContent = texto;
}


// 🔹 FUNCIONES PARA VISTA PDF (vista-pdf)

function cargarPDF(clienteId) {
  const url = `${API_BASE}/HistorialSalud/pdf/${clienteId}`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("No se pudo obtener el PDF.");
      return response.blob();
    })
    .then(blob => {
      const fileURL = URL.createObjectURL(blob);

      const canvas = document.getElementById("pdfCanvas");
      const context = canvas.getContext("2d");

      const loadingTask = pdfjsLib.getDocument(fileURL);
      loadingTask.promise.then(pdf => {
        pdf.getPage(1).then(page => {
          // ✔ Escala ideal y DPI mejorado
          const scale = 1.2;
          const viewport = page.getViewport({ scale });

          // Mejora de resolución: duplicamos dimensiones físicas y reducimos CSS
          canvas.width = viewport.width * 2;
          canvas.height = viewport.height * 2;

          canvas.style.width = viewport.width + "px";
          canvas.style.height = viewport.height + "px";

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            transform: [2, 0, 0, 2, 0, 0]  // 2x resolución para claridad
          };

          page.render(renderContext);
        });
      });
    })
    .catch(error => {
      console.error("❌ Error al mostrar PDF con pdf.js:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const vista = document.body.id;
  const clienteId = sessionStorage.getItem("clienteId");

  if (!clienteId) {
    alert("Cliente no identificado.");
    return;
  }

  // Agregar comportamiento al botón de descarga
  const btnDescargar = document.getElementById("btnDescargarPDF");
  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      const url = `${API_BASE}/HistorialSalud/pdf/${clienteId}`;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "historial_paciente.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  // ⚙️ Ejecutar lógica según vista
  switch (vista) {
    case "vista-pdf":
      cargarPDF(clienteId);
      break;

    case "vista-principal":
      cargarDatosCliente(clienteId);
      break;

    default:
      console.warn("⚠️ Vista desconocida. No se ejecutó ningún comportamiento.");
  }
});


//Función común para formatear fecha
function formatearFecha(fechaISO) {
  const date = new Date(fechaISO);
  return date.toLocaleDateString("es-CR", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}


