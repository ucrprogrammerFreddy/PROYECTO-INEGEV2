using System.ComponentModel.DataAnnotations;

namespace PowerVital.Models
{
    public class EjercicioRutina
    {
        [Required(ErrorMessage = "El campo IdRutina es obligatorio.")]
        public int IdRutina { get; set; }

        public Rutina Rutina { get; set; }

        [Required(ErrorMessage = "El campo IdEjercicio es obligatorio.")]
        public int IdEjercicio { get; set; }

        public Ejercicio Ejercicio { get; set; }

        [StringLength(300, ErrorMessage = "El comentario no puede superar los 300 caracteres.")]
        public string Comentario { get; set; }
    }
}

