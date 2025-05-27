/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { collection, doc, getDocs, orderBy, query, runTransaction, where } from "firebase/firestore";
import { db, getCollection } from "@/lib/firebase";
import { Students } from "@/interfaces/students.interface";
import { useUser } from "@/hooks/use-user";
import { useState, useEffect } from "react";
import { Select, SelectContent,  SelectItem,  SelectTrigger, SelectValue } from "@/components/ui/select";
import {  AlertTriangle, Loader2,Search, UserMinus2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Secciones } from "@/interfaces/secciones.interface";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";


export default function RetirarStudent() {
  const user = useUser();
  const [students, setStudents] = useState<Students[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getStudents = async () => {
    const path = `estudiantes`;
    const query = [orderBy("cedula", "asc")];
    setIsLoading(true);
    try {
      const res = (await getCollection(path, query)) as Students[];
      const sortedStudents = res.sort((a, b) => Number(a.cedula) - Number(b.cedula));
      setStudents(sortedStudents);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getStudents();
  }, [user]);

  useEffect(() => {
    const getSecciones = async () => {
      const path = `secciones`;
      const query = [orderBy("año_escolar", "asc")];
      try {
        const res = (await getCollection(path, query)) as Secciones[];
        setSecciones(res);
      } catch (error) {
        console.error(error);
      }
    };

    if (isDialogOpen) getSecciones();
  }, [isDialogOpen]);

  const filteredStudents = students.filter((student) => {
    if (student.estado !== "INSCRITO") return false;

    if (searchType === "cedula") {
      return student.cedula.toString().includes(searchQuery);
    }
    return student.nombres.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCheckboxChange = (id: string) => {
    setSelectedStudent(prev => prev === id ? null : id);
  };

  const handleRetirar = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
  
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Obtener datos actualizados del estudiante
        const studentRef = doc(db, `estudiantes/${selectedStudent}`);
        const studentDoc = await transaction.get(studentRef);
        
        if (!studentDoc.exists()) {
          throw new Error("Estudiante no encontrado");
        }
        
        const studentData = studentDoc.data() as Students;
  
        // 2. Validar que el estudiante esté inscrito y tenga sección
        if (studentData.estado !== "INSCRITO" || !studentData.seccion_actual || !studentData.periodo_escolar_actual) {
          throw new Error("El estudiante no está inscrito o falta información de la sección");
        }
  
        // 3. Buscar la sección actual en Firestore (no en el estado local)
        const seccionesQuery = query(
          collection(db, "secciones"),
          where("seccion", "==", studentData.seccion_actual),
          where("año_escolar", "==", studentData.periodo_escolar_actual),
          where("año_seccion", "==", studentData.año_actual)
        );
        
        const seccionesSnapshot = await getDocs(seccionesQuery);
        
        if (seccionesSnapshot.empty) {
          throw new Error("No se encontró la sección asociada");
        }
  
        // 4. Actualizar la sección
        const seccionDoc = seccionesSnapshot.docs[0];
        const nuevosInscritos = (seccionDoc.data().inscritos || 0) - 1;
        
        transaction.update(seccionDoc.ref, {
          inscritos: nuevosInscritos
        });
  
        // 5. Actualizar el estudiante
        transaction.update(studentRef, {
          estado: "RETIRADO",
          // seccion_actual: "",
          // año_actual: "",
          // periodo_escolar_actual: "",
        });
      });
  
      toast.success("Estudiante retirado exitosamente");
      getStudents(); // Actualizar lista
      setIsDialogOpen(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error("Error al retirar:", error);
      toast.error(error.message || "Error al retirar estudiante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retirar Estudiante</CardTitle>
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
              variant="outline"
            >
              Retirar
              <UserMinus2Icon/>
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
            <DialogTitle>Confirmar Retiro</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de retirar al estudiante?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              {selectedStudentData && (
                <>
                  Retirar a {selectedStudentData.nombres} {selectedStudentData.apellidos}
                  {selectedStudentData.seccion_actual && 
                    ` De ${selectedStudentData.año_actual} Sección ${selectedStudentData.seccion_actual}`}
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRetirar}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Retiro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}