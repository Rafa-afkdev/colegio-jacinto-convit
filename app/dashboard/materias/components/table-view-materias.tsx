import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Button } from "@/components/ui/button";
  import { LayoutList, SquarePen, Trash2 } from "lucide-react";
  import { Skeleton } from "@/components/ui/skeleton";  
import { Materias } from "@/interfaces/materias.interface";
import { ConfirmDeletion } from "./confirm-deletion-materias";
import { CreateUpdateMaterias } from "./create-update-materias";
import React from "react";

  export function TableMateriaView({
    materias,
    getMaterias,
    deleteMateria,
    isLoading,
  }: {
    materias: Materias[];
    getMaterias: () => Promise<void>;
    deleteMateria: (materias: Materias) => Promise<void>;
    isLoading: boolean;
  }) {
    return (
        <>

        <style>
        {`
          /* Estilo general del scroll */
          .custom-scroll {
            scrollbar-width: thin; /* Ancho del scroll */
            scrollbar-color: white transparent; /* Color del thumb y track */
          }

          /* Estilo para navegadores basados en WebKit (Chrome, Safari, etc.) */
          .custom-scroll::-webkit-scrollbar {
            width: 8px; /* Ancho del scroll */
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: transparent; /* Fondo del track */
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: white; /* Color del thumb */
            border-radius: 4px; /* Bordes redondeados */
          }

          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #f0f0f0; /* Cambio de color al pasar el mouse */
          }
        `}
      </style>
      <div className="custom-scroll max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Materia</TableHead>
              <TableHead>Nombre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              materias &&
              materias.map((materia) => (
                <TableRow key={materia.id}>
                  <TableCell>{materia.id_materia}</TableCell>
                  <TableCell>{materia.nombre}</TableCell>
                 
                  <TableCell>
                    <CreateUpdateMaterias getMaterias={getMaterias} materiaToUpdate={materia}>
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateMaterias>
                    <ConfirmDeletion deleteMateria={deleteMateria} materia={materia}>
                    <Button
                          variant="outline"
                          className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </ConfirmDeletion>
                  </TableCell>
                </TableRow>
              ))}
            {isLoading &&
              [1, 1, 1].map((e, i) => (
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
        {!isLoading && materias.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron registros existentes</h2>
          </div>
        )}
      </div>
      </>

    );
  }