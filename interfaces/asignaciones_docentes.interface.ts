import { Timestamp } from "firebase/firestore";

export interface AsignacionesDocentes {
id: string,
docente_id: string,
docente_name: string,
docente_apellidos: string,
materia_id: string,
materia_nombre: string,
año_seccion: string,
seccion_id: string,
año_escolar: string,
createdAt?: Timestamp;
}
