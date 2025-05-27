/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react'
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from '@/components/ui/card'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, AlertCircle, FileText } from 'lucide-react'
import { getCollection } from '@/lib/firebase'
import { where } from 'firebase/firestore'
import { Evaluaciones } from '@/interfaces/evaluaciones.interface'
import { useUser } from '@/hooks/use-user'
import React from 'react'
import { Students } from '@/interfaces/students.interface'
import { Notas, Calificaciones } from '@/interfaces/notas.inteface'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function VerNotas() {
    const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([])
    const [evaluacionesCompletadas, setEvaluacionesCompletadas] = useState<Evaluaciones[]>([])
    const [filteredEvaluaciones, setFilteredEvaluaciones] = useState<Evaluaciones[]>([])
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<string>('')
    const [selectedAño, setSelectedAño] = useState<string>('')
    const [selectedSeccion, setSelectedSeccion] = useState<string>('')
    const [availableAños, setAvailableAños] = useState<string[]>([])
    const [availableSecciones, setAvailableSecciones] = useState<string[]>([])
    const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluaciones | null>(null)
    const [students, setStudents] = useState<Students[]>([])
    const [notas, setNotas] = useState<Record<string, Notas>>({})
    const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(true)
    const [loadingNotas, setLoadingNotas] = useState(false)
    
    const user = useUser()
    const { toast } = useToast()

    // Cargar evaluaciones del docente
    useEffect(() => {
        const fetchEvaluaciones = async () => {
            setLoadingEvaluaciones(true)
            try {
                if (!user || !user.uid) return
                
                const path = `evaluaciones`
                const query = [where("docente_id", "==", user.uid)]
                const res = await getCollection(path, query) as Evaluaciones[]
                
                // Ordenar por fecha (más reciente primero)
                const normalizeDate = (date: any) => {
                    if (typeof date === 'string') return date
                    if (date?.toDate) return date.toDate().toISOString().split('T')[0]
                    if (date instanceof Date) return date.toISOString().split('T')[0]
                    return '0000-00-00'
                }
                
                const sorted = res.sort((a, b) => {
                    const dateA = normalizeDate(a.fecha)
                    const dateB = normalizeDate(b.fecha)
                    return dateB.localeCompare(dateA)
                })
                
                setEvaluaciones(sorted)
                
                // Filtrar solo evaluaciones completadas (con notas)
                const completadas = sorted.filter(e => e.status === 'EVALUADA')
                setEvaluacionesCompletadas(completadas)
                
                // Obtener los años disponibles de evaluaciones completadas
                const años = [...new Set(completadas.map(e => e.año_seccion.toLowerCase()))]
                setAvailableAños(años)
            } catch (error) {
                console.error("Error al cargar evaluaciones:", error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudieron cargar las evaluaciones."
                })
            } finally {
                setLoadingEvaluaciones(false)
            }
        }

        if (user) {
            fetchEvaluaciones()
        }
    }, [user, toast])

    // Efecto para filtrar secciones basadas en el año seleccionado
    useEffect(() => {
        if (!selectedAño) {
            setAvailableSecciones([])
            setSelectedSeccion('')
            return
        }
        
        // Filtrar evaluaciones por año y obtener secciones disponibles
        const evaluacionesPorAño = evaluacionesCompletadas.filter(
            e => e.año_seccion.toLowerCase() === selectedAño
        )
        
        const secciones = [...new Set(evaluacionesPorAño.map(e => e.seccion_id))]
        setAvailableSecciones(secciones)
        
        // Limpiar sección seleccionada
        setSelectedSeccion('')
    }, [selectedAño, evaluacionesCompletadas])

    // Efecto para filtrar evaluaciones basadas en año y sección seleccionados
    useEffect(() => {
        if (!selectedAño || !selectedSeccion) {
            setFilteredEvaluaciones([])
            setSelectedEvaluacionId('')
            return
        }
        
        // Filtrar evaluaciones por año y sección (solo evaluaciones completadas)
        const evaluacionesFiltradas = evaluacionesCompletadas.filter(
            e => e.año_seccion.toLowerCase() === selectedAño && e.seccion_id === selectedSeccion
        )
        
        setFilteredEvaluaciones(evaluacionesFiltradas)
        setSelectedEvaluacionId('')
    }, [selectedAño, selectedSeccion, evaluacionesCompletadas])

    // Manejar selección de año
    const handleSelectAño = (año: string) => {
        setSelectedAño(año)
        setSelectedSeccion('')
        setSelectedEvaluacionId('')
        setSelectedEvaluacion(null)
        setStudents([])
        setNotas({})
    }

    // Manejar selección de sección
    const handleSelectSeccion = (seccion: string) => {
        setSelectedSeccion(seccion)
        setSelectedEvaluacionId('')
        setSelectedEvaluacion(null)
        setStudents([])
        setNotas({})
    }

    // Manejar selección de evaluación
    const handleSelectEvaluacion = async (evaluacionId: string) => {
        setSelectedEvaluacionId(evaluacionId)
        setStudents([])
        setNotas({})
        
        if (!evaluacionId) {
            setSelectedEvaluacion(null)
            return
        }
        
        const evaluacion = evaluaciones.find(e => e.id === evaluacionId)
        if (!evaluacion) return
        
        setSelectedEvaluacion(evaluacion)
        
        // Cargar estudiantes y notas
        await loadStudentsAndNotas(evaluacion)
    }

    // Cargar estudiantes y notas existentes
    const loadStudentsAndNotas = async (evaluacion: Evaluaciones) => {
        setLoadingNotas(true)
        try {
            // Obtener estudiantes del mismo año y sección que la evaluación y con estado INSCRITO
            const studentsQuery = [
                where("año_actual", "==", evaluacion.año_seccion.toLowerCase()),
                where("seccion_actual", "==", evaluacion.seccion_id),
                where("estado", "==", "INSCRITO")
            ]
            const studentsData = await getCollection('estudiantes', studentsQuery) as Students[]
            setStudents(studentsData)

            // Obtener las notas para esta evaluación
            if (evaluacion.id) {
                // Modifica la consulta para obtener todas las notas de esta evaluación
                // No es necesario un where ya que estamos consultando la colección específica de notas
                // para esta evaluación
                const notasPath = `evaluaciones/${evaluacion.id}/notas`;
                const notasSnapshot = await getCollection(notasPath) as Notas[]
                
                console.log("Notas obtenidas:", notasSnapshot);
                
                // Mapear las notas por id_estudiante para fácil acceso
                const notasMap: Record<string, Notas> = {};
                notasSnapshot.forEach(nota => {
                    if (nota.id_estudiante) {
                        notasMap[nota.id_estudiante] = nota;
                    }
                });
                
                setNotas(notasMap);
            }
        } catch (error) {
            console.error("Error al cargar datos:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los estudiantes o las notas."
            })
        } finally {
            setLoadingNotas(false)
        }
    }

    // Función para obtener el resultado de aprobación (Aprobado/Reprobado)
    const getResultadoAprobacion = (puntaje: number) => {
        return puntaje >= 10 ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                Aprobado
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                Reprobado
            </Badge>
        )
    }

    // Función para encontrar la calificación de un criterio específico
    const getCalificacionCriterio = (nota: Notas | undefined, criterioNro: string): number | string => {
        if (!nota || !nota.calificaciones) return '-';
        
        const criterio = nota.calificaciones.find(c => c.nombre_criterio === criterioNro);
        return criterio ? criterio.puntacion : '-';
    }

    return (
        <div className="space-y-6">
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Ver Notas de Evaluaciones</CardTitle>
                    <CardDescription>
                        Selecciona el año, sección y evaluación para visualizar las calificaciones de los estudiantes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Selección de año */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium mb-2">Año:</h3>
                                {loadingEvaluaciones ? (
                                    <div className="flex items-center space-x-2 py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-sm">Cargando años...</span>
                                    </div>
                                ) : availableAños.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No hay evaluaciones calificadas disponibles.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Select value={selectedAño} onValueChange={handleSelectAño}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar año" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAños.map((año) => (
                                                <SelectItem key={año} value={año}>
                                                    {año.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Selección de sección */}
                            {selectedAño && (
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium mb-2">Sección:</h3>
                                    {availableSecciones.length === 0 ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                No hay secciones disponibles para el año seleccionado.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Select value={selectedSeccion} onValueChange={handleSelectSeccion}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar sección" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableSecciones.map((seccion) => (
                                                    <SelectItem key={seccion} value={seccion}>
                                                        Sección {seccion}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}

                            {/* Selección de evaluación */}
                            {selectedAño && selectedSeccion && (
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium mb-2">Evaluación:</h3>
                                    {filteredEvaluaciones.length === 0 ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                No hay evaluaciones calificadas para el año y sección seleccionados.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Select value={selectedEvaluacionId} onValueChange={handleSelectEvaluacion}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar evaluación" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredEvaluaciones.map((evaluacion) => (
                                                    <SelectItem key={evaluacion.id} value={evaluacion.id}>
                                                        {evaluacion.nombre_evaluacion} - {evaluacion.materia_nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedEvaluacion && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
                                <h3 className="font-medium text-lg">{selectedEvaluacion.nombre_evaluacion}</h3>
                                <div className="text-sm text-gray-600 space-y-1 mt-1">
                                    <p>Materia: {selectedEvaluacion.materia_nombre} - {selectedEvaluacion.año_seccion.toUpperCase()} {selectedEvaluacion.seccion_id}</p>
                                    {/* <p>Tipo: {selectedEvaluacion.tipo_evaluacion} | Fecha: {
                                        typeof selectedEvaluacion.fecha === 'string' 
                                            ? selectedEvaluacion.fecha 
                                            : selectedEvaluacion.fecha?.toDate 
                                                ? selectedEvaluacion.fecha.toDate().toLocaleDateString() 
                                                : 'N/A'
                                    } | Periodo: {selectedEvaluacion.lapsop_id}</p> */}
                                    
                                    {selectedEvaluacion.criterios && selectedEvaluacion.criterios.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium">Criterios de evaluación:</p>
                                            <ul className="list-disc list-inside pl-2 mt-1">
                                                {selectedEvaluacion.criterios.map((criterio) => (
                                                    <li key={criterio.nro_criterio}>
                                                        {criterio.nombre}: {criterio.ponderacion} pts
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedEvaluacion && (
                            <>
                                {loadingNotas ? (
                                    <div className="flex justify-center items-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2">Cargando notas...</span>
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-lg font-medium">No hay estudiantes inscritos</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No se encontraron estudiantes inscritos en esta sección.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto mt-4">
                                        {/* Tabla para evaluaciones con criterios */}
                                        {selectedEvaluacion.criterios && selectedEvaluacion.criterios.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="w-[250px]">Estudiante</TableHead>
                                                        {selectedEvaluacion.criterios.map((criterio) => (
                                                            <TableHead key={criterio.nro_criterio} className="text-center">
                                                                {criterio.nombre} <br /> 
                                                                <span className="text-xs font-normal">({criterio.ponderacion} pts)</span>
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="text-center w-[80px]">Total</TableHead>
                                                        <TableHead className="text-center w-[100px]">Estado</TableHead>
                                                        <TableHead className="w-[220px]">Comentario</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((student) => {
                                                        const nota = notas[student.id!]
                                                        
                                                        return (
                                                            <TableRow key={student.id} className="hover:bg-gray-50">
                                                                <TableCell className="font-medium">
                                                                    {student.apellidos}, {student.nombres}
                                                                    <div className="text-xs text-gray-500">C.I. {student.cedula}</div>
                                                                </TableCell>
                                                                
                                                                {selectedEvaluacion.criterios.map((criterio) => (
                                                                    <TableCell key={criterio.nro_criterio} className="text-center">
                                                                        {getCalificacionCriterio(nota, criterio.nro_criterio)}
                                                                    </TableCell>
                                                                ))}
                                                                
                                                                <TableCell className="text-center font-bold">
                                                                    {nota && nota.total !== undefined ? (
                                                                        <div className={`rounded-md py-1 px-2 inline-block w-14 ${
                                                                            nota.total >= 10 ? 'bg-green-100' : 'bg-red-100'
                                                                        }`}>
                                                                            {nota.total}
                                                                        </div>
                                                                    ) : (
                                                                        <span>-</span>
                                                                    )}
                                                                </TableCell>
                                                                
                                                                <TableCell className="text-center">
                                                                    {nota && nota.total !== undefined ? (
                                                                        getResultadoAprobacion(nota.total)
                                                                    ) : (
                                                                        <span>-</span>
                                                                    )}
                                                                </TableCell>
                                                                
                                                                <TableCell>
                                                                    <div className="text-sm text-gray-600">
                                                                        {nota?.comentario || '-'}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            /* Tabla simplificada para evaluaciones sin criterios */
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="w-[250px]">Estudiante</TableHead>
                                                        <TableHead className="text-center w-[100px]">Calificación</TableHead>
                                                        <TableHead className="text-center w-[100px]">Estado</TableHead>
                                                        <TableHead className="w-[220px]">Comentario</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((student) => {
                                                        const nota = notas[student.id!]
                                                        const notaUnica = nota?.calificaciones?.find(c => c.nombre_criterio === 'nota_unica')
                                                        
                                                        return (
                                                            <TableRow key={student.id} className="hover:bg-gray-50">
                                                                <TableCell className="font-medium">
                                                                    {student.apellidos}, {student.nombres}
                                                                    <div className="text-xs text-gray-500">C.I. {student.cedula}</div>
                                                                </TableCell>
                                                                
                                                                <TableCell className="text-center">
                                                                    {nota && nota.total !== undefined ? (
                                                                        <div className={`rounded-md py-1 px-2 inline-block w-14 ${
                                                                            nota.total >= 10 ? 'bg-green-100' : 'bg-red-100'
                                                                        }`}>
                                                                            {nota.total}
                                                                        </div>
                                                                    ) : (
                                                                        <span>-</span>
                                                                    )}
                                                                </TableCell>
                                                                
                                                                <TableCell className="text-center">
                                                                    {nota && nota.total !== undefined ? (
                                                                        getResultadoAprobacion(nota.total)
                                                                    ) : (
                                                                        <span>-</span>
                                                                    )}
                                                                </TableCell>
                                                                
                                                                <TableCell>
                                                                    <div className="text-sm text-gray-600">
                                                                        {nota?.comentario || '-'}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}