/* eslint-disable @typescript-eslint/no-unused-vars */
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { useState, useEffect } from "react";
// import DragAndDropImage from "@/components/ui/drag-and-drop-image";
import {
  addDocument,
  db,
  updateDocument,
  // uploadBase64,
} from "@/lib/firebase";
import toast from "react-hot-toast";
// import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as React from "react";
import { Secciones } from "@/interfaces/secciones.interface";
import { collection, getDocs, query, where } from "firebase/firestore";
import { User } from "@/interfaces/user.interface";

interface CreateUpdateSeccionesProps {
  children: React.ReactNode;
  seccionToUpdate?: Secciones;
  getSecciones: () => Promise<void>
}

export function CreateUpdateSecciones({
  children,
  seccionToUpdate,
  getSecciones
}: CreateUpdateSeccionesProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [docentes, setDocentes] = useState<User[]>([]);
  const [activePeriodos, setActivePeriodos] = useState<{
    active: { id: string; [key: string]: any }[];
    inactive: { id: string; [key: string]: any }[];
  }>({
    active: [],
    inactive: [],
  });

  // Obtener docentes
  useEffect(() => {
    const fetchDocentes = async () => {
      try {
        const q = query(
          collection(db, "users"), 
          where("rol", "==", "DOCENTE") // Asegúrate que tengas este campo
        );
        const querySnapshot = await getDocs(q);
        const docentesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid,
          cedula: doc.data().cedula,
          name: doc.data().name,
          apellidos: doc.data().apellidos,
          email: doc.data().email,
          rol: doc.data().rol,
          status: doc.data().status,
          password: doc.data().password || "", // Default value if missing
          createdAt: doc.data().createdAt || new Date().toISOString(), // Default value if missing
        }));
        setDocentes(docentesData);
      } catch (error) {
        toast.error("Error al cargar docentes");
      }
    };

    if (open) fetchDocentes();
  }, [open]);
  
    // Fetch active school periods
    useEffect(() => {
      const fetchPeriodos = async () => {
        try {
          const q = query(collection(db, "periodos_escolares"));
          const querySnapshot = await getDocs(q);
          
          const periods = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
    
          // Separa los periodos activos de los inactivos
          const active = periods.filter((periodo: any) => periodo.status === "ACTIVO");
          const inactive = periods.filter((periodo: any) => periodo.status === "INACTIVO");
    
          // Actualiza el estado con los periodos activos e inactivos
          setActivePeriodos({
            active,
            inactive
          });
        } catch (error: any) {
          toast.error("Error al cargar periodos escolares");
        }
      };
    
      if (open) {
        fetchPeriodos();
      }
    }, [open]);
    
  


// Corrige el schema de validación
const formSchema = z.object({
  año_seccion: z.string().min(1, "El año es requerido."), // Cambiado a min(1)
  seccion: z.string().min(1, "La sección es requerida."), // Cambiado a min(1)
  capacidad: z.coerce.number().min(1, "La capacidad mínima es 1"), // Validación realista
  año_escolar: z.string().min(1, "El año escolar es requerido"), // Validación realista
  docente_tutor: z.string().min(1, "El docente tutor es requerido"),
  inscritos: z.number().min(0, "No puede ser negativo").default(0).optional() // Permite 0

});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: seccionToUpdate
    ? {
        ...seccionToUpdate,
        inscritos: seccionToUpdate.inscritos || 0,
      }
    : {
        año_seccion: "",
        seccion: "",
        capacidad: undefined,
        inscritos: 0,
        docente_tutor: "",
      },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  //! SUBIR O ACTUALIZAR LA IMAGEN
  // const handleImage = (url: string) => {
  //   const path = studentToUpdate ? studentToUpdate.image.path : `${Date.now()}`;
  //   setValue("image", { url, path });
  //   setImage(url);
  // };

  // useEffect(() => {
  //   if (studentToUpdate) setImage(studentToUpdate.image.url);
  // }, [open]);




  //  TODO ====== FUNCION DE SUBMIT =========///
  const onSubmit = async (seccion: z.infer<typeof formSchema>) => {
    if (seccionToUpdate) {
      UpdateSeccion(seccion);
    } else {
      CreateSeccion(seccion);
    }
  };

  //TODO // CREAR UNA SECCION EN LA DATABASE ////

  const CreateSeccion = async (seccion: Secciones) => {
    const path = `secciones`;
    setIsLoading(true);
  
    try {
      const normalizedSecciones = {
        ...seccion,
        año_seccion: seccion.año_seccion.trim().toLowerCase(),
        seccion: seccion.seccion.trim().toUpperCase(),
        capacidad: Number(seccion.capacidad),
        // docente_tutor: seccion.docente_tutor.toUpperCase(),
        inscritos: seccion.inscritos ? Number(seccion.inscritos) : 0
      };
  
      // Verificar si existe una sección con la misma combinación de valores
      const q = query(
        collection(db, "secciones"),
        where("año_seccion", "==", normalizedSecciones.año_seccion),
        where("seccion", "==", normalizedSecciones.seccion),
        where("capacidad", "==", normalizedSecciones.capacidad),
        where("inscritos", "==", normalizedSecciones.inscritos),
        where("año_escolar", "==", normalizedSecciones.año_escolar),
        
      );
  
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error("Ya existe una sección con esta combinación de año, sección, capacidad, inscritos y año escolar");
        setIsLoading(false);
        return;
      }

      const docenteQuery = query(
        collection(db, "secciones"),
        where("docente_tutor", "==", normalizedSecciones.docente_tutor),
        where("año_escolar", "==", normalizedSecciones.año_escolar)
      );

      const docenteSnapshot = await getDocs(docenteQuery);
    
      if (!docenteSnapshot.empty) {
        toast.error("Este docente ya está asignado a otra sección en el mismo periodo escolar");
        setIsLoading(false);
        return;
      }
      
  
      // Agregar el nuevo registro en la base de datos
      await addDocument(path, normalizedSecciones);
      toast.success("La sección fue creada exitosamente");
      getSecciones();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  //TODO // ACTUALIZAR UNA SECCION EN LA DATABASE ////

  const UpdateSeccion = async (seccion: Secciones) => {
    const path = `secciones/${seccionToUpdate?.id}`;
    setIsLoading(true);
  
    try {
      const normalizedSecciones = {
        ...seccion,
        año_seccion: seccion.año_seccion.trim().toLowerCase(),
        seccion: seccion.seccion.trim().toUpperCase(),
        capacidad: Number(seccion.capacidad),
        // docente_tutor: seccion.docente_tutor.toUpperCase(),
        inscritos: seccion.inscritos ? Number(seccion.inscritos) : 0
      };

    if (normalizedSecciones.capacidad < normalizedSecciones.inscritos) {
      toast.error("La capacidad no puede ser menor que la cantidad de inscritos");
      setIsLoading(false);
      return;
    }

    const docenteQuery = query(
      collection(db, "secciones"),
      where("docente_tutor", "==", normalizedSecciones.docente_tutor),
      where("año_escolar", "==", normalizedSecciones.año_escolar)
    );
    
    const docenteSnapshot = await getDocs(docenteQuery);
    const isDocenteDuplicado = docenteSnapshot.docs.some(
      doc => doc.id !== seccionToUpdate?.id
    );

    if (isDocenteDuplicado) {
      toast.error("Este docente ya está asignado a otra sección en el mismo periodo escolar");
      setIsLoading(false);
      return;
    }
  
      // Verificar si existe una sección con la misma combinación de valores, excluyendo el actual
      const q = query(
        collection(db, "secciones"),
        where("año_seccion", "==", normalizedSecciones.año_seccion),
        where("seccion", "==", normalizedSecciones.seccion),
        where("capacidad", "==", normalizedSecciones.capacidad),
        where("inscritos", "==", normalizedSecciones.inscritos),
        where("año_escolar", "==", normalizedSecciones.año_escolar)
      );
  
      const querySnapshot = await getDocs(q);
      const isDuplicate = querySnapshot.docs.some(
        (doc) => doc.id !== seccionToUpdate?.id 
      );
  
      if (isDuplicate) {
        toast.error("Ya existe una sección con esta combinación de año, sección, capacidad, inscritos y año escolar");
        setIsLoading(false);
        return;
      }
  
      // Actualizar el registro en la base de datos
      await updateDocument(path, normalizedSecciones);
      toast.success("La sección fue actualizada exitosamente");
      getSecciones();
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
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {seccionToUpdate ? "Actualizar Sección" : "Crear Sección"}
            </DialogTitle>
            <DialogDescription>
              {seccionToUpdate
                ? " Por favor, llena los campos para actualizar los datos de la sección"
                : "Por favor, llena los campos para crear una nueva sección."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-8">
            {/* Image upload */}
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imagen" className="text-right">
                Imagen
              </Label>
              <div className="col-span-3">
                {image ? (
                  <>
                    <Image
                      width={100}
                      height={100}
                      src={image}
                      alt="student-image"
                      className="w-[30%] m-auto"
                    />
                    <Button
                      type="button"
                      onClick={() => handleImage("")}
                      disabled={isLoading}
                      className="mt-6"
                    >
                      Eliminar Imagen
                    </Button>
                  </>
                ) : (
                  <DragAndDropImage handleImage={handleImage} />
                )}
              </div>
            </div> */}

            <div className="grid grid-cols- gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Año */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="año" className="text-right">
                    Año
                  </Label>
                  <Input
                    {...register("año_seccion")}
                    id="año_seccion"
                    type="text"
                    placeholder="Ingrese el año"
                    className="col-span-2"
                    maxLength={3} // Evita que se escriban más de 11 caracteres
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 3) {
                        input.value = input.value.slice(0, 3);
                      }
                    }}
                    onBlur={() => {
                      form.trigger("año_seccion"); // Valida el campo manualmente al perder el foco
                    }}
                  />
                  {errors.año_seccion && (
                    <p className="text-red-500">{errors.año_seccion.message}</p>
                  )}
                </div>

{/* SECCION */}
<div className="grid grid-cols-3 items-center gap-6 ">
  <Label htmlFor="seccion" className="text-right">
    Sección
  </Label>
  <div className="col-span-2">
    <Select
      value={form.watch("seccion")}
      onValueChange={(value: string) => {
        form.setValue("seccion", value, { shouldValidate: true });
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona una Sección" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Secciones</SelectLabel>
          {["A", "B", "C", "D", "E", "F"].map((letra) => (
            <SelectItem key={letra} value={letra}>
              {letra}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</div>

                {/* CAPACIDAD */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="capacidad" className="text-right">
                    Capacidad
                  </Label>
                  <Input
                    {...register("capacidad")}
                    id="capacidad"
                    type="number"
                    inputMode="numeric"
                    placeholder="Capacidad máxima"
                    className="col-span-2"
                    maxLength={3} 
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 3) {
                        input.value = input.value.slice(0, 3);
                      }
                    }}
                    onBlur={() => {
                      form.trigger("capacidad"); 
                    }}
                  />
                  {errors.capacidad && (
                    <p className="text-red-500">{errors.capacidad.message}</p>
                  )}
                </div>

                {/* Año Escolar */}
<div className="grid grid-cols-3 items-center gap-4">
  <Label htmlFor="año_escolar" className="text-right">
    Periodo Escolar
  </Label>
  <div className="col-span-2">
    <Select
      value={form.watch("año_escolar")}
      onValueChange={(value: string) => {
        form.setValue("año_escolar", value, { shouldValidate: true });
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona Periodo Escolar" />
      </SelectTrigger>
      <SelectContent className="overflow-y-auto max-h-[200px]">
        <SelectGroup>
          <SelectLabel>Periodo Activo</SelectLabel>
          {activePeriodos.active.map((periodo: any) => (
            <SelectItem key={periodo.id} value={periodo.periodo}>
              {periodo.periodo}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Otros Periodos</SelectLabel>
          {activePeriodos.inactive.map((periodo: any) => (
            <SelectItem key={periodo.id} value={periodo.periodo}>
              {periodo.periodo}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
  {errors.año_escolar && (
    <p className="text-red-500 col-span-3">{errors.año_escolar.message}</p>
  )}
</div>

<div className="grid grid-cols-3 items-center gap-4">
    <Label htmlFor="docente_tutor" className="text-right">
      Docente Tutor
    </Label>
    <div className="col-span-2">
      <Select
        value={form.watch("docente_tutor")}
        onValueChange={(value) => 
          form.setValue("docente_tutor", value, { shouldValidate: true })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un docente" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Docentes Tutores</SelectLabel>
            {docentes.map((docente) => (
              <SelectItem 
                key={docente.id} 
                value={`${docente.name} ${docente.apellidos}`}
              >
                {docente.name} {docente.apellidos}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {errors.docente_tutor && (
        <p className="text-red-500">{errors.docente_tutor.message}</p>
      )}
    </div>
  </div>



              </div>


            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              <ClipboardEdit/>
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {seccionToUpdate ? "Actualizar Sección" : "Crear Sección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
