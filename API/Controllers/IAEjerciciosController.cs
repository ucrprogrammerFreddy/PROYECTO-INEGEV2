using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PowerVital.Data;
using PowerVital.DTO;
using PowerVital.DTOs;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;

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
            try
            {
                Console.WriteLine($"🚀 Iniciando recomendación IA para cliente: {request.NombreCliente}");

                _httpClient.Timeout = TimeSpan.FromSeconds(60);

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
                        IdEjercicio = e.IdEjercicio,
                        Nombre = e.Nombre,
                        Descripcion = e.Descripcion,
                        AreaMuscular = e.AreaMuscular,
                        AreaMuscularAfectada = e.AreaMuscularAfectada,
                        Dificultad = e.Dificultad,
                        Repeticiones = e.Repeticiones,
                        GuiaEjercicio = e.GuiaEjercicio
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
                                (p.AreaMuscular ?? "")
                                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                    .Select(z => NormalizarZona(z))
                                    .Contains(zonaEj)
                            )
                        );

                        bool afectaZonaModeradoLeve = zonasEjercicio.Any(zonaEj =>
                            padecimientos.Any(p =>
                                (p.Severidad.Equals("moderado", StringComparison.OrdinalIgnoreCase) ||
                                 p.Severidad.Equals("leve", StringComparison.OrdinalIgnoreCase)) &&
                                (p.AreaMuscular ?? "")
                                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                    .Select(z => NormalizarZona(z))
                                    .Contains(zonaEj)
                            )
                        );

                        if (padecimientos.Count == 0)
                            return true;
                        else if (afectaZonaGrave)
                            return ej.Dificultad?.Equals("baja", StringComparison.OrdinalIgnoreCase) == true;
                        else if (afectaZonaModeradoLeve)
                            return ej.Dificultad != null &&
                                (ej.Dificultad.Equals("baja", StringComparison.OrdinalIgnoreCase) ||
                                 ej.Dificultad.Equals("media", StringComparison.OrdinalIgnoreCase));
                        else
                            return true;
                    })
                    .ToList();

                Console.WriteLine($"✅ Ejercicios seguros encontrados: {ejerciciosSeguros.Count}");

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

                prompt += "\n\nEjercicios disponibles (agrupados por área, NO inventes nuevos):";
                prompt += $"\n\nCantidad de ejercicios seguros detectados: {ejerciciosSeguros.Count}";

                var ejerciciosPorArea = ejerciciosSeguros
                    .GroupBy(e => NormalizarZona(e.AreaMuscular))
                    .OrderBy(g => g.Key);

                foreach (var grupo in ejerciciosPorArea)
                {
                    var nombres = grupo.Select(e => e.Nombre).Distinct().ToList();
                    prompt += $"\n{grupo.Key.ToUpper()}: {string.Join(", ", nombres)}";
                }

                prompt += @"

INSTRUCCIONES:
1. Devuelve los ejercicios AGRUPADOS POR ÁREA MUSCULAR.
2. Incluye áreas sin ejercicios como: 'Sin ejercicios recomendables'.
3. Si el cliente no tiene padecimientos, recomienda mínimo 2 por área.
4. Si tiene padecimientos, sugiere seguros por área.
5. No inventes ejercicios nuevos.
6. Si no puede hacer ninguno, responde: 'Ningún ejercicio es apto para este cliente'.
";

                Console.WriteLine("📤 Enviando prompt a OpenAI...");

                var requestBody = new
                {
                    model = "gpt-3.5-turbo-1106",
                    messages = new[] { new { role = "user", content = prompt } },
                    max_tokens = 2000
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config["OpenAI:ApiKey"]}");

                var sw = Stopwatch.StartNew();
                var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
                sw.Stop();
                Console.WriteLine($"⏱️ Tiempo de respuesta: {sw.Elapsed.TotalSeconds} s");

                var resultJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("❌ Error OpenAI:");
                    Console.WriteLine(resultJson);
                    return StatusCode((int)response.StatusCode, "Error OpenAI: " + resultJson);
                }

                using var doc = JsonDocument.Parse(resultJson);
                var raw = doc.RootElement.GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                Console.WriteLine("📩 Respuesta de OpenAI:");
                Console.WriteLine(raw);

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
                            nombre = nombre.Substring(0, parenIndex).Trim();

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
                        IdEjercicio = e.IdEjercicio,
                        Nombre = e.Nombre,
                        Descripcion = e.Descripcion,
                        AreaMuscular = e.AreaMuscular,
                        Dificultad = e.Dificultad,
                        Repeticiones = e.Repeticiones,
                        AreaAfectada = e.AreaMuscularAfectada ?? e.AreaMuscular,
                        GuiaEjercicio = e.GuiaEjercicio
                    })
                    .ToList();

                return Ok(new { ejerciciosRecomendados = resultado });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Excepción inesperada:");
                Console.WriteLine(ex.ToString());
                return StatusCode(500, "Error interno del servidor: " + ex.Message);
            }
        }














    } // ← Fin de la clase IAEjerciciosController
} // ← Fin del namespace
