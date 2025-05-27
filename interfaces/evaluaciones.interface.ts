import { Timestamp } from "firebase/firestore"

export interface Evaluaciones {
id: string,
id_evaluacion: string,
nombre_evaluacion: string,
tipo_evaluacion: string,
lapsop_id: string,
materia_id: string,
materia_nombre: string; // Nuevo campo
año_seccion: string;
seccion_id: string,
docente_id: string,
criterios: ContenidoCriterios[];
nota_definitiva: number,
fecha: string,
createdAt: Timestamp,
status: string,
periodo_escolar: string,
}

export interface ContenidoCriterios{
    nro_criterio: string
    nombre: string,
    ponderacion: number
}