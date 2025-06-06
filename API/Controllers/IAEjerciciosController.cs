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



        private string NormalizarZona(string zona)
        {
            if (string.IsNullOrWhiteSpace(zona))
                return "";

            zona = zona.ToLower().Trim();

            if (zona == "columna vertebral")
                return "columna";
            if (zona == "core")
                return "abdomen";
            if (zona == "bíceps")
                return "biceps";
            if (zona == "tríceps")
                return "triceps";

            return zona;
        }


        private List<string> ObtenerZonasAfectadas(List<PadecimientoIADTO> padecimientos)
        {
            return padecimientos
                .SelectMany(p => (p.AreaMuscular ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(z => NormalizarZona(z)))
                .Distinct()
                .ToList();
        }

        private List<string> ObtenerTodasZonas(List<EjercicioDTO> ejerciciosDisponibles)
        {
            return ejerciciosDisponibles
                .SelectMany(e => (e.AreaMuscularAfectada ?? e.AreaMuscular ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(z => NormalizarZona(z)))
                .Distinct()
                .ToList();
        }
        [HttpPost("recomendar")]
        public async Task<IActionResult> Recomendar([FromBody] RecomendacionIARequest request)
        {
            var cliente = await _context.Clientes
                .Include(c => c.PadecimientosClientes)
                    .ThenInclude(pc => pc.Padecimiento)
                .FirstOrDefaultAsync(c => c.IdUsuario == request.IdCliente);

            if (cliente == null)
                return NotFound("Cliente no encontrado");

            var padecimientos = cliente.PadecimientosClientes
                .Select(pc => new PadecimientoIADTO
                {
                    Nombre = pc.Padecimiento.Nombre,
                    AreaMuscular = pc.Padecimiento.AreaMuscularAfectada,
                    Severidad = pc.Severidad
                })
                .ToList();

            var ejerciciosDisponibles = await _context.Ejercicios
                .Select(e => new EjercicioDTO
                {
                    Nombre = e.Nombre,
                    Descripcion = e.Descripcion,
                    AreaMuscular = e.AreaMuscular,
                    AreaMuscularAfectada = e.AreaMuscularAfectada,
                    Dificultad = e.Dificultad,
                    Repeticiones = e.Repeticiones
                })
                .ToListAsync();

            var ejerciciosSeguros = ejerciciosDisponibles
                .Where(ej =>
                {
                    var zonasEjercicio = (ej.AreaMuscularAfectada ?? ej.AreaMuscular ?? "")
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(z => NormalizarZona(z));

                    bool afectaZonaGrave = zonasEjercicio.Any(zonaEj =>
                        padecimientos.Any(p =>
                            string.Equals(p.Severidad, "grave", StringComparison.OrdinalIgnoreCase) &&
                            !string.IsNullOrEmpty(p.AreaMuscular) &&
                            p.AreaMuscular
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(z => NormalizarZona(z))
                                .Contains(zonaEj)
                        )
                    );

                    bool afectaZonaModeradoLeve = zonasEjercicio.Any(zonaEj =>
                        padecimientos.Any(p =>
                            (string.Equals(p.Severidad, "moderado", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(p.Severidad, "leve", StringComparison.OrdinalIgnoreCase)) &&
                            !string.IsNullOrEmpty(p.AreaMuscular) &&
                            p.AreaMuscular
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(z => NormalizarZona(z))
                                .Contains(zonaEj)
                        )
                    );

                    if (padecimientos.Count == 0)
                    {
                        return true;
                    }
                    else if (afectaZonaGrave)
                    {
                        return string.Equals(ej.Dificultad, "baja", StringComparison.OrdinalIgnoreCase);
                    }
                    else if (afectaZonaModeradoLeve)
                    {
                        return ej.Dificultad != null &&
                               (string.Equals(ej.Dificultad, "baja", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(ej.Dificultad, "media", StringComparison.OrdinalIgnoreCase));
                    }
                    else
                    {
                        return true;
                    }
                })
                .ToList();

            Console.WriteLine($"Ejercicios seguros: {ejerciciosSeguros.Count}");
            foreach (var e in ejerciciosSeguros)
                Console.WriteLine($"- {e.Nombre} ({e.AreaMuscular})");

            if (ejerciciosSeguros.Count == 0)
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            var zonasAfectadas = ObtenerZonasAfectadas(padecimientos);
            var zonasNoAfectadas = ObtenerTodasZonas(ejerciciosDisponibles)
                .Where(z => !zonasAfectadas.Contains(z))
                .ToList();

            var prompt = $@"Eres un experto en salud y entrenamiento físico.
Debes recomendar ejercicios seguros para el cliente {request.NombreCliente} según sus padecimientos y severidad.";

            if (padecimientos.Count == 0)
            {
                prompt += "\n\nEl cliente NO TIENE padecimientos.";
            }
            else
            {
                prompt += "\n\nPadecimientos del cliente:";
                foreach (var p in padecimientos)
                    prompt += $"\n- {p.Nombre} (Área: {p.AreaMuscular}, Severidad: {p.Severidad})";

                prompt += "\n\nÁreas musculares NO afectadas, donde sí puede recomendar ejercicios:";
                foreach (var z in zonasNoAfectadas)
                    prompt += $"\n- {z}";
            }

            // 🚀 BLOQUE OPTIMIZADO → agrupado por área
            prompt += "\n\nEjercicios disponibles (agrupados por área, NO inventes nuevos):";

            var ejerciciosPorArea = ejerciciosSeguros
                .GroupBy(e => NormalizarZona(e.AreaMuscular))
                .OrderBy(g => g.Key);

            foreach (var grupo in ejerciciosPorArea)
            {
                var nombres = grupo.Select(e => e.Nombre).Distinct().ToList();
                prompt += $"\n{grupo.Key.ToUpper()}: {string.Join(", ", nombres)}";
            }

            // 🚀 INSTRUCCIONES PRO
            prompt += @"

INSTRUCCIONES:
1. Devuelve los ejercicios AGRUPADOS POR ÁREA MUSCULAR. Ejemplo:

PECHO:
- Press banca plano
- Aperturas con mancuernas

ESPALDA:
- Remo
- Dominadas

2. Si alguna de las áreas musculares NO afectadas NO tiene ejercicios, igualmente incluye el encabezado del área y debajo escribe: 'Sin ejercicios recomendables'.

3. Si el cliente no tiene padecimientos, recomienda al menos 2 ejercicios por cada área disponible.

4. Si el cliente sí tiene padecimientos, sugiere ejercicios seguros agrupados por área (al menos 1-2 por área permitida).

5. No inventes ejercicios nuevos.

6. Si el cliente no puede realizar ningún ejercicio, responde exactamente: 'Ningún ejercicio es apto para este cliente'.
";

            Console.WriteLine("======== PROMPT ENVIADO A OPENAI ========");
            Console.WriteLine(prompt);
            Console.WriteLine("========================================");

            // 🚀 MAX TOKENS = 2000
            var requestBody = new
            {
                model = "gpt-3.5-turbo",
                messages = new[] { new { role = "user", content = prompt } },
                max_tokens = 2000
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

            Console.WriteLine("======== RAW RESPONSE DE OPENAI ========");
            Console.WriteLine(raw);
            Console.WriteLine("=======================================");

            if (raw.Contains("Ningún ejercicio es apto para este cliente", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            var sugerencias = raw.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line =>
                {
                    var match = System.Text.RegularExpressions.Regex.Match(line, @"\d+\.\s*(.*)");
                    string nombre = match.Success ? match.Groups[1].Value.Trim() : line.TrimStart('-', '.', ' ', '"').Trim();

                    int parenIndex = nombre.LastIndexOf(" (");
                    if (parenIndex > 0)
                    {
                        nombre = nombre.Substring(0, parenIndex).Trim();
                    }

                    return nombre;
                })
                .Where(nombre => ejerciciosSeguros.Any(e => e.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase)))
                .Distinct()
                .Take(50)
                .ToList();

            if (sugerencias.Count == 0)
            {
                return Ok(new { ejerciciosRecomendados = new List<string> { "Ningún ejercicio es apto para este cliente" } });
            }

            var resultado = ejerciciosSeguros
                .Where(e => sugerencias.Contains(e.Nombre))
                .Select(e => new EjercicioIARespuesta
                {
                    Nombre = e.Nombre,
                    Descripcion = e.Descripcion,
                    AreaMuscular = e.AreaMuscular,
                    Dificultad = e.Dificultad,
                    Repeticiones = e.Repeticiones,
                    AreaAfectada = e.AreaMuscularAfectada ?? e.AreaMuscular
                })
                .ToList();

            return Ok(new { ejerciciosRecomendados = resultado });
        }


    }
}
