/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore";
import { db, getCollection } from "@/lib/firebase";
import { Students } from "@/interfaces/students.interface";
import { useUser } from "@/hooks/use-user";
import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Secciones } from "@/interfaces/secciones.interface";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CambiarSeccionStudents() {
  const user = useUser();
  const [students, setStudents] = useState<Students[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newSeccion, setNewSeccion] = useState<string>("");
  const [currentSeccionInfo, setCurrentSeccionInfo] = useState<{
    añoEscolar: string;
    añoSeccion: string;
  } | null>(null);

  const selectedStudentData = useMemo(() => {
    return students.find(s => s.id === selectedStudent);
  }, [selectedStudent, students]);

  useEffect(() => {
    if (selectedStudentData && isDialogOpen) {
      setCurrentSeccionInfo({
        añoEscolar: selectedStudentData.periodo_escolar_actual || "",
        añoSeccion: selectedStudentData.año_actual || ""
      });
    }
  }, [isDialogOpen, selectedStudentData]);

  const getStudents = async () => {
    const path = `estudiantes`;
    setIsLoading(true);
    try {
      const res = (await getCollection(path)) as Students[];
      const sortedStudents = res.sort((a, b) => Number(a.cedula) - Number(b.cedula));
      setStudents(sortedStudents);
      // setStudents(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getStudents();
  }, [user]);

  const getSecciones = async () => {
    const path = `secciones`;
    try {
      const res = (await getCollection(path)) as Secciones[];
      setSecciones(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isDialogOpen) getSecciones();
  }, [isDialogOpen]);

  const filteredStudents = students.filter((student) => {
    if (student.estado !== "INSCRITO") return false;
    return searchType === "cedula"
      ? student.cedula.toString().includes(searchQuery)
      : student.nombres.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCheckboxChange = (id: string) => {
    setSelectedStudent(prev => prev === id ? null : id);
  };

  const getSeccionesDisponibles = () => {
    if (!currentSeccionInfo) return [];
    return secciones.filter(s => 
      s.año_escolar === currentSeccionInfo.añoEscolar && 
      s.año_seccion === currentSeccionInfo.añoSeccion
    );
  };

  const handleCambioSeccion = async () => {
    if (!selectedStudent || !newSeccion || !currentSeccionInfo) return;
    setIsSubmitting(true);
  
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Obtener datos actuales del estudiante
        const studentRef = doc(db, `estudiantes/${selectedStudent}`);
        const studentDoc = await transaction.get(studentRef);
        
        if (!studentDoc.exists()) {
          throw new Error("Estudiante no encontrado");
        }
        
        const studentData = studentDoc.data() as Students;
        
        // 2. Validar que el estudiante esté inscrito
        if (studentData.estado !== "INSCRITO") {
          throw new Error("El estudiante no está inscrito");
        }
  
        // 3. Buscar sección actual en Firestore
        const seccionAnteriorQuery = query(
          collection(db, "secciones"),
          where("seccion", "==", studentData.seccion_actual),
          where("año_escolar", "==", studentData.periodo_escolar_actual),
          where("año_seccion", "==", studentData.año_actual)
        );
        
        const seccionAnteriorSnapshot = await getDocs(seccionAnteriorQuery);
        if (seccionAnteriorSnapshot.empty) {
          throw new Error("No se encontró la sección actual");
        }
        const seccionAnteriorDoc = seccionAnteriorSnapshot.docs[0];
        
        // 4. Buscar nueva sección en Firestore
        const nuevaSeccionQuery = query(
          collection(db, "secciones"),
          where("seccion", "==", newSeccion),
          where("año_escolar", "==", currentSeccionInfo.añoEscolar),
          where("año_seccion", "==", currentSeccionInfo.añoSeccion)
        );
        
        const nuevaSeccionSnapshot = await getDocs(nuevaSeccionQuery);
        if (nuevaSeccionSnapshot.empty) {
          throw new Error("No se encontró la nueva sección");
        }
        const nuevaSeccionDoc = nuevaSeccionSnapshot.docs[0];
        const nuevaSeccionData = nuevaSeccionDoc.data();
        
        // 5. Validar capacidad de nueva sección
        if ((nuevaSeccionData.inscritos || 0) >= (nuevaSeccionData.capacidad || 0)) {
          throw new Error("La nueva sección no tiene cupos disponibles");
        }
  
        // 6. Actualizar contadores
        transaction.update(seccionAnteriorDoc.ref, {
          inscritos: (seccionAnteriorDoc.data().inscritos || 0) - 1
        });
        
        transaction.update(nuevaSeccionDoc.ref, {
          inscritos: (nuevaSeccionData.inscritos || 0) + 1
        });
  
        // 7. Actualizar estudiante
        transaction.update(studentRef, {
          seccion_actual: newSeccion
        });
      });
  
      toast.success("Cambio de sección exitoso");
      getStudents();
      setIsDialogOpen(false);
      setSelectedStudent(null);
      setNewSeccion("");
    } catch (error: any) {
      console.error("Error en cambio de sección:", error);
      toast.error(error.message || "Error al cambiar sección");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedStudent && isDialogOpen) {
      const studentData = students.find(s => s.id === selectedStudent);
      if (studentData) {
        setCurrentSeccionInfo({
          añoEscolar: studentData.periodo_escolar_actual || "",
          añoSeccion: studentData.año_actual || ""
        });
      }
    }
  }, [isDialogOpen, selectedStudent, students]);

//   const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambio De Sección</CardTitle>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(v: "cedula" | "nombres") => setSearchType(v)}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              disabled={!selectedStudent}
              onClick={() => setIsDialogOpen(true)}
            >
              Cambiar Sección
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Nombres</TableHead>
                <TableHead>Apellidos</TableHead>
                <TableHead>Año</TableHead>
                {/* <TableHead>Sección</TableHead> */}
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudent === student.id}
                      onCheckedChange={() => handleCheckboxChange(student.id!)}
                    />
                  </TableCell>
                  <TableCell>{student.cedula}</TableCell>
                  <TableCell>{student.nombres}</TableCell>
                  <TableCell>{student.apellidos}</TableCell>
                  <TableCell>{student.año_actual} {student.seccion_actual}</TableCell>
                  {/* <TableCell>{student.seccion_actual}</TableCell> */}
                  <TableCell>{student.periodo_escolar_actual}</TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {student.estado}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground text-center py-10">
            No se encontraron estudiantes inscritos
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Sección</DialogTitle>
            <DialogDescription>
              Seleccione la nueva sección para el estudiante
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={newSeccion}
              onValueChange={setNewSeccion}
              disabled={!currentSeccionInfo}
            >
  <SelectTrigger className="max-w-[200px] w-48">
  <SelectValue placeholder="Seleccionar nueva sección" />
              </SelectTrigger>
              <SelectContent className="max-w-[200px] min-w-[200px]">
              {getSeccionesDisponibles()
                  .filter(s => s.seccion !== selectedStudentData?.seccion_actual)
                  .map(seccion => (
                    <SelectItem 
                      key={seccion.seccion} 
                      value={seccion.seccion}
                    >
                      {seccion.seccion}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Confirmar Cambio</AlertTitle>
            <AlertDescription className="space-y-2">
              {selectedStudentData && (
                <>
                  <p className="font-medium">
                   Para: {selectedStudentData.nombres} {selectedStudentData.apellidos}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sección Actual:</p>
                      <p className="font-medium">{selectedStudentData.seccion_actual}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sección Nueva:</p>
                      <p className="font-medium">{newSeccion}</p>
                    </div>
                  </div>

                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewSeccion("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCambioSeccion}
              disabled={isSubmitting || !newSeccion}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cambio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}