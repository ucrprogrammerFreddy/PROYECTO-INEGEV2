using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.DTO;
using PowerVital.DTOs;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using PowerVital.DTO; // 👈 Esto importa el DTO necesario

namespace PowerVital.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IAEjerciciosController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _context;

        public IAEjerciciosController(IConfiguration config, AppDbContext context)
        {
            _config = config;
            _httpClient = new HttpClient();
            _context = context;
        }

        [HttpPost("recomendar")]
        public async Task<IActionResult> Recomendar([FromBody] RecomendacionIARequest request)
        {
            // Obtener datos reales del cliente
            var cliente = await _context.Clientes
                .Include(c => c.PadecimientosClientes)
                    .ThenInclude(pc => pc.Padecimiento)
                .FirstOrDefaultAsync(c => c.IdUsuario == request.IdCliente);

            if (cliente == null)
                return NotFound("Cliente no encontrado");

            // Obtener lista real de padecimientos
            var padecimientos = cliente.PadecimientosClientes
                .Select(pc => new PadecimientoIADTO
                {
                    Nombre = pc.Padecimiento.Nombre,
                    AreaMuscular = pc.Padecimiento.AreaMuscularAfectada,
                    Severidad = pc.Severidad
                })
                .ToList();

            // Obtener ejercicios desde la BD
            var ejerciciosDisponibles = await _context.Ejercicios
                .Select(e => new EjercicioDTO
                {
                    Nombre = e.Nombre,
                    AreaMuscular = e.AreaMuscular
                })
                .ToListAsync();

            // Filtrar los que no afecten padecimientos graves
            var ejerciciosSeguros = ejerciciosDisponibles
                .Where(ej => !padecimientos.Any(p =>
                    p.Severidad.ToLower() == "grave" &&
                    !string.IsNullOrEmpty(p.AreaMuscular) &&
                    p.AreaMuscular.ToLower() == ej.AreaMuscular?.ToLower()))
                .OrderBy(_ => Guid.NewGuid())
                .ToList();

            if (ejerciciosSeguros.Count == 0)
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            var prompt = $@"Eres un experto en salud y entrenamiento físico.
Debes recomendar ejercicios seguros para el cliente {cliente.Nombre} según sus padecimientos y severidad.

Padecimientos del cliente:";
            foreach (var p in padecimientos)
                prompt += $"\n- {p.Nombre} (Área: {p.AreaMuscular}, Severidad: {p.Severidad})";

            prompt += "\n\nEjercicios disponibles en la base de datos (NO inventes nuevos):";
            foreach (var e in ejerciciosSeguros)
                prompt += $"\n- {e.Nombre} ({e.AreaMuscular})";

            prompt += @"

INSTRUCCIONES:
1. Selecciona solo ejercicios de la lista.
2. Obten los padecimientos del cliente y analizalos.
3. si el cliente no tiene padecimientos recomienda 3 ejercicios (obligatorio) por área muscular .
4. Si hay menos de 3 ejercicios aptos, sugiere solo los posibles.
5. Si el padecimiento es leve se puede considerar que haga el ejercicio.
6. Evita contradicciones.
7. Si el cliente no puede realizar ningun ejercicio por su padecimiento y grado de severidad , responde exactamente: 'Ningún ejercicio es apto para este cliente'.
8. Devuelve solo los nombres, separados por salto de línea, sin texto adicional.";

            var requestBody = new
            {
                model = "gpt-3.5-turbo",
                messages = new[] { new { role = "user", content = prompt } },
                max_tokens = 150
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config["OpenAI:ApiKey"]}");

            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Error al consultar OpenAI");

            var resultJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(resultJson);
            var raw = doc.RootElement.GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (raw.Trim().ToLower().Contains("ningún ejercicio"))
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            var sugerencias = raw.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.TrimStart('-', '.', ' ', '"'))
                .Where(nombre => ejerciciosSeguros.Any(e => e.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase)))
                .Distinct()
                .Take(3)
                .ToList();

            if (sugerencias.Count == 0)
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            return Ok(new { ejerciciosRecomendados = sugerencias });
        }
    }
}
