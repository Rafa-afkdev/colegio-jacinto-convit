/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react"; // <-- Agrega esto
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db, getCollection, addDocument, updateDocument, deleteDocument } from "@/lib/firebase";
import { useUser } from "@/hooks/use-user";
import { useState, useEffect } from "react";
import { BookOpen, ClipboardEdit, ClipboardX, Loader2, Search, UserRound, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User } from "@/interfaces/user.interface";
import { Materias } from "@/interfaces/materias.interface";
import { AsignacionesDocentes } from "@/interfaces/asignaciones_docentes.interface";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function AsignarMaterias() {
  const user = useUser();
  const [docentes, setDocentes] = useState<User[]>([]);
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodosEscolares | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "name">("cedula");
  const [selectedDocente, setSelectedDocente] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]); // Modified to array
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [asignaciones, setAsignaciones] = useState<AsignacionesDocentes[]>([]);
  const [allAsignaciones, setAllAsignaciones] = useState<AsignacionesDocentes[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [asignacionToDelete, setAsignacionToDelete] = useState<string | null>(null);
  const [searchMateriaQuery, setSearchMateriaQuery] = useState<string>(""); // New state for searching materias

  // Obtener periodo activo
  const getPeriodoActivo = async () => {
    try {
      const periodoData = await getCollection("periodos_escolares", [
        where("status", "==", "ACTIVO")
      ]) as PeriodosEscolares[];
      
      if (periodoData.length > 0) {
        setPeriodoActivo(periodoData[0]);
      }
    } catch (error) {
      console.error("Error al obtener período activo:", error);
      toast.error("Error al cargar período activo");
    }
  };

  // Obtener docentes
  const getDocentes = async () => {
    setIsLoading(true);
    try {
      const docentesData = await getCollection("users", [
        where("rol", "==", "DOCENTE")
      ]) as User[];
      setDocentes(docentesData);
    } catch (error) {
      console.error("Error al obtener docentes:", error);
      toast.error("Error al cargar docentes");
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener materias
  const getMaterias = async () => {
    const path = `materias`;
    try {
      const res = (await getCollection(path)) as Materias[];
      setMaterias(res);
    } catch (error) {
      console.error("Error al obtener materias:", error);
      toast.error("Error al cargar materias");
    }
  };

  // Obtener todas las asignaciones
  const getAllAsignaciones = async () => {
    if (!periodoActivo) return;
    
    try {
      const asignacionesData = await getCollection("asignaciones_docentes", [
        where("año_escolar", "==", periodoActivo.periodo)
      ]) as AsignacionesDocentes[];
      
      setAllAsignaciones(asignacionesData);
    } catch (error) {
      console.error("Error al obtener todas las asignaciones:", error);
    }
  };

  // Obtener asignaciones del docente
  const getAsignacionesDocente = async (docenteId: string) => {
    if (!periodoActivo) return;
    
    try {
      const asignacionesData = await getCollection("asignaciones_docentes", [
        where("docente_id", "==", docenteId),
        where("año_escolar", "==", periodoActivo.periodo)
      ]) as AsignacionesDocentes[];
      
      setAsignaciones(asignacionesData);
    } catch (error) {
      console.error("Error al obtener asignaciones:", error);
    }
  };

  useEffect(() => {
    if (user) {
      getPeriodoActivo();
      getDocentes();
      getMaterias();
    }
  }, [user]);

  useEffect(() => {
    if (periodoActivo) {
      getAllAsignaciones();
    }
  }, [periodoActivo]);

  useEffect(() => {
    if (selectedDocente) {
      getAsignacionesDocente(selectedDocente);
    }
  }, [selectedDocente, periodoActivo]);

  const filteredDocentes = docentes.filter((docente) => {
    const search = searchQuery.toLowerCase();
    return searchType === "cedula" 
      ? docente.cedula.toLowerCase().includes(search)
      : docente.name.toLowerCase().includes(search);
  });

  const handleCheckboxChange = (id: string) => {
    setSelectedDocente(prev => prev === id ? null : id);
  };

  const createAsignacion = async (data: Omit<AsignacionesDocentes, 'id'>) => {
    return await addDocument("asignaciones_docentes", data);
  };

  const updateAsignacion = async (id: string, data: Partial<AsignacionesDocentes>) => {
    await updateDocument(`asignaciones_docentes/${id}`, data);
  };

  const handleDeleteAsignacion = async (asignacionId: string) => {
    try {
      await deleteDocument(`asignaciones_docentes/${asignacionId}`);
      setAllAsignaciones(prev => prev.filter(a => a.id !== asignacionId));
      setAsignaciones(prev => prev.filter(a => a.id !== asignacionId));
      toast.success("Materia retirada correctamente");
    } catch (error) {
      console.error("Error al eliminar asignación:", error);
      toast.error("Error al retirar materia");
    }
  };

  // Handler for checking/unchecking a materia
  const handleMateriaSelect = (materiaId: string) => {
    setSelectedMaterias(prev => {
      if (prev.includes(materiaId)) {
        return prev.filter(id => id !== materiaId);
      } else {
        return [...prev, materiaId];
      }
    });
  };

  const onSubmit = async () => {
    if (!selectedDocente || selectedMaterias.length === 0 || !periodoActivo) {
      toast.error("Debe seleccionar al menos una materia");
      return;
    }

    setIsSubmitting(true);

    try {
      const docente = docentes.find(d => d.uid === selectedDocente);
      
      if (!docente) {
        toast.error("Error en los datos del docente seleccionado");
        return;
      }

      // Crear un array de promesas para todas las asignaciones
      const promises = selectedMaterias.map(async (materiaId) => {
        const materia = materias.find(m => m.id === materiaId);
        
        if (!materia) {
          return Promise.reject("Materia no encontrada");
        }

        const asignacionData: Omit<AsignacionesDocentes, 'id'> = {
          docente_id: selectedDocente,
          docente_name: docente.name,
          docente_apellidos: docente.apellidos,
          materia_id: materia.id!,
          materia_nombre: materia.nombre,
          año_seccion: materia.año,
          seccion_id: materia.seccion,
          año_escolar: periodoActivo.periodo,
        };

        // Verificar si ya existe la asignación
        const q = query(
          collection(db, "asignaciones_docentes"),
          where("docente_id", "==", selectedDocente),
          where("materia_id", "==", materia.id),
          where("año_escolar", "==", periodoActivo.periodo)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return updateAsignacion(querySnapshot.docs[0].id, asignacionData);
        } else {
          return createAsignacion(asignacionData);
        }
      });

      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promises);

      setIsDialogOpen(false);
      setSelectedMaterias([]);
      
      toast.success(
        selectedMaterias.length > 1 
          ? `${selectedMaterias.length} materias asignadas correctamente` 
          : "Materia asignada correctamente"
      );
      
      await getAllAsignaciones();
      await getAsignacionesDocente(selectedDocente);
    } catch (error) {
      console.error("Error al guardar asignaciones:", error);
      toast.error("Error al guardar las asignaciones");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar materias que no están asignadas en ninguna asignación
  const materiasDisponibles = materias.filter(materia => {
    // Verificar si existe alguna asignación de esta materia a otros docentes
    const estaAsignadaAOtros = allAsignaciones.some(asignacion => 
      asignacion.materia_id === materia.id && 
      asignacion.docente_id !== selectedDocente
    );
    
    // Incluir solo las materias NO asignadas a otros docentes
    return !estaAsignadaAOtros;
  });

  // Filtrar materias según la búsqueda
  const filteredMaterias = materiasDisponibles.filter(materia => {
    const search = searchMateriaQuery.toLowerCase();
    return materia.nombre.toLowerCase().includes(search) || 
           materia.año.toString().includes(search) ||
           materia.seccion.toLowerCase().includes(search);
  });

  // Función para contar materias únicas por docente
  const countUniqueSubjects = (docenteId: string) => {
    const assignments = allAsignaciones.filter(a => a.docente_id === docenteId);
    const uniqueSubjects = new Set(assignments.map(a => a.materia_nombre));
    return uniqueSubjects.size;
  };

  // Función para agrupar asignaciones por materia
  const groupAssignmentsBySubject = (docenteId: string) => {
    const assignments = allAsignaciones.filter(a => a.docente_id === docenteId);
    const groupedAssignments = assignments.reduce((acc, curr) => {
      if (!acc[curr.materia_nombre]) {
        acc[curr.materia_nombre] = [];
      }
      acc[curr.materia_nombre].push(curr);
      return acc;
    }, {} as Record<string, AsignacionesDocentes[]>);
    
    return groupedAssignments;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar Materias a Docentes</CardTitle>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start">
                  {searchType === "cedula" ? "Cédula" : "Nombres"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem 
                        onSelect={() => setSearchType("cedula")}
                        className={cn(searchType === "cedula" && "bg-accent")}
                      >
                        Cédula
                      </CommandItem>
                      <CommandItem 
                        onSelect={() => setSearchType("name")}
                        className={cn(searchType === "name" && "bg-accent")}
                      >
                        Nombres
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <Input
                placeholder="Buscar docente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              disabled={!selectedDocente}
              onClick={() => setIsDialogOpen(true)}
            >
              Asignar Materias
              <ClipboardEdit className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredDocentes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Asignaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocentes.map((docente) => (
                <TableRow key={docente.uid}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDocente === docente.uid}
                      onCheckedChange={() => handleCheckboxChange(docente.uid!)}
                    />
                  </TableCell>
                  <TableCell>{`${docente.name} ${docente.apellidos}`}</TableCell>
                  <TableCell>{docente.cedula}</TableCell>
                  <TableCell>{docente.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 underline">
                            {countUniqueSubjects(docente.uid!)} materias
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 shadow-md border border-gray-200 rounded-lg" align="start">
                          <div className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="font-semibold text-lg">Materias asignadas</h4>
                            </div>
                            
                            {countUniqueSubjects(docente.uid!) > 0 ? (
                              <div className="space-y-4">
                                {Object.entries(groupAssignmentsBySubject(docente.uid!)).map(([materiaNombre, asignaciones]) => (
                                  <div key={materiaNombre} className="space-y-2">
                                    <div className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      {materiaNombre}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-4">
                                      {asignaciones.map((asignacion) => (
                                        <Badge 
                                          key={asignacion.id} 
                                          variant="outline"
                                          className="group relative hover:bg-gray-100 transition-colors py-1 px-3"
                                        >
                                          <span className="mr-5">{asignacion.año_seccion} {asignacion.seccion_id}</span>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setAsignacionToDelete(asignacion.id);
                                              setDeleteDialogOpen(true);
                                            }}
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="text-gray-400 mb-2">
                                  <ClipboardX className="h-10 w-10 mx-auto" />
                                </div>
                                <p className="text-sm text-muted-foreground">No hay asignaciones registradas</p>
                              </div>
                            )}
                          </div>
                        </PopoverContent>

                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>¿Confirmar eliminación?</DialogTitle>
                              <DialogDescription>
                                ¿Estás seguro de querer retirar esta materia al docente?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-4 mt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setDeleteDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  if (asignacionToDelete) {
                                    handleDeleteAsignacion(asignacionToDelete);
                                    setDeleteDialogOpen(false);
                                  }
                                }}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 space-y-4"
          >
            <UserRound className="mx-auto h-20 w-20 text-gray-400" />
            <h2 className="text-xl font-semibold">No se encontraron docentes</h2>
            <p className="text-gray-500">Intenta con otro término de búsqueda</p>
          </motion.div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Múltiples Materias</DialogTitle>
            <DialogDescription>
              Seleccione las materias a asignar para el período {periodoActivo?.periodo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Búsqueda de materias */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar materias..."
                value={searchMateriaQuery}
                onChange={(e) => setSearchMateriaQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de materias con checkboxes */}
            <div className="border rounded-md overflow-y-auto max-h-64">
              {filteredMaterias.length > 0 ? (
                <div className="divide-y">
                  {filteredMaterias.map((materia) => (
                    <div 
                      key={materia.id}
                      className={cn(
                        "flex items-center p-3 hover:bg-gray-50",
                        selectedMaterias.includes(materia.id!) && "bg-blue-50"
                      )}
                    >
                      <Checkbox
                        checked={selectedMaterias.includes(materia.id!)}
                        onCheckedChange={() => handleMateriaSelect(materia.id!)}
                        className="mr-3"
                      />
                      <div className="flex justify-between w-full">
                        <div className="font-medium">{materia.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Año: {materia.año}, Sección: {materia.seccion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No hay materias disponibles para asignar
                </div>
              )}
            </div>

            {/* Contador de materias seleccionadas */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedMaterias.length} materias seleccionadas
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedMaterias([]);
                    setIsDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={onSubmit}
                  disabled={selectedMaterias.length === 0 || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Asignando Materias..." : "Confirmar Asignaciones"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}