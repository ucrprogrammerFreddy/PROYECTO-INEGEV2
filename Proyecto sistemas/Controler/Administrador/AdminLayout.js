// export function renderAdminLayout() {
//   const headerHTML = `
//     <header class="header">
//       <div class="header-content">
//         <img src="../../Complementos/img/logoof.png" alt="Logo" class="header-logo" />
//         <div class="menu-toggle" id="openMenu">
//           <i class="fas fa-bars"></i>
//         </div>
//       </div>
//     </header>
//   `;

//   const sidebarHTML = `
//     <div id="idMenuHambAdmin">
//       <nav id="sidebar" class="slide">
//         <div class="menu-header">
//           <h1>MENU</h1>
//           <span class="close-btn" id="closeMenu">&times;</span>
//         </div>
//         <ul>
//           <li><a href="Index.html"><i class="fas fa-home"></i> Inicio</a></li>
//           <li><a href="#"><i class="fas fa-dollar-sign"></i> Pagos</a></li>
//           <li>
//             <a href="#" id="clientesMenuBtn">
//               <i class="fas fa-users"></i> Clientes <span class="caret"><i class="fas fa-caret-down"></i></span>
//             </a>
//             <ul class="submenu" id="clientesSubmenu">
//               <li><a href="Administradores.html">Administradores</a></li>
//               <li><a href="Entrenadores.html">Entrenadores</a></li>
//               <li><a href="ListaClientes.html">Clientes</a></li>
//             </ul>
//           </li>
//           <li><a href="#"><i class="fas fa-dumbbell"></i> Ejercicios</a></li>
//           <li><a href="#"><i class="fas fa-sign-out-alt"></i> Salir</a></li>
//         </ul>
//       </nav>
//     </div>
//   `;

//   const footerHTML = `
//     <footer class="footer">
//       <p>PowerVital Todos los derechos Reservados</p>
//       <img src="../../Complementos/img/facebook.png" alt="Facebook" class="footer-logo" />
//       <img src="../../Complementos/img/instagram.png" alt="Instagram" class="footer-logo" />
//     </footer>
//   `;

//   // Inyecta header y sidebar antes del main
//   const main = document.querySelector("main");
//   if (main) {
//     main.insertAdjacentHTML("beforebegin", headerHTML + sidebarHTML);
//   } else {
//     document.body.insertAdjacentHTML("afterbegin", headerHTML + sidebarHTML);
//   }

//   document.body.insertAdjacentHTML("beforeend", footerHTML);

//   // Espera a que todo esté en el DOM para asignar eventos
//   setTimeout(() => {
//     const openMenu = document.getElementById("openMenu");
//     const closeMenu = document.getElementById("closeMenu");
//     const sidebar = document.getElementById("sidebar");
//     const mainContent = document.querySelector("main");
//     const clientesMenuBtn = document.getElementById("clientesMenuBtn");
//     const clientesSubmenu = document.getElementById("clientesSubmenu");

//     openMenu?.addEventListener("click", () => {
//       sidebar.classList.add("open");
//       mainContent?.classList.add("shifted");
//     });

//     closeMenu?.addEventListener("click", () => {
//       sidebar.classList.remove("open");
//       mainContent?.classList.remove("shifted");
//     });

//     clientesMenuBtn?.addEventListener("click", (e) => {
//       e.preventDefault();
//       clientesSubmenu.classList.toggle("visible");
//     });
//   }, 100);
// }

export function renderAdminLayout() {
  const headerHTML = `
    <header class="header ">
      <div class="header-content ">
        <img src="../../Complementos/img/logoof.png" alt="Logo" class="header-logo" />
        <div class="menu-toggle" id="openMenu">
          <i class="fas fa-bars"></i>
        </div>
      </div>
    </header>
  `;

  const sidebarHTML = `
    <div id="idMenuHambAdmin">
      <nav id="sidebar" class="slide">
        <div class="menu-header">
          <h1>MENU</h1>
          <span class="close-btn" id="closeMenu">&times;</span>
        </div>
        <ul>
          <li><a href="Index.html"><i class="fas fa-home"></i> Inicio</a></li>
          <li><a href="#"><i class="fas fa-dollar-sign"></i> Pagos</a></li>
          <li>
            <a href="#" id="clientesMenuBtn">
              <i class="fas fa-users"></i> Usuarios <span class="caret"><i class="fas fa-caret-down"></i></span>
            </a>
            <ul class="submenu" id="clientesSubmenu">
              <li><a href="Empleados.html">Administrador Registro</a></li>
              <li><a href="ListaEntrenadores.html">Entrenadores</a></li>
              <li><a href="ListaClientes.html">Clientes</a></li>
            </ul>
          </li>
          <li><a href="../../View/Administrador/ListaEjercicios.html"><i class="fas fa-dumbbell"></i> Ejercicios</a></li>
          <li><a href="../../View/Login/Login.html"><i class="fas fa-sign-out-alt"></i> Salir</a></li>
        </ul>
      </nav>
    </div>
  `;

  const footerHTML = `
    <footer class="footer ">
    <div class="container">
    <div class="row align-items-center justify-content-center">
      <div class="col-12 col-md-auto mb-2 mb-md-0">
        <p class="mb-0">PowerVital Todos los derechos Reservados</p>
      </div>
      <div class="col-12 col-md-auto">
        <img src="../../Complementos/img/facebook.png" alt="Facebook" class="footer-logo" />
        <img src="../../Complementos/img/instagram.png" alt="Instagram" class="footer-logo" />
      </div>
    </div>
  </div>
    </footer>
  `;

  const main = document.querySelector("main");

  // Inserta el header y sidebar
  if (main) {
    main.insertAdjacentHTML("beforebegin", headerHTML + sidebarHTML);
  } else {
    console.warn("No se encontró <main>, insertando en <body>");
    document.body.insertAdjacentHTML("afterbegin", headerHTML + sidebarHTML);
  }

  // Inserta el footer
  document.body.insertAdjacentHTML("beforeend", footerHTML);

  // Espera a que el DOM esté actualizado para asignar eventos
  setTimeout(() => {
    const openMenu = document.getElementById("openMenu");
    const closeMenu = document.getElementById("closeMenu");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const clientesMenuBtn = document.getElementById("clientesMenuBtn");
    const clientesSubmenu = document.getElementById("clientesSubmenu");

    if (openMenu && sidebar) {
      openMenu.addEventListener("click", () => {
        sidebar.classList.add("open");
        mainContent?.classList.add("shifted");
      });
    }

    if (closeMenu && sidebar) {
      closeMenu.addEventListener("click", () => {
        sidebar.classList.remove("open");
        mainContent?.classList.remove("shifted");
      });
    }

    if (clientesMenuBtn && clientesSubmenu) {
      clientesMenuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clientesSubmenu.classList.toggle("visible");
      });
    }
  }, 0); // Se ejecuta al final del stack
}
