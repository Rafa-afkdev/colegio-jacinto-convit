import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import React from "react"; // <-- Agrega esto
  // import {
  //   DropdownMenu,
  //   DropdownMenuContent,
  //   DropdownMenuItem,
  //   DropdownMenuTrigger,
  // } from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";
  import { LayoutList, SquarePen, Trash2 } from "lucide-react";
  import { Skeleton } from "@/components/ui/skeleton";
import { CreateUpdateSecciones } from "./create-update-seccion";
import { Secciones } from "@/interfaces/secciones.interface";
import { ConfirmDeletion } from "./confirm-deletion";
  
  export function TableSeccionView({
    secciones,
    getSecciones,
    deleteSeccion,
    isLoading
  }: {
    secciones: Secciones[];
    getSecciones: () => Promise<void>;
    deleteSeccion: (seccion: Secciones) => Promise<void>;
    
    isLoading: boolean
  }) {
    return (
      <>
<Table >
        <TableHeader>
          <TableRow>
            <TableHead>Año</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Inscrito</TableHead>
            <TableHead>Año Escolar</TableHead>
            <TableHead>Docente Tutor</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody> 
          {!isLoading && secciones && secciones.map((seccion) => (
            <TableRow
              key={seccion.id}
            >
              <TableCell>{seccion.año_seccion} {seccion.seccion}</TableCell>
              <TableCell>{seccion.capacidad}</TableCell>
              <TableCell>{seccion.inscritos}</TableCell>
              <TableCell>{seccion.año_escolar}</TableCell>
              <TableCell>{seccion.docente_tutor}</TableCell>

              <TableCell>
                <CreateUpdateSecciones
                  getSecciones={getSecciones}
                  seccionToUpdate={seccion}
                >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                      <SquarePen className="w-4 h-4" />
                      </Button>
                </CreateUpdateSecciones>
                <ConfirmDeletion deleteSeccion={deleteSeccion} seccion={seccion}>
                <Button
                          variant="outline"
                          className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                                              <Trash2 />
                  </Button>
                </ConfirmDeletion>
              </TableCell>
            </TableRow>
          ))}
  
  {isLoading && [1, 1, 1].map((e, i) => (
    <TableRow key={i}>
      <TableCell>
        <Skeleton className="w-full h-4" />
      </TableCell>
  
      <TableCell>
        <Skeleton className="w-full h-4" />
      </TableCell>
  
      <TableCell>
        <Skeleton className="w-full h-4" />
      </TableCell>
  
      <TableCell>
        <Skeleton className="w-full h-4" />
      </TableCell>
  
      <TableCell>
        <Skeleton className="w-full h-4" />
      </TableCell>
    </TableRow>
  ))}
  
          
  
        </TableBody>
        <TableFooter></TableFooter>
      </Table>
      {!isLoading && secciones.length === 0 &&
        <div className="text-gray-200 my-20">
          <div className="flex justify-center">
            <LayoutList className="w-[120px] h-[120px]"/>
          </div>
          <h2 className="text-center">
          No se encontraron secciones existentes
          </h2>
          
          </div>
      }
      </>
  
    );
  }
  