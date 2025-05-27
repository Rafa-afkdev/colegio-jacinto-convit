 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";

import {  useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardEdit, LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDocument, db, updateDocument } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Materias } from "@/interfaces/materias.interface";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateUpdateMateriasProps {
  children: React.ReactNode;
  materiaToUpdate?: Materias;
  getMaterias: () => Promise<void>;
}

export function CreateUpdateMaterias({
  children,
  materiaToUpdate,
  getMaterias,
}: CreateUpdateMateriasProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const formSchema = z.object({
    id_materia: z.string().min(3, "El ID es requerido"),
    nombre: z.string().min(3, "El nombre es requerido"),
    año: z.string().min(3, "El año es requerida"),
    seccion: z.string().min(1, "La seccion es requerida"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: materiaToUpdate
      ? {
          ...materiaToUpdate,
        }
      : {
          id_materia: "",
          nombre: "",
          año: "",
          seccion: "",
        },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  //  TODO ====== FUNCION DE SUBMIT =========///
  const onSubmit = async (materia: z.infer<typeof formSchema>) => {
    if (materiaToUpdate) {
      UpdateMateria(materia);
    } else {
      CreateMateria(materia);
    }
  };

  //TODO // CREAR UNA SECCION EN LA DATABASE ////

  const CreateMateria = async (materia: Materias) => {
    const path = `materias`;
    setIsLoading(true);

    try {
      const normalizedMateria = {
        ...materia,
        id_materia: materia.id_materia.trim().toUpperCase(),
        nombre: materia.nombre.trim().toUpperCase(),
        año: materia.año.trim().toUpperCase(),
        seccion: materia.seccion.trim().toUpperCase(),
      };

      // !  Verificar si existe una materia con la misma combinación de valores
      const idQuery = query(
        collection(db, "materias"),
        where("id_materia", "==", normalizedMateria.id_materia)
      );
      const idSnapshot = await getDocs(idQuery);
      
      if (!idSnapshot.empty) {
        toast.error("Ya existe una materia con este ID");
        setIsLoading(false);
        return;
      }

      // Verificar combinación única
      const comboQuery = query(
        collection(db, "materias"),
        where("nombre", "==", normalizedMateria.nombre),
        where("año", "==", normalizedMateria.año),
        where("seccion", "==", normalizedMateria.seccion)
      );
      const comboSnapshot = await getDocs(comboQuery);
      
      if (!comboSnapshot.empty) {
        toast.error("Ya existe una materia con esta combinación de año, sección y nombre");
        setIsLoading(false);
        return;
      }


      // Agregar el nuevo registro en la base de datos
      await addDocument(path, normalizedMateria);
      toast.success("La materia fue creada exitosamente");
      getMaterias();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  //TODO // ACTUALIZAR UNA SECCION EN LA DATABASE ////

  const UpdateMateria = async (materia: Materias) => {
    const path = `materias/${materiaToUpdate?.id}`;
    setIsLoading(true);

    try {
      const normalizedMateria = {
        ...materia,
        id_materia: materia.id_materia.trim().toUpperCase(),
        nombre: materia.nombre.trim().toUpperCase(),
        año: materia.año.trim().toUpperCase(),
        seccion: materia.seccion.trim().toUpperCase(),
      };
      // ! Verificar si existe una materia con la misma combinación de valores
      const idQuery = query(
        collection(db, "materias"),
        where("id_materia", "==", normalizedMateria.id_materia)
      );
      const idSnapshot = await getDocs(idQuery);
      
      if (!idSnapshot.empty) {
        toast.error("Ya existe una materia con este ID");
        setIsLoading(false);
        return;
      }

      // Verificar combinación única
      const comboQuery = query(
        collection(db, "materias"),
        where("nombre", "==", normalizedMateria.nombre),
        where("año", "==", normalizedMateria.año),
        where("seccion", "==", normalizedMateria.seccion)
      );
      const comboSnapshot = await getDocs(comboQuery);
      
      if (!comboSnapshot.empty) {
        toast.error("Ya existe una materia con esta combinación de año, sección y nombre");
        setIsLoading(false);
        return;
      }


      // Actualizar el registro en la base de datos
      await updateDocument(path, normalizedMateria);
      toast.success("La materia fue actualizada exitosamente");
      getMaterias();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[190vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {materiaToUpdate ? "Actualizar Materia" : "Agregar Materia"}
            </DialogTitle>
            <DialogDescription>
              {materiaToUpdate
                ? "Por favor, llena los campos para actualizar los datos de la materia"
                : "Por favor, llena los campos para registrar una materia."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* ID de la Materia */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="id_materia" className="text-right">
                ID de la Materia
              </Label>
              <Input
                {...register("id_materia")}
                id="id_materia"
                type="text"
                placeholder="Ingresa el ID de la materia"
                className="col-span-2"
                maxLength={20}
                onBlur={() => form.trigger("id_materia")}
              />
              {errors.id_materia && (
                <p className="text-red-500">{errors.id_materia.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                {...register("nombre")}
                id="nombre"
                type="text"
                placeholder="Ingresa el nombre de la materia"
                className="col-span-2"
                maxLength={18}
                onBlur={() => form.trigger("nombre")}
              />
              {errors.nombre && (
                <p className="text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            {/* Año */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="año" className="text-right">
                Año
              </Label>
              <div className="col-span-2">
                <Select
                  defaultValue={materiaToUpdate?.año}
                  value={form.watch("año")}
                  onValueChange={(value: string) => {
                    form.setValue("año", value, {
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el año académico">
                      {form.watch("año")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Año académico</SelectLabel>
                      <SelectItem value="1RO">1ro</SelectItem>
                      <SelectItem value="2DO">2do</SelectItem>
                      <SelectItem value="3RO">3ro</SelectItem>
                      <SelectItem value="4TO">4to</SelectItem>
                      <SelectItem value="5TO">5to</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

                        {/* Seccion */}
                        <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="seccion" className="text-right">
                Sección
              </Label>
              <div className="col-span-2">
                <Select
                  defaultValue={materiaToUpdate?.seccion}
                  value={form.watch("seccion")}
                  onValueChange={(value: string) => {
                    form.setValue("seccion", value, {
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona la seccion ">
                      {form.watch("seccion")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sección</SelectLabel>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardEdit className="mr-2 h-4 w-4" />
              )}
              {materiaToUpdate ? "Actualizar Materia" : "Agregar Materia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
