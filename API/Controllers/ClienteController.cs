using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.DTO;
using PowerVital.Models;

namespace PowerVital.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClienteController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/cliente/listaClientes
        [HttpGet("listaClientes")]
        public async Task<ActionResult<IEnumerable<EditarClienteDto>>> GetClientes()
        {
            var clientes = await _context.Clientes
                .Include(c => c.Entrenador)
                .Include(c => c.PadecimientosClientes)
                    .ThenInclude(pc => pc.Padecimiento)
                .ToListAsync();

            var clientesDto = clientes.Select(c => new EditarClienteDto
            {
                IdUsuario = c.IdUsuario,
                Nombre = c.Nombre,
                Clave = c.Clave,
                Email = c.Email,
                Telefono = c.Telefono,
                FechaNacimiento = c.FechaNacimiento,
                Genero = c.Genero,
                Altura = c.Altura,
                Peso = c.Peso,
                EstadoPago = c.EstadoPago,
                EntrenadorId = c.EntrenadorId,
                NombreEntrenador = c.Entrenador != null ? c.Entrenador.Nombre : "-",
                Padecimientos = c.PadecimientosClientes != null
                    ? c.PadecimientosClientes.Select(pc => $"{pc.Padecimiento.Nombre} ({pc.Severidad})").ToList()
                    : new List<string>()
            }).ToList();

            return Ok(clientesDto);
        }

        // ✅ GET: api/cliente/obtenerClientePorId/{id}
        [HttpGet("obtenerClientePorId/{id}")]
        public async Task<ActionResult<EditarClienteDto>> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.Entrenador)
                .Include(c => c.PadecimientosClientes)
                    .ThenInclude(pc => pc.Padecimiento)
                .FirstOrDefaultAsync(c => c.IdUsuario == id);

            if (cliente == null)
                return NotFound(new { mensaje = "Cliente no encontrado" });

            var dto = new EditarClienteDto
            {
                IdUsuario = cliente.IdUsuario,
                Nombre = cliente.Nombre,
                Clave = cliente.Clave,
                Email = cliente.Email,
                Telefono = cliente.Telefono,
                FechaNacimiento = cliente.FechaNacimiento,
                Genero = cliente.Genero,
                Altura = cliente.Altura,
                Peso = cliente.Peso,
                EstadoPago = cliente.EstadoPago,
                EntrenadorId = cliente.EntrenadorId,
                NombreEntrenador = cliente.Entrenador != null ? cliente.Entrenador.Nombre : "-",
                Padecimientos = cliente.PadecimientosClientes != null
                    ? cliente.PadecimientosClientes.Select(pc => $"{pc.Padecimiento.Nombre} ({pc.Severidad})").ToList()
                    : new List<string>()
            };

            return Ok(dto);
        }

        // ✅ POST: api/cliente/CrearCliente
        [HttpPost("CrearCliente")]
        public async Task<ActionResult> CrearCliente([FromBody] GuardarClienteDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Clave) || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { mensaje = "Nombre, Clave y Email son obligatorios" });

            if (dto.FechaNacimiento > DateTime.Now)
                return BadRequest(new { mensaje = "La fecha de nacimiento no puede ser en el futuro" });

            if (dto.Altura <= 0 || dto.Peso <= 0)
                return BadRequest(new { mensaje = "Altura y peso deben ser mayores que cero" });

            var entrenador = await _context.Entrenadores.FirstOrDefaultAsync(e => e.IdUsuario == dto.EntrenadorId);
            if (entrenador == null)
                return BadRequest(new { mensaje = "El entrenador especificado no existe" });

            var emailExiste = await _context.Clientes.AnyAsync(c => c.Email == dto.Email);
            if (emailExiste)
                return Conflict(new { mensaje = "El correo electrónico ya está registrado." });

            var nuevoCliente = new Cliente
            {
                Nombre = dto.Nombre,
                Clave = dto.Clave,
                Email = dto.Email,
                FechaNacimiento = dto.FechaNacimiento,
                Telefono = dto.Telefono,
                Genero = dto.Genero,
                Altura = dto.Altura,
                Peso = dto.Peso,
                EstadoPago = dto.EstadoPago,
                EntrenadorId = dto.EntrenadorId,
                Rol = "Cliente"
            };

            _context.Clientes.Add(nuevoCliente);
            await _context.SaveChangesAsync();

            if (dto.PadecimientosCompletos != null && dto.PadecimientosCompletos.Count > 0)
            {
                foreach (var p in dto.PadecimientosCompletos)
                {
                    var padecimientoCliente = new PadecimientoCliente
                    {
                        IdCliente = nuevoCliente.IdUsuario,
                        IdPadecimiento = p.IdPadecimiento,
                        Severidad = p.Severidad
                    };

                    _context.PadecimientoCliente.Add(padecimientoCliente);
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { IdUsuario = nuevoCliente.IdUsuario });
        }

        // ✅ PUT: api/cliente/editarCliente
        [HttpPut("editarCliente")]
        public async Task<IActionResult> EditarCliente([FromBody] GuardarClienteDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cliente = await _context.Clientes
                .Include(c => c.PadecimientosClientes)
                .FirstOrDefaultAsync(c => c.IdUsuario == dto.IdUsuario);

            if (cliente == null)
                return NotFound(new { mensaje = "Cliente no encontrado" });

            var entrenadorExiste = await _context.Entrenadores.AnyAsync(e => e.IdUsuario == dto.EntrenadorId);
            if (!entrenadorExiste)
                return BadRequest(new { mensaje = "El entrenador especificado no existe" });

            if (dto.Altura <= 0 || dto.Peso <= 0)
                return BadRequest(new { mensaje = "Altura y peso deben ser mayores que cero" });

            if (dto.FechaNacimiento > DateTime.Now)
                return BadRequest(new { mensaje = "La fecha de nacimiento no puede ser en el futuro" });

            var emailExiste = await _context.Clientes.AnyAsync(c => c.Email == dto.Email && c.IdUsuario != dto.IdUsuario);
            if (emailExiste)
                return Conflict(new { mensaje = "El correo electrónico ya está registrado por otro usuario." });

            cliente.Nombre = dto.Nombre;
            cliente.Clave = dto.Clave;
            cliente.Email = dto.Email;
            cliente.FechaNacimiento = dto.FechaNacimiento;
            cliente.Telefono = dto.Telefono;
            cliente.Genero = dto.Genero;
            cliente.Altura = dto.Altura;
            cliente.Peso = dto.Peso;
            cliente.EstadoPago = dto.EstadoPago;
            cliente.EntrenadorId = dto.EntrenadorId;

            _context.Clientes.Update(cliente);
            await _context.SaveChangesAsync();

            var padecimientosExistentes = await _context.PadecimientoCliente
                .Where(pc => pc.IdCliente == cliente.IdUsuario)
                .ToListAsync();

            _context.PadecimientoCliente.RemoveRange(padecimientosExistentes);
            await _context.SaveChangesAsync();

            if (dto.PadecimientosCompletos != null && dto.PadecimientosCompletos.Count > 0)
            {
                foreach (var p in dto.PadecimientosCompletos)
                {
                    var padecimientoCliente = new PadecimientoCliente
                    {
                        IdCliente = cliente.IdUsuario,
                        IdPadecimiento = p.IdPadecimiento,
                        Severidad = p.Severidad
                    };

                    _context.PadecimientoCliente.Add(padecimientoCliente);
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { mensaje = "Cliente actualizado correctamente" });
        }

        // ✅ DELETE: api/cliente/eliminarCliente/{id}
        [HttpDelete("eliminarCliente/{id}")]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.IdUsuario == id);
            if (cliente == null)
                return NotFound(new { mensaje = "Cliente no encontrado" });

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Cliente eliminado correctamente" });
        }

        // ✅ GET: api/cliente/{id}/rutinaActual
        [HttpGet("{id}/rutinaActual")]
        public async Task<IActionResult> ObtenerRutinaActual(int id)
        {
            var rutina = await _context.Rutinas
                .Where(r => r.IdCliente == id && r.FechaFin >= DateTime.Now)
                .OrderByDescending(r => r.FechaInicio)
                .Select(r => new
                {
                    r.IdRutina,
                    r.FechaInicio,
                    r.FechaFin,
                    Ejercicios = r.EjerciciosRutina.Select(er => new
                    {
                        er.Ejercicio.Nombre,
                        er.Ejercicio.Descripcion,
                        er.Comentario
                    })
                })
                .FirstOrDefaultAsync();

            if (rutina == null)
                return NotFound(new { mensaje = "No se encontró una rutina actual para este cliente." });

            return Ok(rutina);
        }
    }
}
