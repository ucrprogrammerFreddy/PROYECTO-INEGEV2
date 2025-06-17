// ../../Complementos/Components/MenuEntren.js

export function renderTrainerLayout() {
  // Limpia menús anteriores si ya existen
  document.querySelector(".header")?.remove();
  document.getElementById("idMenuHambEntrenador")?.remove();
  document.getElementById("menu-overlay")?.remove();
  document.querySelector(".footer")?.remove();

  const headerHTML = `
    <header class="header">
      <div class="header-content">
        <img src="../../Complementos/img/logoof.png" alt="Logo" class="header-logo" />
        <div class="menu-toggle" id="openMenu">
          <i class="fas fa-bars"></i>
        </div>
      </div>
    </header>
  `;

  const sidebarHTML = `
    <div id="idMenuHambEntrenador">
      <nav id="sidebar" class="slide">
        <div class="menu-header">
          <h1>MENU</h1>
          <span class="close-btn" id="closeMenu">&times;</span>
        </div>
        <ul>
          <li><a href="../../View/Entrenador/Index.html"><i class="fas fa-home"></i> Inicio</a></li>
          <li><a href="../../View/Entrenador/VerCliente.html"><i class="fas fa-users"></i> Clientes</a></li>
          <li><a href="../../View/Administrador/ListaEjercicios.html"><i class="fas fa-dumbbell"></i> Ejercicios</a></li>
          <li><a href="../../View/Login/index.html"><i class="fas fa-sign-out-alt"></i> Salir</a></li>
        </ul>
      </nav>
    </div>
  `;

  const footerHTML = `
    <footer class="footer">
      <img src="../../Complementos/img/facebook.png" alt="Facebook" class="footer-logo" />
      <img src="../../Complementos/img/instagram.png" alt="Instagram" class="footer-logo" />
      <p>PowerVital - Todos los derechos reservados</p>
    </footer>
  `;

  const overlayHTML = `<div id="menu-overlay"></div>`;

  const main = document.querySelector("main");

  // Inserta header + sidebar
  if (main) {
    main.insertAdjacentHTML(
      "beforebegin",
      headerHTML + sidebarHTML + overlayHTML
    );
  } else {
    console.warn("No se encontró <main>, insertando en <body>");
    document.body.insertAdjacentHTML(
      "afterbegin",
      headerHTML + sidebarHTML + overlayHTML
    );
  }

  // Inserta footer
  document.body.insertAdjacentHTML("beforeend", footerHTML);

  // Asigna eventos
  setTimeout(() => {
    const openMenu = document.getElementById("openMenu");
    const closeMenu = document.getElementById("closeMenu");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const overlay = document.getElementById("menu-overlay");

    openMenu?.addEventListener("click", () => {
      sidebar.classList.add("open");
      mainContent?.classList.add("shifted");
      overlay?.classList.add("visible");
    });

    closeMenu?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      mainContent?.classList.remove("shifted");
      overlay?.classList.remove("visible");
    });

    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      mainContent?.classList.remove("shifted");
      overlay?.classList.remove("visible");
    });
  }, 0);
}
