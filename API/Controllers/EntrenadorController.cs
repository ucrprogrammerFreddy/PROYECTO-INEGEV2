using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.Models;
using PowerVital.DTOs;

namespace PowerVital.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntrenadorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EntrenadorController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/Entrenador
        [HttpGet("listaEntrenador")]
        public async Task<ActionResult<IEnumerable<EntrenadorDTO>>> ObtenerTodosLosEntrenadores()
        {
            var entrenadores = await _context.Entrenadores
                .Select(e => new EntrenadorDTO
                {
                    idIdUsuario = e.IdUsuario,
                    Nombre = e.Nombre,
                    Email = e.Email,
                    Clave = e.Clave,
                    Telefono = e.Telefono,
                    Rol =e.Rol,

                    FormacionAcademica = e.FormacionAcademica
                    // Excluyendo Clave y Rol
                })
                .ToListAsync();

            return Ok(entrenadores);
        }

        // ✅ GET: api/Entrenador/{id}
        [HttpGet("obtenerEntrenadorPorId/{id}")]
        public async Task<ActionResult<EntrenadorDTO>> ObtenerEntrenadorPorId(int id)
        {
            var entrenador = await _context.Entrenadores.FindAsync(id);

            if (entrenador == null)
                return NotFound();

            var dto = new EntrenadorDTO
            {
                idIdUsuario = entrenador.IdUsuario,
                Nombre = entrenador.Nombre,
                Clave = entrenador.Rol,
                Telefono = entrenador.Telefono,
                Rol =entrenador.Rol,
                Email = entrenador.Email,
                FormacionAcademica = entrenador.FormacionAcademica
            };

            return Ok(dto);
        }

        // ✅ POST: api/Entrenador
        [HttpPost("agregarEntrenador")]
        public async Task<ActionResult> AgregarEntrenador([FromBody] EntrenadorDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(dto.Clave))
                return BadRequest("La clave es obligatoria.");

            // Normalizar email (minúsculas)
            string emailNormalizado = dto.Email.ToLower();

            // Validar existencia del email en entrenadores (opcional: también en Usuarios)
            var correoExistente = await _context.Entrenadores.AnyAsync(e => e.Email.ToLower() == emailNormalizado)
                || await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado);

            if (correoExistente)
                return Conflict(new { message = "⚠️ El correo electrónico ya está registrado." });

            var nuevoEntrenador = new Entrenador
            {
                Nombre = dto.Nombre,
                Email = dto.Email,
                Clave = dto.Clave, // ⚠️ En producción, debes hashear la clave
                Telefono = dto.Telefono,
                Rol = "Entrenador",
                FormacionAcademica = dto.FormacionAcademica
            };

            _context.Entrenadores.Add(nuevoEntrenador);
            await _context.SaveChangesAsync();

            var dtoResultado = new EntrenadorDTO
            {
                idIdUsuario = nuevoEntrenador.IdUsuario,
                Nombre = nuevoEntrenador.Nombre,
                Email = nuevoEntrenador.Email,
                Clave = nuevoEntrenador.Clave,
                Telefono = nuevoEntrenador.Telefono,
                FormacionAcademica = nuevoEntrenador.FormacionAcademica,
                Rol = nuevoEntrenador.Rol
            };

            return CreatedAtAction(nameof(ObtenerEntrenadorPorId), new { id = dtoResultado.idIdUsuario }, dtoResultado);
        }
        // ✅ PUT: api/Entrenador/{id}
        [HttpPut("editarEntrenador/{id}")]
        public async Task<IActionResult> EditarEntrenador(int id, [FromBody] EntrenadorDTO dto)
        {
            if (id != dto.idIdUsuario)
                return BadRequest("El ID no coincide.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var entrenador = await _context.Entrenadores.FindAsync(id);
            if (entrenador == null)
                return NotFound();

            // Actualizar los campos permitidos
            entrenador.Nombre = dto.Nombre;
            entrenador.Email = dto.Email;
            entrenador.Telefono = dto.Telefono;
            entrenador.Clave = dto.Clave; // ⚠️ En producción, debes hashear la clave
            entrenador.FormacionAcademica = dto.FormacionAcademica;
            // La clave no se actualiza desde aquí por seguridad

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ✅ DELETE: api/Entrenador/{id}
        [HttpDelete("eliminarEntrenador/{id}")]
        public async Task<IActionResult> EliminarEntrenador(int id)
        {
            var entrenador = await _context.Entrenadores.FindAsync(id);
            if (entrenador == null)
                return NotFound();

            _context.Entrenadores.Remove(entrenador);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 🔍 Verificar si el Entrenador existe
        private bool ExisteEntrenador(int id)
        {
            return _context.Entrenadores.Any(e => e.IdUsuario == id);
        }



        // GET: api/entrenador/{id}/clientes
        [HttpGet("{id}/clientes")]
        public async Task<IActionResult> ObtenerClientes(int id)
        {
            var clientes = await _context.Clientes
                .Where(c => c.EntrenadorId == id)
                .Select(c => new
                {
                    c.IdUsuario,              // ID del cliente
                    c.Nombre,          // Heredado de Usuario       
                    c.EstadoPago,
                    c.Altura,
                    c.Peso
                })
                .ToListAsync();

            return Ok(clientes);
        }


    }
}
