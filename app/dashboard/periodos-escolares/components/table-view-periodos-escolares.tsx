/* eslint-disable react/no-unescaped-entities */
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
import { CalendarX, LayoutList, MoreHorizontal, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db, updateDocument } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import toast from "react-hot-toast";
import React from "react";

export function TableViewPeriodoEscolar({
  periodos_escolares,
  deletePeriodo_escolar,
  getPeriodosEscolares,
  isLoading,
}: {
  periodos_escolares: PeriodosEscolares[];
  deletePeriodo_escolar: (periodo_escolar: PeriodosEscolares) => Promise<void>;
  getPeriodosEscolares: () => Promise<void>; 
  isLoading: boolean;
}) {
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodosEscolares | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Función para confirmar el cambio de estado
  const confirmStatusChange = (periodo_escolar: PeriodosEscolares) => {
    setSelectedPeriodo(periodo_escolar);
    setOpenDialog(true);
  };

  const updateStudentsToRetired = async (periodoId: string) => {
    try {
      const estudiantesRef = collection(db, "estudiantes");
        const q = query(estudiantesRef, where("estado", "==", "INSCRITO"));
        const querySnapshot = await getDocs(q);
        const updates = querySnapshot.docs.map(async (doc) => {
        await updateDoc(doc.ref, { estado: "RETIRADO" });
      });
        await Promise.all(updates);  
      console.log(`Todos los estudiantes del período ${periodoId} han sido actualizados a RETIRADO.`);
    } catch (error) {
      console.error("Error al actualizar estudiantes a RETIRADO:", error);
    }
  };
  // Función para actualizar el estado del período escolar a "INACTIVO"
  const setPeriodoInactivo = async () => {
    if (!selectedPeriodo) return;
    try {
      await updateDocument(`periodos_escolares/${selectedPeriodo.id}`, { status: "INACTIVO" });
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido actualizado a INACTIVO.`);
      if (selectedPeriodo.id) {
        await updateStudentsToRetired(selectedPeriodo.id);
      } else {
        console.error("El ID del período seleccionado es indefinido.");
      }
      toast.success(`El periodo escolar ${selectedPeriodo.periodo} ha sido clausurado`, {duration: 3000});
      await getPeriodosEscolares();
    } catch (error) {
      console.error("Error al actualizar el estado del período escolar:", error);
    } finally {
      setOpenDialog(false);
      setSelectedPeriodo(null);
    }
  };

  // Función para eliminar un período escolar
  const handleDelete = async () => {
    if (!selectedPeriodo) return;
    try {
      await deletePeriodo_escolar(selectedPeriodo);
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido eliminado.`);
    } catch (error) {
      console.error("Error al eliminar el período escolar:", error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPeriodo(null);
    }
  };

  return (
    <>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading &&
            periodos_escolares &&
            periodos_escolares.map((periodo_escolar) => (
              <TableRow key={periodo_escolar.id}>
                <TableCell>{periodo_escolar.periodo}</TableCell>
                <TableCell
                  className={
                    periodo_escolar.status === "ACTIVO"
                      ? "text-green-600 font-semibold"
                      : periodo_escolar.status === "INACTIVO"
                      ? "text-red-600 font-semibold"
                      : ""
                  }
                >
                  {periodo_escolar.status}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {periodo_escolar.status === "ACTIVO" && (
                        <DropdownMenuItem                         className="text-blue-600"
                        onClick={() => confirmStatusChange(periodo_escolar)}>
                          <CalendarX className="mr-2 h-4 w-4" />
                          
                          Cerrar Periodo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedPeriodo(periodo_escolar);
                          setOpenDeleteDialog(true);
                        }}
                      >
                                    <Trash2 className="mr-2 h-4 w-4" />

                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          {isLoading &&
            [1, 1, 1].map((_, i) => (
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
              </TableRow>
            ))}
        </TableBody>
        <TableFooter></TableFooter>
      </Table>

      {!isLoading && periodos_escolares.length === 0 && (
        <div className="text-gray-200 my-20">
          <div className="flex justify-center">
          <LayoutList className="w-[120px] h-[120px]"/>
          </div>
          <h2 className="text-center">No se encontraron periodos escolares existentes</h2>
        </div>
      )}

      {/* Dialog de confirmación para cambiar estado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
          </DialogHeader>
          <p>¿Deseas cambiar el estado del período escolar {selectedPeriodo?.periodo} a INACTIVO?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={setPeriodoInactivo}>
            Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar este período escolar?</AlertDialogTitle>
            <AlertDialogDescription>
              Presiona en "Confirmar" para eliminar este período escolar. Recuerda que esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
