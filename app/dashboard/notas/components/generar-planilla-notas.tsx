/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function GenerarPlanillaNotas() {
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [anios, setAnios] = useState<string[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");
  const [secciones, setSecciones] = useState<{ id: string; [key: string]: any }[]>([]);
  const [estudiantes, setEstudiantes] = useState<{ id: string; apellidos: string; nombres: string; cedula: string; sexo: string; [key: string]: any }[]>([]);



  //? ====== CARGAR LOS PERIODOS ESCOLARES ====== ///////
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const periodosRef = collection(db, "periodos_escolares");
        const snapshot = await getDocs(periodosRef);
        const periodosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { periodo: string; status: string }),
        }));
        setPeriodos(periodosData);
        
    //? SELECCIONAR EL PERIODO ESCOLAR ACTIVO POR DEFECTO
        const periodoActivo = periodosData.find((p) => p.status === "ACTIVO");
        if (periodoActivo) {
          setPeriodoSeleccionado(periodoActivo.id);
        }
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar periodos:", error);
        setCargando(false);
      }
    };
    cargarPeriodos();
  }, []);

    //? ====== CARGAR LOS AÑOS CUANDO LOS PERIODOS CAMBIEN ====== ///////
    useEffect(() => {
      const cargarAnios = async () => {
        if (!periodoSeleccionado) return;
        
        try {
          setCargando(true);
          const periodoSeleccionadoObj = periodos.find(p => p.id === periodoSeleccionado);
          if (!periodoSeleccionadoObj) return;
          
          const seccionesRef = collection(db, "secciones");
          const q = query(
            seccionesRef,
            where("año_escolar", "==", periodoSeleccionadoObj.periodo)
          );
          const snapshot = await getDocs(q);
          
          //? Extraer años únicos
          const aniosData = [...new Set(snapshot.docs.map(doc => doc.data().año_seccion))];
          setAnios(aniosData);
          setAnioSeleccionado("");
          setSecciones([]);
          setSeccionSeleccionada("");
          setEstudiantes([]);
          setCargando(false);
        } catch (error) {
          console.error("Error al cargar años:", error);
          setCargando(false);
        }
      };
      
      cargarAnios();
    }, [periodoSeleccionado, periodos]);

  //? ====== CARGAR LAS SECCIONES ====== ///////

    useEffect(() => {
      const cargarSecciones = async () => {
        if (!periodoSeleccionado || !anioSeleccionado) return;
                try {
          setCargando(true);
          const periodoSeleccionadoObj = periodos.find(p => p.id === periodoSeleccionado);
          if (!periodoSeleccionadoObj) return;
          const seccionesRef = collection(db, "secciones");
          const q = query(
            seccionesRef,
            where("año_escolar", "==", periodoSeleccionadoObj.periodo),
            where("año_seccion", "==", anioSeleccionado)
          );
          const snapshot = await getDocs(q);
          
          const seccionesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setSecciones(seccionesData);
          setSeccionSeleccionada("");
          setEstudiantes([]);
          setCargando(false);
        } catch (error) {
          console.error("Error al cargar secciones:", error);
          setCargando(false);
        }
      };
      
      cargarSecciones();
    }, [anioSeleccionado, periodoSeleccionado, periodos]);

  return (
<div className="container mx-auto px-2 py-2 space-y-2">
  <Card>
    <CardHeader>
      <CardTitle>Generar Planilla de Notas Escolares</CardTitle>
      <CardDescription>Filtre por período escolar, año, sección y materia</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {/* Cambiado a 4 columnas */}
        {/* Selector de Período Escolar */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Período Escolar
          </label>
          <Select
            value={periodoSeleccionado}
            onValueChange={setPeriodoSeleccionado}
            disabled={cargando}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.id} value={periodo.id}>
                  {periodo.periodo} {periodo.status === "ACTIVO" ? "" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Año */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Año
          </label>
          <Select
            value={anioSeleccionado}
            onValueChange={setAnioSeleccionado}
            disabled={!periodoSeleccionado || cargando}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un año" />
            </SelectTrigger>
            <SelectContent>
              {anios.map((anio) => (
                <SelectItem key={anio} value={anio}>
                  {anio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Sección */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Sección
          </label>
          <Select
            value={seccionSeleccionada}
            onValueChange={setSeccionSeleccionada}
            disabled={!anioSeleccionado || cargando}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una sección" />
            </SelectTrigger>
            <SelectContent>
              {secciones.map((seccion) => (
                <SelectItem key={seccion.id} value={seccion.seccion}>
                  {seccion.seccion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Materia */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Materia
          </label>
          <Select
            value={seccionSeleccionada}
            onValueChange={setSeccionSeleccionada}
            disabled={!anioSeleccionado || cargando}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una materia" />
            </SelectTrigger>
            <SelectContent>
              {secciones.map((seccion) => (
                <SelectItem key={seccion.id} value={seccion.seccion}>
                  {seccion.seccion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Loader Spinner */}
  {cargando && (
    <div className="flex justify-center my-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )}
</div>
    );
}
