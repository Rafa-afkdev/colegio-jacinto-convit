/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { doc, orderBy, runTransaction } from "firebase/firestore";
import { db, getCollection } from "@/lib/firebase";
import { Students } from "@/interfaces/students.interface";
import { useUser } from "@/hooks/use-user";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardEdit, LayoutList, Loader2, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Secciones } from "@/interfaces/secciones.interface";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import React from "react";
export default function InscripcionStudent() {
  const user = useUser();
  const [students, setStudents] = useState<Students[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [selectedAñoEscolar, setSelectedAñoEscolar] = useState<string | null>(null);
  const [selectedAñoSeccion, setSelectedAñoSeccion] = useState<string | null>(null);
  const [selectedSeccion, setSelectedSeccion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);

  // Obtener estudiantes
  const getStudents = async () => {
    const path = `estudiantes`;
    const query = [orderBy("cedula", "asc")];
    setIsLoading(true);
    try {
      const res = (await getCollection(path, query)) as Students[];
      setStudents(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getStudents();
  }, [user]);

  // Obtener secciones y periodos cuando se abre el diálogo
  useEffect(() => {
    const fetchData = async () => {
      if (!isDialogOpen) return;
      
      try {
        const periodosPath = `periodosEscolares`;
        const periodosQuery = [orderBy("periodo", "asc")];
        const periodos = (await getCollection(periodosPath, periodosQuery)) as PeriodosEscolares[];
        setPeriodosEscolares(periodos);
  
        const seccionesPath = `secciones`;
        const seccionesQuery = [orderBy("año_escolar", "asc")];
        const seccionesData = (await getCollection(seccionesPath, seccionesQuery)) as Secciones[];
        setSecciones(seccionesData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
  
    fetchData();
  }, [isDialogOpen]);

  // Filtrar estudiantes
  const filteredStudents = students.filter((student) => {
    if (student.estado === "INSCRITO") return false;
    if (searchType === "cedula") {
      return student.cedula.toString().includes(searchQuery);
    } else {
      return student.nombres.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  // Manejar selección de estudiantes (múltiples)
  const handleCheckboxChange = (id: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) {
        return prev.filter(studentId => studentId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Seleccionar/deseleccionar todos los estudiantes filtrados
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedStudents([]);
    } else {
      // Seleccionar todos los estudiantes filtrados
      setSelectedStudents(filteredStudents.map(student => student.id!));
    }
  };

  // Obtener años escolares únicos
  const getUniqueAñoEscolares = () => {
    const uniqueAñoEscolares = Array.from(new Set(secciones.map((s) => s.año_escolar)));
    return uniqueAñoEscolares;
  };

  // Obtener años de sección únicos según el año escolar seleccionado
  const getUniqueAñoSecciones = () => {
    if (!selectedAñoEscolar) return [];
    const filteredSecciones = secciones.filter((s) => s.año_escolar === selectedAñoEscolar);
    const uniqueAñoSecciones = Array.from(new Set(filteredSecciones.map((s) => s.año_seccion)));
    return uniqueAñoSecciones;
  };

  // Obtener secciones según el año escolar y año sección seleccionados
  const getSeccionesByAñoSeccion = () => {
    if (!selectedAñoEscolar || !selectedAñoSeccion) return [];
    return secciones.filter((s) => s.año_escolar === selectedAñoEscolar && s.año_seccion === selectedAñoSeccion);
  };

  // Manejar la inscripción de múltiples estudiantes usando batch write para mejor rendimiento
  const handleInscribir = async () => {
    if (selectedStudents.length === 0 || !selectedSeccion) {
      toast.error("Seleccione al menos un estudiante y una sección");
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Encontrar la sección seleccionada
      const seccionSeleccionada = secciones.find(
        (s) => s.seccion === selectedSeccion && s.año_escolar === selectedAñoEscolar && s.año_seccion === selectedAñoSeccion
      );

      if (!seccionSeleccionada || !seccionSeleccionada.id) {
        toast.error("No se encontró la sección seleccionada.");
        setIsSubmitting(false);
        return;
      }
      
      // Usar una transacción para garantizar la atomicidad de las operaciones
      await runTransaction(db, async (transaction) => {
        // Obtener la referencia al documento de la sección
        const seccionRef = doc(db, `secciones/${seccionSeleccionada.id}`);
        const seccionDoc = await transaction.get(seccionRef);
        
        if (!seccionDoc.exists()) {
          throw new Error("La sección seleccionada no existe.");
        }
        
        // Obtener datos actuales de la sección
        const seccionData = seccionDoc.data();
        const capacidadMaxima = seccionData?.capacidad || 0;
        const currentInscritos = seccionData?.inscritos || 0;
        
        // Validar que aún haya cupo disponible en la sección para todos los estudiantes
        const nuevosInscritos = currentInscritos + selectedStudents.length;
        if (nuevosInscritos > capacidadMaxima) {
          throw new Error(`No hay suficiente cupo disponible. Capacidad: ${capacidadMaxima}, Actuales: ${currentInscritos}, Nuevos: ${selectedStudents.length}`);
        }
        
        // Actualizar la sección (incrementar inscritos)
        transaction.update(seccionRef, {
          inscritos: nuevosInscritos
        });
        
        // Actualizar cada estudiante seleccionado
        for (const studentId of selectedStudents) {
          const studentRef = doc(db, `estudiantes/${studentId}`);
          transaction.update(studentRef, {
            estado: "INSCRITO",
            seccion_actual: selectedSeccion,
            año_actual: selectedAñoSeccion,
            periodo_escolar_actual: selectedAñoEscolar
          });
        }
      });

      // Reiniciar estados después de una inscripción exitosa
      setIsDialogOpen(false);
      setSelectedAñoEscolar(null);
      setSelectedAñoSeccion(null);
      setSelectedSeccion(null);
      setSelectedStudents([]);
      toast.success(`${selectedStudents.length} estudiante(s) inscrito(s) exitosamente.`);
      getStudents(); // Refrescar la lista de estudiantes
      
    } catch (error: any) {
      console.error("Error al inscribir estudiantes:", error);
      toast.error(error.message || "Hubo un error al inscribir a los estudiantes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscribir Estudiantes</CardTitle>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(value: "cedula" | "nombres") => setSearchType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cedula">Cédula</SelectItem>
                <SelectItem value="nombres">Nombres</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={"outline"}
              disabled={selectedStudents.length === 0}
              onClick={() => setIsDialogOpen(true)}
            >
              Inscribir
              <ClipboardEdit className="ml-2"/>
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
        ) : filteredStudents.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm cursor-pointer">Seleccionar todo</label>
              </div>
              {selectedStudents.length > 0 && (
                <div className="text-sm text-gray-500 flex items-center">
                  <Users size={16} className="mr-1" />
                  {selectedStudents.length} estudiante(s) seleccionado(s)
                </div>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[100px]">Cédula</TableHead>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id!)}
                        onCheckedChange={() => handleCheckboxChange(student.id!)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.cedula}</TableCell>
                    <TableCell>{student.nombres}</TableCell>
                    <TableCell>{student.apellidos}</TableCell>
                    <TableCell>{student.sexo}</TableCell>
                    <TableCell
                      className={
                        student.estado === "INSCRITO"
                          ? "text-green-600 font-semibold"
                          : student.estado === "RETIRADO"
                          ? "text-red-600 font-semibold"
                          : student.estado === ""
                          ? "text-blue-600 font-semibold"
                          : ""
                      }
                    >
                      {student.estado || "SIN ASIGNAR"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="text-gray-500 text-center py-10">
          </div>
        )}
        {!isLoading && filteredStudents.length === 0 && (
          <div className="text-gray-200 my-20 text-center">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron estudiantes por inscribir</h2>
          </div>
        )}
      </CardContent>

      {/* Diálogo para inscribir a los estudiantes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm h-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscribir {selectedStudents.length} Estudiante(s)</DialogTitle>
            <DialogDescription>
              Seleccione el año escolar, año de sección y sección para inscribir a los estudiantes seleccionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedAñoEscolar || ""}
              onValueChange={(value) => setSelectedAñoEscolar(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el año escolar" />
              </SelectTrigger>
              <SelectContent>
                {/* Grupo para Periodo Activo */}
                <SelectGroup>
                  <SelectLabel>Periodo Activo</SelectLabel>
                  {getUniqueAñoEscolares().map((añoEscolar, index, array) => {
                    const isLastPeriod = index === array.length - 1;
                    if (isLastPeriod) {
                      return (
                        <SelectItem key={añoEscolar} value={añoEscolar}>
                          {añoEscolar}
                        </SelectItem>
                      );
                    }
                    return null;
                  })}
                </SelectGroup>

                {/* Grupo para Periodos Inactivos */}
                <SelectGroup>
                  <SelectLabel>Otros Periodos</SelectLabel>
                  {getUniqueAñoEscolares().map((añoEscolar, index, array) => {
                    const isLastPeriod = index === array.length - 1;
                    if (!isLastPeriod) {
                      return (
                        <SelectItem key={añoEscolar} value={añoEscolar}>
                          {añoEscolar}
                        </SelectItem>
                      );
                    }
                    return null;
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={selectedAñoSeccion || ""}
              onValueChange={(value) => setSelectedAñoSeccion(value)}
              disabled={!selectedAñoEscolar}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el año de sección" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueAñoSecciones().map((añoSeccion) => (
                  <SelectItem key={añoSeccion} value={añoSeccion}>
                    {añoSeccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSeccion || ""}
              onValueChange={(value) => setSelectedSeccion(value)}
              disabled={!selectedAñoSeccion}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione la sección" />
              </SelectTrigger>
              <SelectContent>
                {getSeccionesByAñoSeccion().map((seccion) => {
                  const disponibles = (seccion.capacidad || 0) - (seccion.inscritos || 0);
                  const isDisabled = disponibles < selectedStudents.length;
                  return (
                    <SelectItem 
                      key={seccion.seccion} 
                      value={seccion.seccion}
                      disabled={isDisabled}
                    >
                      {seccion.seccion} ({seccion.inscritos || 0}/{seccion.capacidad || 0})
                      {isDisabled ? " - Cupo insuficiente" : ` - ${disponibles} disponibles`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              disabled={!selectedSeccion || isSubmitting}
              onClick={handleInscribir}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> Inscribiendo...
                </>
              ) : (
                `Confirmar Inscripción de ${selectedStudents.length} Estudiante(s)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}