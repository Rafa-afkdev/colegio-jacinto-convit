export interface Notas {
    id: string,
    id_estudiante: string, 
    calificaciones: Calificaciones[],
    total: number,
    comentario: string,
    createdAt: string,
    evaluacion: string,
    docente_nombre: string,
    docente_id: string,
    lapso: string,
    materia: string,
    nombre_evaluacion: string,
    periodo_escolar: string,
    año_seccion: string,
    seccion: string,
    nombre_estudiante: string,
}   

export interface Calificaciones {
    nombre_criterio: string,
    puntacion: number,
}