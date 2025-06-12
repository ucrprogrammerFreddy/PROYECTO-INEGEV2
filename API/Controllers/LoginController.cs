//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PowerVital.Data;
//using PowerVital.Models;
//using PowerVital.DTO;
//using System;
//using System.Threading.Tasks;
//using System.Collections.Generic;
//using Microsoft.AspNetCore.Identity;


//namespace PowerVital.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class LoginController : ControllerBase
//    {
//        private readonly AppDbContext _context;
//        private readonly EmailService _emailService;
//        public LoginController(AppDbContext context, EmailService emailService)
//        {
//            _context = context;
//            _emailService = emailService;
//        }

//        [HttpPost("Login")]
//        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
//        {
//            try
//            {
//                Console.WriteLine($"📤 LoginRequest recibido: {loginRequest.Email}");

//                if (string.IsNullOrWhiteSpace(loginRequest.Email) || string.IsNullOrWhiteSpace(loginRequest.Clave))
//                {
//                    return BadRequest(new { message = "⚠️ Email y clave son obligatorios." });
//                }

//                // 1. Buscar en tabla base Usuarios
//                var usuario = await _context.Usuarios
//                    .FirstOrDefaultAsync(u => u.Email.ToLower() == loginRequest.Email.ToLower());

//                if (usuario == null)
//                {
//                    Console.WriteLine("❌ Usuario no encontrado.");
//                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
//                }

//                // 2. Verificar contraseña
//                if (usuario.Clave != loginRequest.Clave)
//                {
//                    Console.WriteLine($"❌ Clave incorrecta. Esperada: {usuario.Clave}, Recibida: {loginRequest.Clave}");
//                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
//                }

//                Console.WriteLine($"✅ Usuario base autenticado. Rol detectado: {usuario.Rol}");

//                // 3. Obtener datos del usuario específico según rol
//                object datosRol = null;

//                switch (usuario.Rol)
//                {
//                    case "Admin":
//                        datosRol = await _context.Administradores.FirstOrDefaultAsync(a => a.IdUsuario == usuario.IdUsuario);
//                        break;
//                    case "Cliente":
//                        datosRol = await _context.Clientes.FirstOrDefaultAsync(c => c.IdUsuario == usuario.IdUsuario);
//                        break;
//                    case "Entrenador":
//                        datosRol = await _context.Entrenadores.FirstOrDefaultAsync(e => e.IdUsuario == usuario.IdUsuario);
//                        break;
//                    default:
//                        return BadRequest(new { message = "❌ Rol no válido." });
//                }

//                if (datosRol == null)
//                {
//                    Console.WriteLine("❌ No se encontraron datos adicionales para el rol.");
//                    return NotFound(new { message = "❌ Datos de rol no encontrados." });
//                }

//                // 4. Retornar login exitoso con los datos base y del rol
//                return Ok(new
//                {
//                    message = "✅ Login exitoso.",
//                    redirectUrl = usuario.Rol switch
//                    {
//                        "Admin" => "/Administrador/Index",
//                        "Cliente" => "/Clientes/Inicio",
//                        "Entrenador" => "/Entrenadores/index",
//                        _ => "/Login"
//                    },
//                    usuario = new
//                    {
//                        usuario.IdUsuario,
//                        usuario.Nombre,
//                        usuario.Email,
//                        Rol = usuario.Rol.ToLower(),

//                        IdRol = usuario.Rol switch
//                        {
//                            "Admin" => ((Administrador)datosRol).IdUsuario,
//                            "Cliente" => ((Cliente)datosRol).IdUsuario,
//                            "Entrenador" => ((Entrenador)datosRol).IdUsuario,
//                            _ => usuario.IdUsuario
//                        }
//                    }
//                });
//            }
//            catch (Exception ex)
//            {
//                Console.WriteLine($"❌ Error interno: {ex.Message}");

//                return StatusCode(500, new { message = "❌ Error interno del servidor", error = ex.Message });
//            }
//        }


//        [HttpPost("RecuperarClave")]
//        public async Task<IActionResult> RecuperarClave([FromBody] string correo)
//        {
//            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == correo);
//            if (cliente == null) return NotFound("No se encontró un usuario con ese correo");

//            string nuevaClave = Utilidades.GenerarClaveSegura();
//            var hasher = new PasswordHasher<Cliente>();
//            cliente.Clave = hasher.HashPassword(cliente, nuevaClave);

//            await _context.SaveChangesAsync();

//            await _emailService.EnviarCorreoAsync(cliente.Email, "Recuperación de contraseña", $"Tu nueva contraseña temporal es: {nuevaClave}");

//            return Ok("Contraseña enviada al correo");
//        }


//        [HttpPost("Logout")]
//        public IActionResult Logout()
//        {
//            return Ok(new { message = "✅ Logout exitoso." });
//        }

//    }
//}
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.Models;
using PowerVital.DTO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using System;

namespace PowerVital.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;

        public LoginController(AppDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            try
            {
                Console.WriteLine($"📤 LoginRequest recibido: {loginRequest.Email}");

                if (string.IsNullOrWhiteSpace(loginRequest.Email) || string.IsNullOrWhiteSpace(loginRequest.Clave))
                {
                    return BadRequest(new { message = "⚠️ Email y clave son obligatorios." });
                }

                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == loginRequest.Email.ToLower());

                if (usuario == null)
                {
                    Console.WriteLine("❌ Usuario no encontrado.");
                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
                }

                // Verificar contraseña usando PasswordHasher
                var hasher = new PasswordHasher<Usuario>();
                var resultado = hasher.VerifyHashedPassword(null, usuario.Clave, loginRequest.Clave);

                if (resultado == PasswordVerificationResult.Failed)
                {
                    Console.WriteLine("❌ Clave incorrecta.");
                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
                }

                Console.WriteLine($"✅ Usuario autenticado. Rol: {usuario.Rol}");

                object datosRol = null;

                switch (usuario.Rol)
                {
                    case "Admin":
                        datosRol = await _context.Administradores.FirstOrDefaultAsync(a => a.IdUsuario == usuario.IdUsuario);
                        break;
                    case "Cliente":
                        datosRol = await _context.Clientes.FirstOrDefaultAsync(c => c.IdUsuario == usuario.IdUsuario);
                        break;
                    case "Entrenador":
                        datosRol = await _context.Entrenadores.FirstOrDefaultAsync(e => e.IdUsuario == usuario.IdUsuario);
                        break;
                    default:
                        return BadRequest(new { message = "❌ Rol no válido." });
                }

                if (datosRol == null)
                {
                    Console.WriteLine("❌ No se encontraron datos adicionales para el rol.");
                    return NotFound(new { message = "❌ Datos de rol no encontrados." });
                }

                return Ok(new
                {
                    message = "✅ Login exitoso.",
                    redirectUrl = usuario.Rol switch
                    {
                        "Admin" => "/Administrador/Index",
                        "Cliente" => "/Clientes/Inicio",
                        "Entrenador" => "/Entrenadores/index",
                        _ => "/Login"
                    },
                    usuario = new
                    {
                        usuario.IdUsuario,
                        usuario.Nombre,
                        usuario.Email,
                        Rol = usuario.Rol.ToLower(),
                        IdRol = usuario.Rol switch
                        {
                            "Admin" => ((Administrador)datosRol).IdUsuario,
                            "Cliente" => ((Cliente)datosRol).IdUsuario,
                            "Entrenador" => ((Entrenador)datosRol).IdUsuario,
                            _ => usuario.IdUsuario
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error interno: {ex.Message}");
                return StatusCode(500, new { message = "❌ Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("RecuperarClave")]
        public async Task<IActionResult> RecuperarClave([FromBody] string correo)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == correo);
            if (cliente == null)
                return NotFound("No se encontró un usuario con ese correo");

            string nuevaClave = Utilidades.GenerarClaveSegura();

            var hasher = new PasswordHasher<Cliente>();
            cliente.Clave = hasher.HashPassword(cliente, nuevaClave);

            await _context.SaveChangesAsync();

            await _emailService.EnviarCorreoAsync(cliente.Email, "Recuperación de contraseña", $"Tu nueva contraseña temporal es: {nuevaClave}");

            return Ok("Contraseña enviada al correo");
        }

        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "✅ Logout exitoso." });
        }
    }
}
