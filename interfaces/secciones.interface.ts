import { Timestamp } from "firebase/firestore";

export interface Secciones {
    id?: string,
    año_seccion: string,
    seccion: string,
    capacidad: number,
    inscritos?: number,
    año_escolar: string,
    docente_tutor: string,
    createdAt?: Timestamp;
}