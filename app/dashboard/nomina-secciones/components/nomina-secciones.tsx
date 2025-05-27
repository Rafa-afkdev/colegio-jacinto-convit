/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// Importaciones de shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import React from "react";

export default function NominaSeccion() {
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [anios, setAnios] = useState<string[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [secciones, setSecciones] = useState<{ id: string; [key: string]: any }[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState<{ id: string; apellidos: string; nombres: string; cedula: string; sexo: string; [key: string]: any }[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Cargar periodos escolares
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const periodosRef = collection(db, "periodos_escolares");
        const snapshot = await getDocs(periodosRef);
        const periodosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { periodo: string; status: string })
        }));
        
        setPeriodos(periodosData);
        
        // Seleccionar el periodo activo por defecto
        const periodoActivo = periodosData.find(p => p.status === "ACTIVO");
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
  
  // Cargar años cuando cambia el periodo
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
        
        // Extraer años únicos
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
  
  // Cargar secciones cuando cambia el año
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
  
  // Cargar estudiantes cuando cambia la sección
  useEffect(() => {
    const cargarEstudiantes = async () => {
      if (!periodoSeleccionado || !anioSeleccionado || !seccionSeleccionada) return;
      
      try {
        setCargando(true);
        const periodoSeleccionadoObj = periodos.find(p => p.id === periodoSeleccionado);
        if (!periodoSeleccionadoObj) return;
        
        const estudiantesRef = collection(db, "estudiantes");
        const q = query(
          estudiantesRef,
          where("periodo_escolar_actual", "==", periodoSeleccionadoObj.periodo),
          where("año_actual", "==", anioSeleccionado),
          where("seccion_actual", "==", seccionSeleccionada),
          where("estado", "==", "INSCRITO")
        );
        const snapshot = await getDocs(q);
        
        const estudiantesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { apellidos: string; nombres: string; cedula: string; sexo: string; [key: string]: any })
        }));
        
        // Ordenar por apellidos y nombres
        estudiantesData.sort((a, b) => {
          if (a.apellidos === b.apellidos) {
            return a.nombres.localeCompare(b.nombres);
          }
          return a.apellidos.localeCompare(b.apellidos);
        });
        
        setEstudiantes(estudiantesData);
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        setCargando(false);
      }
    };
    
    cargarEstudiantes();
  }, [seccionSeleccionada, periodoSeleccionado, anioSeleccionado, periodos]);
  
  // Función para generar PDF
  const generarPDF = async () => {
    try {
      const periodoObj = periodos.find(p => p.id === periodoSeleccionado);
      
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const {width, height} = page.getSize();
      
      // Cargar imágenes en base64
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/Logo.png").then((res) => res.arrayBuffer());

      const totalMasculino = estudiantes.filter(e => e.sexo === "MASCULINO").length;
      const totalFemenino = estudiantes.filter(e => e.sexo === "FEMENINO").length;

      const logo1 = await pdfDoc.embedPng(logo1Bytes);
      const logo2 = await pdfDoc.embedPng(logo2Bytes);
      const logo3 = await pdfDoc.embedPng(logo3Bytes);

      // Dimensiones de las imágenes
      const logo1Width = 110, logo1Height = 50;
      const logo2Width = 250, logo2Height = 40;
      const logo3Width = 55, logo3Height = 50;
      
      // Dibujar las imágenes en el encabezado
      page.drawImage(logo1, {
        x: 50, // Izquierda
        y: height - 80,
        width: logo1Width,
        height: logo1Height,
      });

      // Texto del ministerio (según imagen)
      page.drawImage(logo2, {
        x: width / 2 - logo2Width / 2.5, // Centro
        y: height - 75,
        width: logo2Width,
        height: logo2Height,
      });

      page.drawImage(logo3, {
        x: width - logo3Width - 50, // Derecha
        y: height - 80,
        width: logo3Width,
        height: logo3Height,
      });
      
      // Título con formato actualizado según imagen
      page.drawText(`${anioSeleccionado[0]}° Año Sección "${seccionSeleccionada}"`, {
        x: width / 2 - 100,
        y: height - 120,
        size: 20,
        font: helveticaBold,
        color: rgb(0, 0, 0.6),
      });
      
      // Tabla simplificada como en la imagen
      const margenIzquierdo = 50;
      const anchoColumna1 = 40;  // Columna N°
      const anchoColumna2 = 100; // Columna CÉDULA
      const anchoTotal = 500;    // Ancho total de la tabla
      
      // Cabecera de la tabla
      // Líneas horizontales superior de la cabecera
      page.drawLine({
        start: { x: margenIzquierdo, y: height - 160 },
        end: { x: margenIzquierdo + anchoTotal, y: height - 160 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Línea entre cabecera y datos
      page.drawLine({
        start: { x: margenIzquierdo, y: height - 185 },
        end: { x: margenIzquierdo + anchoTotal, y: height - 185 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Encabezados de columna - centrados
      page.drawText("N°", {
        x: margenIzquierdo + (anchoColumna1 / 2) - 5,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });
      
      page.drawText("CÉDULA", {
        x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - 25,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });
      
      page.drawText("APELLIDOS Y NOMBRES", {
        x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 90,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });
      
      // Ordenar estudiantes por cédula
      const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
        return parseInt(a.cedula, 10) - parseInt(b.cedula, 10);
      });
      
      // Primera pasada - determinar las dimensiones finales
      let yPosition = height - 185;
      const lineHeight = 15; // Reducido de 25 a 18
      
      // Calcular posición final de la tabla
      const finalTableYPosition = yPosition - (estudiantesOrdenados.length * lineHeight);
      
      // Dibujar líneas verticales que encierran la tabla completa
      page.drawLine({
        start: { x: margenIzquierdo, y: height - 160 },
        end: { x: margenIzquierdo, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      page.drawLine({
        start: { x: margenIzquierdo + anchoColumna1, y: height - 160 },
        end: { x: margenIzquierdo + anchoColumna1, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      page.drawLine({
        start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: height - 160 },
        end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      page.drawLine({
        start: { x: margenIzquierdo + anchoTotal, y: height - 160 },
        end: { x: margenIzquierdo + anchoTotal, y: finalTableYPosition },
        thickness: 1, 
        color: rgb(0, 0, 0),
      });
      
      // Segunda pasada - dibujar el contenido de la tabla
      yPosition = height - 185;
      
      estudiantesOrdenados.forEach((estudiante, index) => {
        // Dibujar línea horizontal solo si no es el último estudiante
        if (index < estudiantesOrdenados.length - 1) {
          page.drawLine({
            start: { x: margenIzquierdo, y: yPosition - lineHeight },
            end: { x: margenIzquierdo + anchoTotal, y: yPosition - lineHeight },
            thickness: 0.9,
            color: rgb(0, 0, 0),
            
          });
        }
        
        // Calcular el ancho del texto para centrarlo
        const indexText = `${index + 1}`;
        const indexWidth = helveticaFont.widthOfTextAtSize(indexText, 12);
        const cedulaText = `${estudiante.cedula}`;
        const cedulaWidth = helveticaFont.widthOfTextAtSize(cedulaText, 12);
        
        // Dibujar número de estudiante centrado
        page.drawText(indexText, {
          x: margenIzquierdo + (anchoColumna1 / 2) - (indexWidth / 2),
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });
        
        // Dibujar cédula centrada
        page.drawText(cedulaText, {
          x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - (cedulaWidth / 2),
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });
        
        // Nombre completo (alineado a la izquierda)
        page.drawText(`${estudiante.apellidos} ${estudiante.nombres}`.toUpperCase(), {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 30,
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });
        
        yPosition -= lineHeight;
      });
      
      // Línea final de la tabla
      page.drawLine({
        start: { x: margenIzquierdo, y: finalTableYPosition },
        end: { x: margenIzquierdo + anchoTotal, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Información de totales (tamaño reducido)
      page.drawText(`Total de estudiantes: ${estudiantes.length}`, {
        x: margenIzquierdo,
        y: finalTableYPosition - 20,
        size: 12,
        font: helveticaBold,
      });
      
      page.drawText(`Varones: ${totalMasculino}`, {
        x: margenIzquierdo,
        y: finalTableYPosition - 35,
        size: 12,
        font: helveticaBold,
      });
      
      page.drawText(`Hembras: ${totalFemenino}`, {
        x: margenIzquierdo,
        y: finalTableYPosition - 50,
        size: 12,
        font: helveticaBold,
      });
      
      // Generar y abrir el PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Card for selecting options */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona Las Opciones</CardTitle>
          <CardDescription>Filtre por período escolar, año y sección</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>
  
      {/* Loader Spinner */}
      {cargando && (
        <div className="flex justify-center my-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
  
      {/* List of Students */}
      {estudiantes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Lista de Estudiantes ({estudiantes.length})
            </CardTitle>
            <Button onClick={generarPDF} disabled={cargando}>
              <FileText/>
              Generar Nómina
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">N°</TableHead>
                  <TableHead className="w-32">Cédula</TableHead>
                  <TableHead>Apellidos y Nombres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {/* Ordenar estudiantes por cédula antes de renderizar */}
              {[...estudiantes]
                .sort((a, b) => parseInt(a.cedula, 10) - parseInt(b.cedula, 10)) // Ordenar por cédula
                .map((estudiante, index) => (
                  <TableRow key={estudiante.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{estudiante.cedula}</TableCell>
                    <TableCell>
                      {estudiante.apellidos}, {estudiante.nombres}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
  
      {/* No Students Found Alert */}
      {!cargando && periodoSeleccionado && anioSeleccionado && seccionSeleccionada && estudiantes.length === 0 && (
        <Alert variant="default">
          <AlertDescription>
            No se encontraron estudiantes para la sección seleccionada.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}