import { Timestamp } from "firebase/firestore";

export interface Materias {
    id?: string,
    id_materia: string,
    nombre: string,
    año: string,
    seccion: string,
    createdAt?: Timestamp; 
}