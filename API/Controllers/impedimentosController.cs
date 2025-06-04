//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PowerVital.Data;
//using PowerVital.Models;
//using PowerVital.DTO;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;

//namespace PowerVital.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class ImpedimentosController : ControllerBase
//    {
//        private readonly DbContextGym _context;

//        public ImpedimentosController(DbContextGym context)
//        {
//            _context = context;
//        }

//        // GET: api/Impedimentos
//        [HttpGet]
//        public async Task<ActionResult<IEnumerable<ImpedimentosDto>>> GetImpedimentos()
//        {
//            var lista = await _context.Impedimentos
//                .Select(i => new ImpedimentosDto
//                {
//                    IdImpedimento = i.IdImpedimento,
//                    Nombre = i.Nombre,
//                    AreasAfectadas = i.AreasAfectadas?.Split(',').ToList(),
//                    Severidad = i.Severidad
//                })
//                .ToListAsync();

//            return Ok(lista);
//        }

//        // POST: api/Impedimentos
//        [HttpPost]
//        public async Task<ActionResult> Crear([FromBody] ImpedimentosDto dto)
//        {
//            if (dto == null || string.IsNullOrEmpty(dto.Nombre))
//                return BadRequest(new { message = "❌ El nombre es obligatorio." });

//            var entidad = new Impedimento
//            {
//                Nombre = dto.Nombre,
//                AreasAfectadas = string.Join(",", dto.AreasAfectadas),
//                Severidad = dto.Severidad
//            };

//            _context.Impedimentos.Add(entidad);
//            await _context.SaveChangesAsync();

//            return Ok(new { message = "✅ Impedimento creado exitosamente." });
//        }

//        // PUT: api/Impedimentos/5
//        [HttpPut("{id}")]
//        public async Task<ActionResult> Actualizar(int id, [FromBody] ImpedimentosDto dto)
//        {
//            var impedimento = await _context.Impedimentos.FindAsync(id);
//            if (impedimento == null)
//                return NotFound(new { message = "❌ Impedimento no encontrado." });

//            impedimento.Nombre = dto.Nombre;
//            impedimento.AreasAfectadas = string.Join(",", dto.AreasAfectadas);
//            impedimento.Severidad = dto.Severidad;

//            await _context.SaveChangesAsync();
//            return Ok(new { message = "✅ Actualizado correctamente." });
//        }

//        // DELETE: api/Impedimentos/5
//        [HttpDelete("{id}")]
//        public async Task<ActionResult> Eliminar(int id)
//        {
//            var impedimento = await _context.Impedimentos.FindAsync(id);
//            if (impedimento == null)
//                return NotFound(new { message = "❌ No se encontró el impedimento." });

//            _context.Impedimentos.Remove(impedimento);
//            await _context.SaveChangesAsync();

//            return Ok(new { message = "🗑️ Eliminado correctamente." });
//        }
//    }

//    // Clase DTO
//    public class ImpedimentosDto
//    {
//        public int IdImpedimento { get; set; }
//        public string Nombre { get; set; }
//        public List<string> AreasAfectadas { get; set; }
//        public int Severidad { get; set; }
//    }
//}