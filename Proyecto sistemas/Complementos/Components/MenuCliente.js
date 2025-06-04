export function MenuCliente() {
  return `
    <aside class="sidebar" id="sidebar">
      <div class="menu-header">
        <h1>MENU</h1>
        <div class="close-btn" id="closeSidebar"><i class="fas fa-times"></i></div>
      </div>
      <ul>
        <li><a href="/Proyecto sistemas/View/Cliente/Index.html"><i class="fas fa-home"></i> Inicio</a></li>
        <li><a href="/Proyecto sistemas/View/Cliente/RutinaCliente.html"><i class="fas fa-dumbbell"></i> Rutinas</a></li>
        <li><a href="#"><i class="fas fa-circle-question"></i> Help</a></li>
        <li><a href="#"><i class="fas fa-right-from-bracket"></i> Cerrar Sesión</a></li>
      </ul>
    </aside>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const layout = document.getElementById("layout");
  layout.insertAdjacentHTML("afterbegin", MenuCliente());

  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");
  const icon = document.getElementById("iconHamburguesa"); // ✅ ahora sí lo definimos

  if (openBtn && layout && icon) {
    openBtn.addEventListener("click", () => {
      layout.classList.add("sidebar-open");
      icon.style.display = "none"; // 🔧 Oculta el ícono
    });
  }

  if (closeBtn && layout && icon) {
    closeBtn.addEventListener("click", () => {
      layout.classList.remove("sidebar-open");
      icon.style.display = "inline-block"; // 🔧 Muestra de nuevo el ícono
    });
  }
});
