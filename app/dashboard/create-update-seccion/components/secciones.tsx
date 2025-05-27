/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { deleteDocument, getCollection } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ClipboardEdit } from "lucide-react";
import { orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import type { Secciones } from "@/interfaces/secciones.interface";
import { CreateUpdateSecciones } from "./create-update-seccion";
import { TableSeccionView } from "./table-view-secciones";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react"; // <-- Agrega esto

const Secciones = () => {

    const user = useUser();
    const [secciones, setSecciones] = useState<Secciones[]>([])
    const [isLoading, setisLoading] = useState<boolean>(true)

    const getSecciones = async() => {
        const path = `secciones`
        const query = [
            orderBy('año_seccion', 'asc'),
            // orderBy('seccion', 'asc'),
            // where('cedula', '==', 31058014)
        ]
        setisLoading(true);
        try {
           const res = await getCollection(path, query) as Secciones[];
           console.log(res);

           setSecciones(res)
            
        } catch (error) {
          toast.error('Ocurrió un error. Intenta nuevamente.');

        }finally{
            setisLoading(false);
        }
    }

    useEffect(() => {
        if(user) getSecciones();      
    }, [user])

    //TODO ===== // ELIMINAR UN ESTUDIANTE //======== ///

    const deleteSeccion = async (seccion: Secciones) => {
        const path = `secciones/${seccion.id}`;
        setisLoading(true);
    
        try {
    
          await deleteDocument(path);
          toast.success("La seccion fue eliminado exitosamente");
            const newStudents = secciones.filter(i => i.id !== seccion.id);
            setSecciones(newStudents);
        } catch (error: any) {
          toast.error(error.message, { duration: 2500 });
        } finally {
          setisLoading(false);
        }
      };
    

      return (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Secciones</CardTitle>
                <CreateUpdateSecciones getSecciones={getSecciones}>
                  <Button variant="outline">
                    Crear Nueva Sección
                    <ClipboardEdit className="ml-2 w-5" />
                  </Button>
                </CreateUpdateSecciones>
              </div>
              <CardDescription>
              </CardDescription>
            </CardHeader>
      
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <TableSeccionView 
                  deleteSeccion={deleteSeccion}
                  getSecciones={getSecciones}
                  secciones={secciones}
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>
        </>
      );
    }
export default Secciones;