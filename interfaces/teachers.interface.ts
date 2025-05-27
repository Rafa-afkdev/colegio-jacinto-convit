import { Timestamp } from "firebase/firestore";

export interface Teachers {
   uid: string,
   image: TeacherImage,
   cedula: string,
   name: string,
   apellidos: string,
   telefono: string,
   email: string,
   password: string,
   rol: string,
   permiso: string,
   createdAt?: Timestamp,
}

export interface TeacherImage {
    path: string,
    url: string
}