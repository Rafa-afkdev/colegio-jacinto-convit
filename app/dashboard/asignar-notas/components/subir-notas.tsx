/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardFooter,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, UserCheck, AlertCircle, Check } from 'lucide-react'
import { getCollection, addDocument, updateDocument } from '@/lib/firebase'
import { where } from 'firebase/firestore'
import { Evaluaciones } from '@/interfaces/evaluaciones.interface'
import { useUser } from '@/hooks/use-user'
import React from 'react'
import { Students } from '@/interfaces/students.interface'
import { Calificaciones, Notas } from '@/interfaces/notas.inteface'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SubirNotas() {
    const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([])
    const [availableEvaluaciones, setAvailableEvaluaciones] = useState<Evaluaciones[]>([])
    const [filteredEvaluaciones, setFilteredEvaluaciones] = useState<Evaluaciones[]>([])
    const [completedEvaluaciones, setCompletedEvaluaciones] = useState<string[]>([])
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<string>('')
    const [selectedAño, setSelectedAño] = useState<string>('')
    const [selectedSeccion, setSelectedSeccion] = useState<string>('')
    const [availableAños, setAvailableAños] = useState<string[]>([])
    const [availableSecciones, setAvailableSecciones] = useState<string[]>([])
    const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluaciones | null>(null)
    const [students, setStudents] = useState<Students[]>([])
    const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(true)
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [savingNotes, setSavingNotes] = useState(false)
    const [existingNotas, setExistingNotas] = useState<Record<string, Notas>>({})
    const [notasData, setNotasData] = useState<Record<string, { 
        calificaciones: Record<string, number>,
        comentario: string,
        total: number
    }>>({})
    
    const user = useUser()
    const { toast } = useToast()
    const router = useRouter()

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
                
                // Verificar cuáles evaluaciones ya están completas
                const completedIds: string[] = []
                for (const evaluation of sorted) {
                    if (evaluation.status === 'EVALUADA') {
                        completedIds.push(evaluation.id)
                    }
                }
                
                setCompletedEvaluaciones(completedIds)
                
                // Obtener los años disponibles
                const años = [...new Set(sorted.map(e => e.año_seccion?.toLowerCase() || ''))].filter(a => a !== '')
                setAvailableAños(años)
                
                // Filtrar evaluaciones pendientes
                const pendingEvaluations = sorted.filter(e => !completedIds.includes(e.id))
                setAvailableEvaluaciones(pendingEvaluations)
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
        const evaluacionesPorAño = availableEvaluaciones.filter(
            e => e.año_seccion?.toLowerCase() === selectedAño
        )
        
        const secciones = [...new Set(evaluacionesPorAño.map(e => e.seccion_id))]
        setAvailableSecciones(secciones)
        
        // Limpiar sección seleccionada
        setSelectedSeccion('')
    }, [selectedAño, availableEvaluaciones])

    // Efecto para filtrar evaluaciones basadas en año y sección seleccionados
    useEffect(() => {
        if (!selectedAño || !selectedSeccion) {
            setFilteredEvaluaciones([])
            setSelectedEvaluacionId('')
            return
        }
        
        // Filtrar evaluaciones por año y sección
        const evaluacionesFiltradas = availableEvaluaciones.filter(
            e => e.año_seccion?.toLowerCase() === selectedAño && e.seccion_id === selectedSeccion
        )
        
        setFilteredEvaluaciones(evaluacionesFiltradas)
        setSelectedEvaluacionId('')
    }, [selectedAño, selectedSeccion, availableEvaluaciones])

    // Manejar selección de año
    const handleSelectAño = (año: string) => {
        setSelectedAño(año)
        setSelectedSeccion('')
        setSelectedEvaluacionId('')
        setSelectedEvaluacion(null)
        setStudents([])
    }

    // Manejar selección de sección
    const handleSelectSeccion = (seccion: string) => {
        setSelectedSeccion(seccion)
        setSelectedEvaluacionId('')
        setSelectedEvaluacion(null)
        setStudents([])
    }

    // Manejar selección de evaluación
    const handleSelectEvaluacion = async (evaluacionId: string) => {
        setSelectedEvaluacionId(evaluacionId)
        setStudents([])
        setNotasData({})
        setExistingNotas({})
        
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
        setLoadingStudents(true)
        try {
            // Obtener estudiantes del mismo año y sección que la evaluación y con estado INSCRITO
            const studentsQuery = [
                where("año_actual", "==", evaluacion.año_seccion?.toLowerCase() || ''),
                where("seccion_actual", "==", evaluacion.seccion_id),
                where("estado", "==", "INSCRITO")
            ]
            const studentsData = await getCollection('estudiantes', studentsQuery) as Students[]
            setStudents(studentsData)

            // Inicializar datos de notas
            const initialNotasData: Record<string, { 
                calificaciones: Record<string, number>,
                comentario: string,
                total: number
            }> = {}

            // Verificar si ya existen notas para esta evaluación
            if (evaluacion.id) {
                const notasQuery = [where("evaluacion_id", "==", evaluacion.id)]
                const notasSnapshot = await getCollection(`evaluaciones/${evaluacion.id}/notas`, notasQuery) as Notas[]                
                const notasMap: Record<string, Notas> = {}
                
                // Mapear las notas existentes por id_estudiante
                notasSnapshot.forEach(nota => {
                    notasMap[nota.id_estudiante] = nota

                    // Inicializar con los datos existentes
                    const califMap: Record<string, number> = {}
                    
                    // Si tiene calificaciones específicas por criterio
                    if (nota.calificaciones && nota.calificaciones.length > 0) {
                        nota.calificaciones.forEach(cal => {
                            califMap[cal.nombre_criterio] = cal.puntacion
                        })
                    } else {
                        // Si solo tiene nota única
                        califMap['nota_unica'] = nota.total || 0
                    }

                    initialNotasData[nota.id_estudiante] = {
                        calificaciones: califMap,
                        comentario: nota.comentario || '',
                        total: nota.total
                    }
                })
                
                setExistingNotas(notasMap)
            }

            // Para los estudiantes sin notas, inicializar con valores por defecto
            studentsData.forEach(student => {
                if (!initialNotasData[student.id!]) {
                    const califMap: Record<string, number> = {}
                    
                    // Si la evaluación tiene criterios, usar esos
                    if (evaluacion.criterios && evaluacion.criterios.length > 0) {
                        evaluacion.criterios.forEach(criterio => {
                            califMap[criterio.nro_criterio] = 0
                        })
                    } else {
                        // Si no tiene criterios, usar nota única
                        califMap['nota_unica'] = 0
                    }

                    initialNotasData[student.id!] = {
                        calificaciones: califMap,
                        comentario: '',
                        total: 0
                    }
                }
            })

            setNotasData(initialNotasData)
        } catch (error) {
            console.error("Error al cargar datos:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los estudiantes o las notas existentes."
            })
        } finally {
            setLoadingStudents(false)
        }
    }

    // Manejar cambio de calificación para criterios
    const handleCalificacionChange = (
        studentId: string, 
        criterioNro: string, 
        value: string, 
        maxValue: number
    ) => {
        // Convertir a número y validar que no exceda la ponderación máxima
        let numValue = parseFloat(value)
        if (isNaN(numValue)) numValue = 0
        if (numValue > maxValue) numValue = maxValue
        if (numValue < 0) numValue = 0

        setNotasData(prev => {
            const updatedData = { ...prev }
            updatedData[studentId] = {
                ...updatedData[studentId],
                calificaciones: {
                    ...updatedData[studentId].calificaciones,
                    [criterioNro]: numValue
                }
            }

            // Recalcular total
            if (criterioNro === 'nota_unica') {
                // Si es nota única, el total es igual a esa nota
                updatedData[studentId].total = numValue
            } else {
                // Si son criterios, sumar todos
                const newTotal = Object.keys(updatedData[studentId].calificaciones).reduce(
                    (sum, criterio) => sum + updatedData[studentId].calificaciones[criterio], 
                    0
                )
                updatedData[studentId].total = newTotal
            }

            return updatedData
        })
    }

    // Manejar cambio de calificación única (sin criterios)
    const handleNotaUnicaChange = (studentId: string, value: string) => {
        // Convertir a número y validar que esté entre 0 y 20
        let numValue = parseFloat(value)
        if (isNaN(numValue)) numValue = 0
        if (numValue > 20) numValue = 20
        if (numValue < 0) numValue = 0

        setNotasData(prev => {
            const updatedData = { ...prev }
            updatedData[studentId] = {
                ...updatedData[studentId],
                calificaciones: {
                    nota_unica: numValue
                },
                total: numValue // El total es igual a la nota única
            }
            return updatedData
        })
    }

    // Manejar cambio de comentario
    const handleComentarioChange = (studentId: string, value: string) => {
        setNotasData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                comentario: value
            }
        }))
    }

    // Guardar todas las notas
// Guardar todas las notas
const handleSaveAllNotes = async () => {
    if (!selectedEvaluacion) return
    
    setSavingNotes(true)
    try {
        const batch = []
        const date = new Date().toISOString()

        for (const studentId in notasData) {
            const studentData = notasData[studentId]
            const existingNota = existingNotas[studentId]
            
            // Encontrar el estudiante correspondiente para obtener su nombre
            const student = students.find(s => s.id === studentId)
            const nombreEstudiante = student ? `${student.apellidos}, ${student.nombres}` : ''

            // Convertir a formato de interfaz Notas
            let calificacionesArray: Calificaciones[] = []
            
            // Si la evaluación tiene criterios
            if (selectedEvaluacion.criterios && selectedEvaluacion.criterios.length > 0) {
                calificacionesArray = Object.entries(studentData.calificaciones).map(
                    ([nombre_criterio, puntacion]) => ({
                        nombre_criterio,
                        puntacion
                    })
                )
            } else {
                // Si es nota única, crear un único elemento en el array
                calificacionesArray = [{
                    nombre_criterio: 'nota_unica',
                    puntacion: studentData.total
                }]
            }

            const notaData: Omit<Notas, 'id'> = {
                id_estudiante: studentId,
                calificaciones: calificacionesArray,
                total: studentData.total,
                comentario: studentData.comentario,
                createdAt: date,
                evaluacion: selectedEvaluacion.nombre_evaluacion,
                docente_nombre: user?.name,
                docente_id: user?.uid,  // Agregar ID del docente
                lapso: selectedEvaluacion.lapsop_id,
                materia: selectedEvaluacion.materia_nombre,
                nombre_evaluacion: selectedEvaluacion.nombre_evaluacion,
                periodo_escolar: selectedEvaluacion.periodo_escolar  || '',  // Agregar periodo escolar
                año_seccion: selectedEvaluacion.año_seccion,  // Agregar año_seccion
                seccion: selectedEvaluacion.seccion_id,  // Agregar seccion
                nombre_estudiante: nombreEstudiante  // Agregar nombre del estudiante
            }

            let notaId: string;
            
            if (existingNota) {
                // Actualizar nota existente
                notaId = existingNota.id;
                batch.push(updateDocument(
                    `evaluaciones/${selectedEvaluacion.id}/notas/${existingNota.id}`, 
                    notaData
                ))
            } else {
                // Crear nueva nota
                const addNotePromise = addDocument(
                    `evaluaciones/${selectedEvaluacion.id}/notas`, 
                    notaData
                );
                batch.push(addNotePromise);
                
                // Necesitamos obtener el ID de la nota creada
                addNotePromise.then(result => {
                    notaId = result.id;
                });
            }
            
            // Agregar la nota a la colección del estudiante
            const notaEstudianteData = {
                ...notaData,
                fecha: date,
                evaluacion_nombre: selectedEvaluacion.nombre_evaluacion,
                materia_nombre: selectedEvaluacion.materia_nombre,
                año_seccion: selectedEvaluacion.año_seccion,
                seccion_id: selectedEvaluacion.seccion_id,
                lapso: selectedEvaluacion.lapsop_id
            };
            
            batch.push(addDocument(
                `estudiantes/${studentId}/notas`,
                notaEstudianteData
            ));
        }

        // Marcar la evaluación como completada
        batch.push(updateDocument(
            `evaluaciones/${selectedEvaluacion.id}`,
            { status: 'EVALUADA' } 
        ));

        // Ejecutar todas las operaciones
        await Promise.all(batch)
        
        toast({
            title: "Notas guardadas",
            description: "Las calificaciones han sido registradas exitosamente."
        })
        
        // Actualizar lista de evaluaciones disponibles
        setCompletedEvaluaciones(prev => [...prev, selectedEvaluacion.id])
        setAvailableEvaluaciones(prev => prev.filter(e => 
            !completedEvaluaciones.includes(e.id) && e.id !== selectedEvaluacion.id
        ))
        
        // Limpiar selección
        setSelectedEvaluacion(null)
        setSelectedEvaluacionId('')
        
        router.refresh()
    } catch (error) {
        console.error("Error al guardar notas:", error)
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron guardar las calificaciones."
        })
    } finally {
        setSavingNotes(false)
    }
}

    return (
        <div className="space-y-6">
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Subir Notas de Evaluaciones</CardTitle>
                    <CardDescription>
                        Selecciona el año, sección y evaluación para registrar las calificaciones de los estudiantes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Selección de año */}
                        <div className="flex flex-col md:flex-row gap-4">

                        <div className='flex-1'>
                            <h3 className="text-sm font-medium mb-2">Selecciona el año:</h3>
                            {loadingEvaluaciones ? (
                                <div className="flex items-center space-x-2 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm">Cargando años...</span>
                                </div>
                            ) : availableAños.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No hay años disponibles con evaluaciones pendientes.
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
                                <h3 className="text-sm font-medium mb-2">Selecciona la sección:</h3>
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
                            <div className='flex-1'>
                                <h3 className="text-sm font-medium mb-2">Selecciona una evaluación:</h3>
                                {filteredEvaluaciones.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No hay evaluaciones pendientes para el año y sección seleccionados.
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

                        {completedEvaluaciones.length > 0 && (
                            <div className="pt-2">
                                <h3 className="text-sm font-medium mb-2">Evaluaciones ya calificadas:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {evaluaciones
                                        .filter(e => completedEvaluaciones.includes(e.id))
                                        .map(evaluacion => (
                                            <Badge key={evaluacion.id} variant="secondary" className="flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                {evaluacion.nombre_evaluacion} ({evaluacion.materia_nombre})
                                            </Badge>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {selectedEvaluacion && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
                                <h3 className="font-medium text-lg">{selectedEvaluacion.nombre_evaluacion}</h3>
                                <div className="text-sm text-gray-600 space-y-1 mt-1">
                                    <p>Materia: {selectedEvaluacion.materia_nombre} - {selectedEvaluacion.año_seccion} {selectedEvaluacion.seccion_id}</p>
                                    <p>Tipo: {selectedEvaluacion.tipo_evaluacion} | Fecha: {selectedEvaluacion.fecha} | Periodo: {selectedEvaluacion.lapsop_id}</p>
                                    
                                    {selectedEvaluacion.criterios && selectedEvaluacion.criterios.length > 0 ? (
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
                                    ) : (
                                        <div className="mt-2">
                                            <p className="font-medium">Evaluación sin criterios específicos</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Esta evaluación requiere una única nota por estudiante (escala 0-20)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedEvaluacion && (
                            <>
                                {loadingStudents ? (
                                    <div className="flex justify-center items-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2">Cargando estudiantes...</span>
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
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
                                                        <TableHead className="w-[200px]">Estudiante</TableHead>
                                                        {selectedEvaluacion.criterios.map((criterio) => (
                                                            <TableHead key={criterio.nro_criterio} className="text-center">
                                                                {criterio.nombre} <br /> 
                                                                <span className="text-xs font-normal">({criterio.ponderacion} pts)</span>
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="text-center w-[80px]">Total</TableHead>
                                                        <TableHead className="w-[220px]">Comentario</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((student) => (
                                                        <TableRow key={student.id} className="hover:bg-gray-50">
                                                            <TableCell className="font-medium">
                                                                {student.apellidos}, {student.nombres}
                                                                <div className="text-xs text-gray-500">C.I. {student.cedula}</div>
                                                            </TableCell>
                                                            
                                                            {selectedEvaluacion.criterios.map((criterio) => (
                                                                <TableCell key={criterio.nro_criterio} className="text-center">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={criterio.ponderacion}
                                                                        step="0.5"
                                                                        className="w-15 text-center h-8 mx-auto"
                                                                        value={notasData[student.id!]?.calificaciones[criterio.nro_criterio] || 0}
                                                                        onChange={(e) =>
                                                                            handleCalificacionChange(
                                                                                student.id!,
                                                                                criterio.nro_criterio,
                                                                                e.target.value,
                                                                                criterio.ponderacion
                                                                            )
                                                                        }
                                                                    />
                                                                </TableCell>
                                                            ))}
                                                            
                                                            <TableCell className="text-center font-bold">
                                                                <div className={`rounded-md py-1 px-2 inline-block w-14 ${
                                                                    notasData[student.id!]?.total >= 10 ? 'bg-green-100' : 'bg-red-100'
                                                                }`}>
                                                                    {notasData[student.id!]?.total || 0}
                                                                </div>
                                                            </TableCell>
                                                            
                                                            <TableCell>
                                                                <Textarea
                                                                    className="h-10 min-h-10 text-xs resize-none"
                                                                    placeholder="Comentario opcional"
                                                                    value={notasData[student.id!]?.comentario || ''}
                                                                    onChange={(e) => handleComentarioChange(student.id!, e.target.value)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            /* Tabla simplificada para evaluaciones sin criterios */
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="w-[200px]">Estudiante</TableHead>
                                                        <TableHead className="text-center w-[100px]">Calificación</TableHead>
                                                        <TableHead className="w-[220px]">Comentario</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((student) => (
                                                        <TableRow key={student.id} className="hover:bg-gray-50">
                                                            <TableCell className="font-medium">
                                                                {student.apellidos}, {student.nombres}
                                                                <div className="text-xs text-gray-500">C.I. {student.cedula}</div>
                                                            </TableCell>
                                                            
                                                            <TableCell className="text-center">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="20"
                                                                    step="0.5"
                                                                    className="w-20 mx-auto text-center h-9"
                                                                    value={notasData[student.id!]?.calificaciones.nota_unica || 0}
                                                                    onChange={(e) => handleNotaUnicaChange(
                                                                        student.id!,
                                                                        e.target.value
                                                                    )}
                                                                />
                                                                <div className={`mt-1 rounded-md py-1 px-2 mx-auto inline-block w-14 ${
                                                                    notasData[student.id!]?.total >= 10 ? 'bg-green-100' : 'bg-red-100'
                                                                }`}>
                                                                    {notasData[student.id!]?.total || 0}
                                                                </div>
                                                            </TableCell>
                                                            
                                                            <TableCell>
                                                                <Textarea
                                                                    className="h-10 min-h-10 text-xs resize-none"
                                                                    placeholder="Comentario opcional"
                                                                    value={notasData[student.id!]?.comentario || ''}
                                                                    onChange={(e) => handleComentarioChange(student.id!, e.target.value)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
                
                {selectedEvaluacion && students.length > 0 && (
                    <CardFooter className="border-t pt-4 flex justify-end">
                        <Button 
                            variant="default" 
                            size="lg" 
                            onClick={handleSaveAllNotes}
                            disabled={savingNotes}
                        >
                            {savingNotes ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar calificaciones
                                </>
                            )}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}