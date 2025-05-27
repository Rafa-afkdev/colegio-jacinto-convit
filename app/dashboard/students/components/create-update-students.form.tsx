 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";
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
import { LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
// import DragAndDropImage from "@/components/ui/drag-and-drop-image";
import { Students } from "@/interfaces/students.interface";
import {
  addDocument,
  getCollection,
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
import estados from "@/app/data/data-estados";

interface CreateUpdateStudentsProps {
  children: React.ReactNode;
  studentToUpdate?: Students;
  getStudents: () => Promise<void>
}

export function CreateUpdateStudents({
  children,
  studentToUpdate,
  getStudents
}: CreateUpdateStudentsProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<number | null>(
    null
  );
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState<
    string | null
  >(null);
  // const [image, setImage] = useState<string>("");

  const formSchema = z.object({
    // image: z
    //   .object({
    //     path: z.string(),
    //     url: z.string(),
    //   })
    //   .optional(),
    cedula: z.coerce
      .number()
      .min(8, "La cédula debe tener al menos 8 caracteres"),
    nombres: z.string().min(3, "Los nombres son requeridos"),
    apellidos: z.string().min(3, "Los apellidos son requeridos"),
    sexo: z.string().min(3, "Los apellidos son requeridos"),
    // telefono: z
    //   .string()
    //   .min(11, "El teléfono es requerido")
    //   .regex(/^\d+$/, "El teléfono debe ser un número"),
    estado: z.string().optional(),
    fechaNacimiento: z
      .string()
      .nonempty("La fecha de nacimiento es requerida")
      .refine((date) => {
        const selectedDate = new Date(date);
        const currentDate = new Date();
        const minDate = new Date("1940-01-01");
        return selectedDate <= currentDate && selectedDate >= minDate;
      }, "La fecha debe estar entre 1940 y la fecha actual"),
      periodo_escolar_actual: z.string().optional(),
      año_actual: z.string().optional(),
      seccion_actual: z.string().optional(),
    estado_nacimiento: z
      .string()
      .min(2, "El estado de nacimiento es requerido"),
    // lugar_nacimiento: z.string().min(2, "El lugar de nacimiento es requerido"),
    municipio: z.string().min(1, "El municipio es requerido"),
    parroquia: z.string().min(1, "La parroquia es requerida"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: studentToUpdate
      ? studentToUpdate
      : {
          // id: undefined,
          // image: {} as StudentImage,
          cedula: undefined,
          nombres: "",
          apellidos: "",
          sexo: "",
          // telefono: "",
          estado: "",
          fechaNacimiento: "",
          periodo_escolar_actual: "",
          año_actual: "",
          seccion_actual: "",
          estado_nacimiento: "",
          municipio: "",
          parroquia: "",
          // lugar_nacimiento: "",
        },
  });

    // Fetch secciones data
    useEffect(() => {
      const fetchSecciones = async () => {
        
        // Get unique periodos
      };
      fetchSecciones();
    }, []);
  
   // Fetch secciones data
   useEffect(() => {
    const fetchSecciones = async () => {
      
      // Si hay un studentToUpdate, establecer los valores iniciales
      if (studentToUpdate) {

        
        // Encontrar el índice del estado
        const estadoIndex = estados.findIndex(
          (estado) => estado.estado === studentToUpdate.estado_nacimiento
        );
        setEstadoSeleccionado(estadoIndex !== -1 ? estadoIndex : null);
      }
    };
    fetchSecciones();
  }, [studentToUpdate]);





  const { register, handleSubmit, formState } = form;
  const { errors } = formState;
  const municipios =
    estadoSeleccionado !== null ? estados[estadoSeleccionado].municipios : [];
  const parroquias = municipioSeleccionado
    ? municipios.find((m) => m.municipio === municipioSeleccionado)?.parroquias
    : [];

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
  const onSubmit = async (student: z.infer<typeof formSchema>) => {
    if (studentToUpdate) {
      UpdateStudent(student);
    } else {
      CreateStudent(student);
    }
  };

  // TODO ====== VERIFICAR CEDULA DUPLICADA =====//
  const checkDuplicateCedula = async (
    cedula: number,
    currentStudentId?: string
  ): Promise<boolean> => {
    try {
      const students = await getCollection("estudiantes");
      return students.some(
        (student: any) =>
          Number(student.cedula) === cedula && student.id !== currentStudentId
      );
    } catch (error) {
      console.error("Error checking duplicate cedula:", error);
      return false;
    }
  };


  //TODO // CREAR UN ESTUDIANTE EN LA DATABASE ////

  const CreateStudent = async (student: Students) => {
    const path = `estudiantes`;
    setIsLoading(true);
  
    try {
      const cedulaNumber = Number(student.cedula);
      const isDuplicate = await checkDuplicateCedula(cedulaNumber);
  
      if (isDuplicate) {
        toast.error("Ya existe un estudiante con esta cédula");
        setIsLoading(false);
        return;
      }
  
 
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        estado: "",
        año_actual:"",
        seccion_actual: "",
        estado_nacimiento: student.estado_nacimiento.toUpperCase(),
        municipio: student.municipio.toUpperCase(),
        parroquia: student.parroquia.toUpperCase(),
      };
  
      await addDocument(path, normalizedStudent);
      toast.success("El estudiante fue registrado exitosamente");
      getStudents();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };
  //TODO // ACTUALIZAR UN ESTUDIANTE EN LA DATABASE ////

  const UpdateStudent = async (student: Students) => {
    const path = `estudiantes/${studentToUpdate?.id}`;
    setIsLoading(true);
  
    try {
      const cedulaNumber = Number(student.cedula);
      const isDuplicate = await checkDuplicateCedula(
        cedulaNumber,
        studentToUpdate?.id
      );
  
      if (isDuplicate) {
        toast.error("Ya existe un estudiante con esta cédula");
        setIsLoading(false);
        return;
      }
  
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        estado: "",
        año_actual:"",
        seccion_actual: "",
        estado_nacimiento: student.estado_nacimiento.toUpperCase(),
        municipio: student.municipio.toUpperCase(),
        parroquia: student.parroquia.toUpperCase(),
      };
    
      await updateDocument(path, normalizedStudent);
      toast.success("El estudiante fue actualizado exitosamente");
      getStudents();
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
      <DialogContent className="sm:max-w-[850px] max-h-[190vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {studentToUpdate ? "Actualizar Estudiante" : "Agregar Estudiante"}
            </DialogTitle>
            <DialogDescription>
              {studentToUpdate
                ? " Por favor, llena los campos para actualizar los datos del estudiante"
                : "Por favor, llena los campos para registrar un nuevo estudiante."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
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

            <div className="grid grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Cédula */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="cedula" className="text-right">
                    Cédula
                  </Label>
                  <Input
                    {...register("cedula")}
                    id="cedula"
                    // type="tex"
                    placeholder="Ingrese la cédula"
                    className="col-span-2"
                    maxLength={11} // Evita que se escriban más de 11 caracteres
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 11) {
                        input.value = input.value.slice(0, 11);
                      }
                    }}
                    onBlur={() => {
                      form.trigger("cedula"); // Valida el campo manualmente al perder el foco
                    }}
                  />
                  {errors.cedula && (
                    <p className="text-red-500">{errors.cedula.message}</p>
                  )}
                </div>

                {/* NOMBRES */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="nombres" className="text-right">
                    Nombres
                  </Label>
                  <Input
                    {...register("nombres")}
                    id="nombres"
                    type="text"
                    placeholder="Ingresa los nombres"
                    className="col-span-2"
                    maxLength={60} 
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 60) {
                        input.value = input.value.slice(0, 60);
                      }
                    }}
                    onBlur={() => {
                      form.trigger("nombres"); 
                    }}
                  />
                  {errors.nombres && (
                    <p className="text-red-500">{errors.nombres.message}</p>
                  )}
                </div>

                {/* APELLIDOS */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="apellidos" className="text-right">
                    Apellidos
                  </Label>
                  <Input
                    {...register("apellidos")}
                    id="apellidos"
                    type="text"
                    placeholder="Ingresa los apellidos"
                    className="col-span-2"
                    maxLength={60} 
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 60) {
                        input.value = input.value.slice(0, 60);
                      }
                    }}
                    onBlur={() => {
                      form.trigger("apellidos"); 
                    }}
                  />
                  {errors.apellidos && (
                    <p className="text-red-500">{errors.apellidos.message}</p>
                  )}
                </div>

                                {/* SEXO */}
                                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="sexo" className="text-right">
                    Sexo
                  </Label>
                  <div className="col-span-2">
                    <Select
                      defaultValue={studentToUpdate?.sexo}
                      value={form.watch("sexo")}
                      onValueChange={(value: string) => {
                        form.setValue("sexo", value, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el sexo del estudiante">
                          {form.watch("sexo")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Sexo</SelectLabel>
                          <SelectItem value="MASCULINO">Masculino</SelectItem>
                          <SelectItem value="FEMENINO">Femenino</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* FECHA NACIMIENTO */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="fechaNacimiento" className="text-right">
                    Fecha De Nacimiento
                  </Label>
                  <Input
                    {...register("fechaNacimiento")}
                    id="fechaNacimiento"
                    type="date"
                    className="col-span-2"
                    max={new Date().toISOString().split("T")[0]} 
                    min="1940-01-01" 
                  />
                  {errors.fechaNacimiento && (
                    <p className="text-red-500">
                      {errors.fechaNacimiento.message}
                    </p>
                  )}
                </div>

                {/* SECCION */}
          {/* PERIODO ESCOLAR */}
          <div className="grid grid-cols-3 items-center gap-4 mt-4">

          </div>

          {/* ESTADO DE NACIMIENTO */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="estado_nacimiento" className="text-right">
              Estado de Nacimiento
            </Label>
            <div className="col-span-2">
              <Select
                defaultValue={studentToUpdate?.estado_nacimiento}
                onValueChange={(value: string) => {
                  const estadoIndex = Number(value);
                  const estadoSeleccionado = estados[estadoIndex].estado;
                  setEstadoSeleccionado(estadoIndex);
                  setMunicipioSeleccionado(null);
                  form.setValue("estado_nacimiento", estadoSeleccionado, {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un estado">
                    {form.watch("estado_nacimiento")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado, index) => (
                    <SelectItem key={estado.id_estado} value={index.toString()}>
                      {estado.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

                {/* Municipio */}
                {estadoSeleccionado !== null && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="municipio" className="text-right">
                      Municipio
                    </Label>
                    <div className="col-span-2">
                      <Select
                        onValueChange={(value: string) => {
                          setMunicipioSeleccionado(value);
                          form.setValue("municipio", value, {
                            shouldValidate: true,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un municipio" />
                        </SelectTrigger>
                        <SelectContent className="overflow-y-auto max-h-[200px]">
                          {municipios.map((municipio) => (
                            <SelectItem
                              key={municipio.municipio}
                              value={municipio.municipio}
                            >
                              {municipio.municipio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.municipio && (
                        <p className="text-red-500">
                          {errors.municipio.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {/* Parroquia */}
                {municipioSeleccionado && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="parroquia" className="text-right">
                      Parroquia
                    </Label>
                    <div className="col-span-2">
                      <Select
                        onValueChange={(value: string) => {
                          form.setValue("parroquia", value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una parroquia" />
                        </SelectTrigger>
                        <SelectContent className="overflow-y-auto max-h-[200px]">
                          {parroquias?.map((parroquia) => (
                            <SelectItem key={parroquia} value={parroquia}>
                              {parroquia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.parroquia && (
                        <p className="text-red-500">
                          {errors.parroquia.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {studentToUpdate ? "Actualizar Estudiante" : "Agregar Estudiante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
