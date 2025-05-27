/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react"; // <-- Agrega esto
import type { Students } from "@/interfaces/students.interface";
import { getCollection } from "@/lib/firebase";
import { where } from "firebase/firestore";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { CardTitle } from "@/components/ui/card";

export function CreateConstanciaStudent() {
  const [students, setStudents] = useState<Students | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cedula, setCedula] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedConstanciaType, setSelectedConstanciaType] = useState<'estudio' | 'inscripcion'>('estudio');

  const handleGenerateConstancia = () => {
    if (!students) return;

      // Verificar estado del estudiante
  if (students.estado !== "INSCRITO") {
    toast.error("El estudiante no está inscrito, no se puede generar la constancia");
    return;
  }
    
    if (selectedConstanciaType === 'estudio') {
      generatePdfDocumentConstanciaDeEstudio(students);
    } else {
      generatePdfDocumentConstanciaDeInscripcion(students);
    }
  };

  const getStudents = async () => {
    if (!cedula.trim()) {
      toast.error("Por favor, ingrese una cédula válida");
      return;
    }

    setIsLoading(true);

    try {
      const path = `estudiantes`;
      const query = [where("cedula", "==", Number(cedula))];
      const res = (await getCollection(path, query)) as any[];

      if (res.length > 0) {
        setStudents(res[0]); // Guardamos el primer resultado
      } else {
        toast.error("Estudiante no encontrado"); // Mostramos el mensaje si no se encuentra
        setStudents(null); // Limpiamos el estado
      }
    } catch (error: any) {
      console.error("Error fetching student:", error);
      toast.error("Ocurrió un error al buscar el estudiante");
    } finally {
      setIsLoading(false);
    }
  };
// ... (código anterior sin cambios hasta la parte de generatePdfDocument)

const generatePdfDocumentConstanciaDeEstudio = async (student: Students) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const leftMargin = 60; // Margen izquierdo (1 pulgada)
    const rightMargin = 60; // Margen derecho (1 pulgada)
    const marginY = 50;
    const indentSize = 0; // Tamaño de la sangría
    let currentY = height - marginY;

    const getWordWidth = (word: string, fontSize: number, font: any) => {
      return font.widthOfTextAtSize(word, fontSize);
    };

     // Helper function to justify line of text
  const drawJustifiedLine = (
    words: { text: string; font: any; underline?: boolean }[],
    y: number,
    maxWidth: number,
    fontSize: number,
    isLastLine: boolean = false
  ) => {
    if (words.length === 0) return;

    // Calculate total width of words
    const totalWordsWidth = words.reduce(
      (sum, word) => sum + getWordWidth(word.text, fontSize, word.font),
      0
    );

    // Calculate spacing
    const totalSpaces = words.length - 1;
    const spaceWidth = isLastLine
      ? getWordWidth(" ", fontSize, arialFont)
      : (maxWidth - totalWordsWidth) / totalSpaces;

      let currentX = indentSize? leftMargin + indentSize : leftMargin;
      words.forEach((word, index) => {
      page.drawText(word.text, {
        x: currentX,
        y,
        size: fontSize,
        font: word.font,
        color: rgb(0, 0, 0),
      });

      if (word.underline) {
        page.drawLine({
          start: { x: currentX, y: y - 2 },
          end: { x: currentX + getWordWidth(word.text, fontSize, word.font), y: y - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }

      currentX += getWordWidth(word.text, fontSize, word.font);
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  };


  let isFirstLineOfContent = true;
    // Función auxiliar para detectar si una palabra excede el margen derecho
    // const willExceedRightMargin = (currentX: number, text: string, fontSize: number, font: any) => {
    //     const textWidth = font.widthOfTextAtSize(text, fontSize);
    //     return currentX + textWidth > width - rightMargin;
    // };

    // Helper function for underlined text (sin cambios)
    const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x, y, size: fontSize, font });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + textWidth, y: y - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      return textWidth;
    };

    // Logos (ajustados para respetar los márgenes)
    const logoMinisterio = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
    const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
    const logo = await fetch("/Logo.png").then((res) => res.arrayBuffer());

    const embeddedLogoMinisterio = await pdfDoc.embedPng(logoMinisterio);
    const embeddedLogoText = await pdfDoc.embedPng(logoText);
    const embeddedLogo = await pdfDoc.embedPng(logo);

    page.drawImage(embeddedLogoMinisterio, {
      x: leftMargin,
      y: currentY - 60,
      width: 130,
      height: 60,
    });

    page.drawImage(embeddedLogoText, {
      x: width / 2 - 70,
      y: currentY - 60,
      width: 210,
      height: 38,
    });

    page.drawImage(embeddedLogo, {
      x: width - rightMargin - 60,
      y: currentY - 60,
      width: 60,
      height: 60,
    });

    currentY -= 100;

    // Header texts (sin cambios excepto por el uso de leftMargin)
    const headerTexts = [
      "República Bolivariana de Venezuela",
      "Ministerio del Poder Popular para la Educación",
      'U.E. COLEGIO ADVENTISTA "LIBERTADOR"',
      "Camaguán Estado Guárico",
      "RIF-J-29797805-4",
    ];

    headerTexts.forEach((text) => {
      const centerX = (width - arialFont.widthOfTextAtSize(text, 12)) / 2;
      page.drawText(text, {
        x: centerX,
        y: currentY,
        size: 12,
        font: arialFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
    });

    currentY -= 20;

    // Title (ajustado para mantener centrado)
    const titleText = "CONSTANCIA DE ESTUDIO";
    const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
    drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
    currentY -= 30;

    // Content with formatted text and strict margin control
    const contentParts = [
      { text: "Quien Suscribe, MSc. Efraín Infante, Titular de la C.I: ", font: arialFont },
      { text: "11.235.943", font: boldFont },
      { text: ", Director de la Unidad Educativa Colegio Adventista Libertador Código del Plantel PD00911201, Ubicada en el Casco Central Calle Fray Tomas Castro Cruce con Miranda Camaguán Estado Guárico, por medio de la presente hace constar que el (a) Estudiante: ", font: arialFont },
      { text: `${student.apellidos} ${student.nombres}`, font: boldFont, underline: true },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text:"V-" + student.cedula.toString(), font: boldFont },
      { text: ", cursa ", font: arialFont },
      { text: "ESTUDIOS", font: boldFont, underline: true },
      { text: ` de ${(student.año_actual?.[0] ?? "N/A")}° año en el Nivel de Educación Media General, en esta Institución. En el Periodo Escolar ${student.periodo_escolar_actual ?? "N/A"}.`, font: arialFont },
    ];

    const effectiveWidth = width - leftMargin - rightMargin - indentSize; // Ajustado para la sangría
    const lineHeight = 18;
    const fontSize = 12;
  
    let currentLineWords: any[] = [];
    let currentLineWidth = 0;
    // let isFirstLineOfContent = true; // Para la primera línea de "Quien Suscribe"



    
    contentParts.forEach(part => {
      const words = part.text.trim().split(/\s+/);
      
      words.forEach(word => {
        const wordWidth = getWordWidth(word, fontSize, part.font);
        const spaceWidth = getWordWidth(" ", fontSize, part.font);
        
        if (currentLineWidth + wordWidth + (currentLineWords.length > 0 ? spaceWidth : 0) > effectiveWidth) {
          // Draw current line justified
          drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
          currentY -= lineHeight;
          currentLineWords = [];
          currentLineWidth = 0;
          isFirstLineOfContent = false;
        }
        
        currentLineWords.push({
          text: word,
          font: part.font,
          underline: part.underline
        });
        currentLineWidth += wordWidth + (currentLineWords.length > 1 ? spaceWidth : 0);
      });
    });
  
    // Draw last line (not justified)
    if (currentLineWords.length > 0) {
      drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
      // currentY -= lineHeight;
    }
    currentY -= lineHeight * 2;

    // Date (ajustado para respetar márgenes)
    const dateText = `Constancia que se expide a petición de parte interesada en Camaguán el día ${formatDate(new Date())}.`;
    const dateWords = dateText.split(/\s+/).map(word => ({
      text: word,
      font: arialFont
    }));
    
    let dateLine: any[] = [];
  let dateLineWidth = 0;
  let isFirstLineOfDate = true;



    // Asegurarse de que la fecha respete el margen derecho
 dateWords.forEach(word => {
    const wordWidth = getWordWidth(word.text, fontSize, word.font);
    const spaceWidth = getWordWidth(" ", fontSize, word.font);
    
    if (dateLineWidth + wordWidth + (dateLine.length > 0 ? spaceWidth : 0) > effectiveWidth) {
      drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, isFirstLineOfDate);
      currentY -= lineHeight;
      dateLine = [];
      dateLineWidth = 0;
      isFirstLineOfDate = false;
    }
    
    dateLine.push(word);
    dateLineWidth += wordWidth + (dateLine.length > 1 ? spaceWidth : 0);
  });
  
  if (dateLine.length > 0) {
    drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, true);
  }

  currentY -= lineHeight * 5; // Increased space before signature

  // Centered signature block
  const signatureTexts = [
    "________________________________",
    "MSc. Efraín José Infante Garrido",
    'DIRECTOR (A) DEL U.E.C.A. "LIBERTADOR"'
  ];

  signatureTexts.forEach(text => {
    const textWidth = arialFont.widthOfTextAtSize(text, fontSize);
    const centerX = (width - textWidth) / 2;
    
    page.drawText(text, {
      x: centerX,
      y: currentY,
      size: fontSize,
      font: arialFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 1.5; // Increased spacing between signature lines
  });


    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  const generatePdfDocumentConstanciaDeInscripcion = async (student: Students) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const leftMargin = 60; // Margen izquierdo (1 pulgada)
    const rightMargin = 60; // Margen derecho (1 pulgada)
    const marginY = 50;
    const indentSize = 0; // Tamaño de la sangría
    let currentY = height - marginY;

    const getWordWidth = (word: string, fontSize: number, font: any) => {
      return font.widthOfTextAtSize(word, fontSize);
    };

     // Helper function to justify line of text
  const drawJustifiedLine = (
    words: { text: string; font: any; underline?: boolean }[],
    y: number,
    maxWidth: number,
    fontSize: number,
    isLastLine: boolean = false
  ) => {
    if (words.length === 0) return;

    // Calculate total width of words
    const totalWordsWidth = words.reduce(
      (sum, word) => sum + getWordWidth(word.text, fontSize, word.font),
      0
    );

    // Calculate spacing
    const totalSpaces = words.length - 1;
    const spaceWidth = isLastLine
      ? getWordWidth(" ", fontSize, arialFont)
      : (maxWidth - totalWordsWidth) / totalSpaces;

      let currentX = indentSize? leftMargin + indentSize : leftMargin;
      words.forEach((word, index) => {
      page.drawText(word.text, {
        x: currentX,
        y,
        size: fontSize,
        font: word.font,
        color: rgb(0, 0, 0),
      });

      if (word.underline) {
        page.drawLine({
          start: { x: currentX, y: y - 2 },
          end: { x: currentX + getWordWidth(word.text, fontSize, word.font), y: y - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }

      currentX += getWordWidth(word.text, fontSize, word.font);
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  };


  let isFirstLineOfContent = true;
    // Función auxiliar para detectar si una palabra excede el margen derecho
    // const willExceedRightMargin = (currentX: number, text: string, fontSize: number, font: any) => {
    //     const textWidth = font.widthOfTextAtSize(text, fontSize);
    //     return currentX + textWidth > width - rightMargin;
    // };

    // Helper function for underlined text (sin cambios)
    const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x, y, size: fontSize, font });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + textWidth, y: y - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      return textWidth;
    };

    // Logos (ajustados para respetar los márgenes)
    const logoMinisterio = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
    const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
    const logo = await fetch("/Logo.png").then((res) => res.arrayBuffer());

    const embeddedLogoMinisterio = await pdfDoc.embedPng(logoMinisterio);
    const embeddedLogoText = await pdfDoc.embedPng(logoText);
    const embeddedLogo = await pdfDoc.embedPng(logo);

    page.drawImage(embeddedLogoMinisterio, {
      x: leftMargin,
      y: currentY - 60,
      width: 130,
      height: 60,
    });

    page.drawImage(embeddedLogoText, {
      x: width / 2 - 70,
      y: currentY - 60,
      width: 210,
      height: 38,
    });

    page.drawImage(embeddedLogo, {
      x: width - rightMargin - 60,
      y: currentY - 60,
      width: 60,
      height: 60,
    });

    currentY -= 100;

    // Header texts (sin cambios excepto por el uso de leftMargin)
    const headerTexts = [
      "República Bolivariana de Venezuela",
      "Ministerio del Poder Popular para la Educación",
      'U.E. COLEGIO ADVENTISTA "LIBERTADOR"',
      "Camaguán Estado Guárico",
      "RIF-J-29797805-4",
    ];

    headerTexts.forEach((text) => {
      const centerX = (width - arialFont.widthOfTextAtSize(text, 12)) / 2;
      page.drawText(text, {
        x: centerX,
        y: currentY,
        size: 12,
        font: arialFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
    });

    currentY -= 20;

    // Title (ajustado para mantener centrado)
    const titleText = "CONSTANCIA DE INSCRIPCIÓN";
    const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
    drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
    currentY -= 30;

    // Content with formatted text and strict margin control
    const contentParts = [
      { text: "Quien Suscribe, MSc. Efraín Infante, Titular de la C.I: ", font: arialFont },
      { text: "11.235.943", font: boldFont },
      { text: ", Director de la U.E.C. Adventista Libertador , Ubicada en el Casco Central Calle Fray Tomas Castro Cruce con Miranda Camaguán Estado Guárico, por medio de la presente hace constar que el (a) Estudiante: ", font: arialFont },
      { text: `${student.apellidos} ${student.nombres}`, font: boldFont, underline: true },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text:"V-" + student.cedula.toString(), font: boldFont },
      { text: ", ha sido ", font: arialFont },
      { text: "INSCRITO", font: boldFont, underline: true },
      { text: `(a) en esta institución para cursar estudios de ${student.año_actual?.[0] ?? "N/A"}° año en el Nivel de Educación Media General, en esta Institución. En el Periodo Escolar ${student.periodo_escolar_actual}.`, font: arialFont },
    ];

    const effectiveWidth = width - leftMargin - rightMargin - indentSize; // Ajustado para la sangría
    const lineHeight = 18;
    const fontSize = 12;
  
    let currentLineWords: any[] = [];
    let currentLineWidth = 0;
    // let isFirstLineOfContent = true; // Para la primera línea de "Quien Suscribe"



    
    contentParts.forEach(part => {
      const words = part.text.trim().split(/\s+/);
      
      words.forEach(word => {
        const wordWidth = getWordWidth(word, fontSize, part.font);
        const spaceWidth = getWordWidth(" ", fontSize, part.font);
        
        if (currentLineWidth + wordWidth + (currentLineWords.length > 0 ? spaceWidth : 0) > effectiveWidth) {
          // Draw current line justified
          drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
          currentY -= lineHeight;
          currentLineWords = [];
          currentLineWidth = 0;
          isFirstLineOfContent = false;
        }
        
        currentLineWords.push({
          text: word,
          font: part.font,
          underline: part.underline
        });
        currentLineWidth += wordWidth + (currentLineWords.length > 1 ? spaceWidth : 0);
      });
    });
  
    // Draw last line (not justified)
    if (currentLineWords.length > 0) {
      drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
      // currentY -= lineHeight;
    }
    currentY -= lineHeight * 2;

    // Date (ajustado para respetar márgenes)
    const dateText = `Constancia que se expide a petición de parte interesada en Camaguán el día ${formatDate(new Date())}.`;
    const dateWords = dateText.split(/\s+/).map(word => ({
      text: word,
      font: arialFont
    }));
    
    let dateLine: any[] = [];
  let dateLineWidth = 0;
  let isFirstLineOfDate = true;



    // Asegurarse de que la fecha respete el margen derecho
 dateWords.forEach(word => {
    const wordWidth = getWordWidth(word.text, fontSize, word.font);
    const spaceWidth = getWordWidth(" ", fontSize, word.font);
    
    if (dateLineWidth + wordWidth + (dateLine.length > 0 ? spaceWidth : 0) > effectiveWidth) {
      drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, isFirstLineOfDate);
      currentY -= lineHeight;
      dateLine = [];
      dateLineWidth = 0;
      isFirstLineOfDate = false;
    }
    
    dateLine.push(word);
    dateLineWidth += wordWidth + (dateLine.length > 1 ? spaceWidth : 0);
  });
  
  if (dateLine.length > 0) {
    drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, true);
  }

  currentY -= lineHeight * 5; // Increased space before signature

  // Centered signature block
  const signatureTexts = [
    "________________________________",
    "MSc. Efraín José Infante Garrido",
    'DIRECTOR (A) DEL U.E.C.A. "LIBERTADOR"'
  ];

  signatureTexts.forEach(text => {
    const textWidth = arialFont.widthOfTextAtSize(text, fontSize);
    const centerX = (width - textWidth) / 2;
    
    page.drawText(text, {
      x: centerX,
      y: currentY,
      size: fontSize,
      font: arialFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 1.5; // Increased spacing between signature lines
  });


    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

// ... (resto del código sin cambios)

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("es-VE", options);
  };

  // Rest of the component remains the same
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-200 max-w-md mx-auto">
          <CardTitle>Buscar Estudiante</CardTitle><br />

          <Input
  type="number"
  placeholder="Ingrese la cédula"
  value={cedula}
  maxLength={11} // Evita que se escriban más de 11 caracteres
  onInput={(e) => {
    const input = e.target as HTMLInputElement;
    if (input.value.length > 11) {
      input.value = input.value.slice(0, 11);
    }
  }}
  onChange={(e) => setCedula(e.target.value)}
  onWheel={(e) => {
    // Previene el comportamiento predeterminado del scroll
    e.currentTarget.blur(); // Quita el foco del input para evitar cambios
  }}
  className="mb-4 border-gray-300 focus:ring-indigo-500"
/>
          <Button
            onClick={getStudents}
            disabled={isLoading}
            className={`w-full py-2 }`}
          >
            {isLoading ? "Buscando..." : "Buscar Estudiante "}
          </Button>
        </div>
      </Dialog>
      {students && (
        <div className="flex flex-col gap-4 p-4 bg-background shadow-md rounded-2xl max-w-lg mx-auto mt-4">
          <h3 className="text-xl font-semibold text-foreground">Datos del Estudiante</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Nombre:</span> {students.nombres}
            </p>
            <p className="text-sm">
              <span className="font-medium">Apellido:</span> {students.apellidos}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Select 
              value={selectedConstanciaType}
              onValueChange={(value) => setSelectedConstanciaType(value as 'estudio' | 'inscripcion')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione el tipo de constancia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estudio">Constancia de Estudio</SelectItem>
                <SelectItem value="inscripcion">Constancia de Inscripción</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerateConstancia}
              className="w-full"
            >
              Generar Constancia
            </Button>
          </div>

          {pdfUrl && (
            <div className="mt-4">
              <iframe 
                src={pdfUrl} 
                width="100%" 
                height="500px" 
                className="border rounded-lg"
                title="Vista previa de la constancia"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}