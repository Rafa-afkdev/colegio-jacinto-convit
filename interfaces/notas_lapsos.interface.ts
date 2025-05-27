export interface NotasLapsos {
    id: string;
    seccion: string;
    materia: string;
    id_lapso: string;
    lapso: string;
    docente: string;
    contenido: string;
    fecha: string;
    // Nuevo campo: array de estudiantes con sus notas
    estudiantes: EstudianteNota[];
}

export interface CriteriosEvaluacion {
    nombre: string;
    ponderacion: string;
}

// Nueva interfaz para las notas de cada estudiante
export interface EstudianteNota {
    id_estudiante: string;
    nombre_estudiante: string;
    notas: NotaCriterio[]; // Notas por criterio
    nota_final?: string;   // Opcional: nota final calculada
}

// Nueva interfaz para detallar la nota de un criterio
export interface NotaCriterio {
    numero_criterio: string,
    nombre_criterio: string; // Relacionado con "nombre" de CriteriosEvaluacion
    valor: string;           // Nota obtenida (ej: "18/20" o "9.5")
}