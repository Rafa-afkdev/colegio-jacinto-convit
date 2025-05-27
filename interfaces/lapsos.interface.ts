import { Timestamp } from "firebase/firestore";

export interface LapsosEscolares {
    id?: string,
    id_lapso: string,
    nombre: string,
    año_escolar: string,
    status: string,
    createdAt?: Timestamp;
}