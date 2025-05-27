/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, getDocs, query, where } from "firebase/firestore";
import { addDocument, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { Timestamp } from "firebase/firestore";
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
} from "@/components/ui/alert-dialog";

interface CreatePeriodoEscolarProps {
  children: React.ReactNode;
  getPeriodos_Escolares: () => Promise<void>;
}

export function CreateUpdatePeriodoEscolar({
  children,
  getPeriodos_Escolares,
}: CreatePeriodoEscolarProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [openAlert, setOpenAlert] = useState<boolean>(false); // Estado para controlar el AlertDialog


  // Validation schema for period
  const formSchema = z.object({
    periodo: z.string()
    .regex(/^\d{4}-\d{4}$/, "El formato debe ser AAAA-AAAA")
    .refine(value => {
      const [inicio, fin] = value.split('-');
      return parseInt(fin) === parseInt(inicio) + 1;
    }, "El segundo año debe ser exactamente un año después del primero"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodo: "",
    },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Check if the period already exists
      const q = query(
        collection(db, "periodos_escolares"),
        where("periodo", "==", data.periodo)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("Ya existe un periodo escolar con este año");
        setIsLoading(false);
        return;
      }

         // Verificar si ya existe un período escolar activo
    const qPeriodoActivo = query(
      collection(db, "periodos_escolares"),
      where("status", "==", "ACTIVO")
    );
    const querySnapshotPeriodoActivo = await getDocs(qPeriodoActivo);
    if (!querySnapshotPeriodoActivo.empty) {
      toast.error("Ya existe un periodo escolar activo.");
      setIsLoading(false);
      return;
    }

      // Create new period
      const newPeriodo: Omit<PeriodosEscolares, "id"> = {
        periodo: data.periodo,
        status: "ACTIVO",
        createdAt: Timestamp.now(),
      };
      await addDocument("periodos_escolares", newPeriodo);

      toast.success("Periodo escolar creado exitosamente");
      getPeriodos_Escolares();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        {/* Trigger for the AlertDialog */}
        <AlertDialogTrigger asChild onClick={() => setOpenAlert(true)}>
          {children}
        </AlertDialogTrigger>

        {/* Content of the AlertDialog */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas aperturar un nuevo año escolar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlert(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpenAlert(false); // Cierra el AlertDialog
                setOpen(true); // Abre el Dialog de creación
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* The Dialog for creating a new period */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Periodo Escolar</DialogTitle>
              <DialogDescription>
                Ingrese el nuevo periodo escolar en formato AAAA-AAAA
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="periodo" className="text-right">
                  Periodo Escolar
                </Label>
                <Input
                  {...register("periodo")}
                  id="periodo"
                  type="text"
                  placeholder="Ej: 2024-2025"
                  className="col-span-2"
                  maxLength={9}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.replace(/[^0-9]/g, "");
                    if (input.value.length > 4) {
                      input.value =
                        input.value.slice(0, 4) +
                        "-" +
                        input.value.slice(4, 8);
                    }
                  }}
                />
                {errors.periodo && (
                  <p className="text-red-500 col-span-3 text-center">
                    {errors.periodo.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Periodo Escolar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}