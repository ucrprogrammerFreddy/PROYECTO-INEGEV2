using System.ComponentModel.DataAnnotations;

namespace PowerVital.DTOs
{
    public class EjercicioRutinaDTO
    {
        [Required(ErrorMessage = "El campo IdRutina es obligatorio.")]
        public int IdRutina { get; set; }

        [Required(ErrorMessage = "El campo IdEjercicio es obligatorio.")]
        public int IdEjercicio { get; set; }

        [StringLength(300, ErrorMessage = "El comentario no puede exceder los 300 caracteres.")]
        public string Comentario { get; set; }
    }
}
