/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { Evaluaciones } from '@/interfaces/evaluaciones.interface';
import { Materias } from '@/interfaces/materias.interface';
import { getCollection } from '@/lib/firebase';
import { where } from 'firebase/firestore';
import { LayoutList } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function VerEvaluaciones() {
    const user = useUser();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([]);
    const [materias, setMaterias] = useState<Materias[]>([]);
    const [selectedMateria, setSelectedMateria] = useState<string>('');
    const [selectedAnio, setSelectedAnio] = useState<string>('');
    const [selectedSeccion, setSelectedSeccion] = useState<string>('');

    // Función para normalizar cualquier formato de fecha a string legible
    const normalizeDate = (date: any) => {
        if (typeof date === 'string') return date;
        if (date?.toDate) return date.toDate().toLocaleDateString('es-ES');
        if (date instanceof Date) return date.toLocaleDateString('es-ES');
        return 'Fecha no disponible';
    };

    // Función para normalizar fecha para ordenamiento (formato YYYY-MM-DD)
    const normalizeDateForSorting = (date: any) => {
        if (typeof date === 'string') return date;
        if (date?.toDate) return date.toDate().toISOString().split('T')[0];
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return '0000-00-00';
    };

    const getEvaluaciones = async () => {
        const path = `evaluaciones`;
        const query = [where("docente_id", "==", user?.uid)];
        setIsLoading(true);
        try {
            if (!user || !user.uid) return;
            const res = await getCollection(path, query) as Evaluaciones[];

            const sorted = res.sort((a, b) => {
                const dateA = normalizeDateForSorting(a.fecha);
                const dateB = normalizeDateForSorting(b.fecha);
                return dateB.localeCompare(dateA);
            });
            setEvaluaciones(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getMaterias = async () => {
        try {
            const res = await getCollection('materias') as Materias[];
            // Filtrar materias asignadas al usuario
            const userMaterias = res.filter(materia =>
                evaluaciones.some(evaluacion => evaluacion.materia_id === materia.id)
            );
            setMaterias(userMaterias);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user) {
            getEvaluaciones();
        }
    }, [user]);

    useEffect(() => {
        if (evaluaciones.length > 0) {
            getMaterias();
        }
    }, [evaluaciones]);

    const filteredEvaluaciones = evaluaciones.filter(evaluacion => {
        const materia = materias.find(m => m.id === evaluacion.materia_id);
        const materiaMatches = !selectedMateria || materia?.nombre === selectedMateria;
        const anioMatches = !selectedAnio || materia?.año === selectedAnio;
        const seccionMatches = !selectedSeccion || materia?.seccion === selectedSeccion;
        return materiaMatches && anioMatches && seccionMatches;
    });

    const renderCriteriosTooltip = (criterios: any[]) => {
        if (!criterios || criterios.length === 0) {
            return "No hay criterios asignados";
        }
        
        return (
            <div className="space-y-2">
            <h4 className="font-medium">Criterios de evaluación:</h4>
            <ul className="list-disc pl-4 space-y-1">
                {criterios.map((criterio, index) => (
                    <li key={index}>
                        <span className="font-medium">{criterio.nombre}:</span>
                        <span>{criterio.ponderacion} Pts</span>
                        
                    </li>
                ))}
            </ul>
        </div>
        );
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Mis Evaluaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-4 mb-4">
                        <Select onValueChange={(value) => setSelectedMateria(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecciona una materia" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...new Set(materias.map(m => m.nombre))].map((nombre, index) => (
                                    <SelectItem key={index} value={nombre}>{nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setSelectedAnio(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecciona un año" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...new Set(materias.map(m => m.año))].map((año, index) => (
                                    <SelectItem key={index} value={año}>{año}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setSelectedSeccion(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecciona una sección" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...new Set(materias.map(m => m.seccion))].map((seccion, index) => (
                                    <SelectItem key={index} value={seccion}>{seccion}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="custom-scroll max-h-[600px] overflow-y-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Evaluación</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Materia</TableHead>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {filteredEvaluaciones.map((evaluacion) => {
                                    const materia = materias.find(m => m.id === evaluacion.materia_id);
                                    return (
                                        <TableRow key={evaluacion.id} className="hover:bg-gray-100">
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={200}>
                                                        <TooltipTrigger asChild>
                                                            <span className="cursor-pointer underline">
                                                                {evaluacion.nombre_evaluacion}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-[300px]">
                                                            {renderCriteriosTooltip(evaluacion.criterios || [])}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>{evaluacion.tipo_evaluacion}</TableCell>
                                            <TableCell>{materia?.nombre} {materia?.año} {materia?.seccion}</TableCell>
                                            <TableCell>{evaluacion.lapsop_id}</TableCell>
                                            <TableCell>
                                                {normalizeDate(evaluacion.fecha)}
                                            </TableCell>
                                            <TableCell>{evaluacion.status}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                </TableBody>
                            </Table>
                            {!isLoading && filteredEvaluaciones.length === 0 && (
                                <div className="text-gray-200 my-20">
                                    <div className="flex justify-center">
                                        <LayoutList className="w-[120px] h-[120px]" />
                                    </div>
                                    <h2 className="text-center">
                                        No tienes evaluaciones registradas
                                    </h2>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}