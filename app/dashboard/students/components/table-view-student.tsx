import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Students } from "@/interfaces/students.interface";
import { Button } from "@/components/ui/button";
import { LayoutList, SquarePen, Trash2 } from "lucide-react";
import { CreateUpdateStudents } from "./create-update-students.form";
import { ConfirmDeletion } from "./confirm-deletion";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function TableStudentView({
  students,
  getStudents,
  deleteStudent,
  isLoading,
}: {
  students: Students[];
  getStudents: () => Promise<void>;
  deleteStudent: (student: Students) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <>
      {/* Estilos personalizados para el scroll */}
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

      {/* Contenedor principal con scroll personalizado */}
      <div className="custom-scroll max-h-[600px] overflow-y-auto  rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cedula</TableHead>
              <TableHead>Nombres & Apellidos</TableHead>
              <TableHead>Año</TableHead>
              {/* <TableHead>Sección</TableHead> */}
              <TableHead>Periodo Escolar</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              students &&
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.cedula}</TableCell>
                  <TableCell>
                    {student.nombres + " " + student.apellidos}
                  </TableCell>
                  <TableCell
                    className={
                      !student.año_actual ? "text-red-600 font-semibold" : ""
                    }
                  >
                    {student.año_actual + " " + student.seccion_actual ||
                      "NINGUNO"}
                  </TableCell>
                  {/* <TableCell className={!student.seccion_actual ? "text-red-600 font-semibold" : ""}>
  {student.seccion_actual || "NINGUNO"}
</TableCell> */}
                  <TableCell
                    className={
                      !student.periodo_escolar_actual
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {student.periodo_escolar_actual || "NINGUNO"}
                  </TableCell>
                  <TableCell
                    className={
                      student.estado === "INSCRITO"
                        ? "text-green-600 font-semibold"
                        : student.estado === "RETIRADO"
                        ? "text-red-600 font-semibold"
                        : "text-blue-600 font-semibold"
                    }
                  >
                    {student.estado || "SIN ASIGNAR"}
                  </TableCell>
                  <TableCell>
                    <CreateUpdateStudents
                      getStudents={getStudents}
                      studentToUpdate={student}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                      {/* Agregar mx-1 para separación */}
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateStudents>
                    <ConfirmDeletion
                      deleteStudent={deleteStudent}
                      student={student}
                    >
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
        {!isLoading && students.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">
              No se encontraron registros existentes
            </h2>
          </div>
        )}
      </div>
    </>
  );
}
