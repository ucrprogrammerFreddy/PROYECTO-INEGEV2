using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.Models;
using PowerVital.DTO;
using System;
using System.Threading.Tasks;

namespace PowerVital.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LoginController(AppDbContext context)
        {
            _context = context;
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

                // 1. Buscar en tabla base Usuarios
                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == loginRequest.Email.ToLower());

                if (usuario == null)
                {
                    Console.WriteLine("❌ Usuario no encontrado.");
                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
                }

                // 2. Verificar contraseña
                if (usuario.Clave != loginRequest.Clave)
                {
                    Console.WriteLine($"❌ Clave incorrecta. Esperada: {usuario.Clave}, Recibida: {loginRequest.Clave}");
                    return Unauthorized(new { message = "❌ Usuario o clave incorrectos." });
                }

                Console.WriteLine($"✅ Usuario base autenticado. Rol detectado: {usuario.Rol}");

                // 3. Obtener datos del usuario específico según rol
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

                // 4. Retornar login exitoso con los datos base y del rol
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


        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "✅ Logout exitoso." });
        }
    }
}
