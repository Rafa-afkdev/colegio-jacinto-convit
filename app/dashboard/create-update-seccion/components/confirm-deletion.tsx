import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"  
import { Secciones } from "@/interfaces/secciones.interface";
import React from "react"; // <-- Agrega esto


  export function ConfirmDeletion({children, deleteSeccion, seccion}: {children: React.ReactNode, deleteSeccion: (seccion: Secciones) => Promise<void>; seccion: Secciones }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
        {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estas seguro que deseas eliminar esta seccioón?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona En Confirmar Para Eliminar La seccion. Recuerda que al eliminar esta seccion, puede afectar a tus registros a largo plazo
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deleteSeccion(seccion)}
            >
            Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  