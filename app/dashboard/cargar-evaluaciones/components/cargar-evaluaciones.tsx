/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { addDocument, getCollection } from '@/lib/firebase'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CalendarIcon, PlusCircle, Trash2 } from 'lucide-react'
import { ContenidoCriterios, Evaluaciones } from '@/interfaces/evaluaciones.interface'
import { LapsosEscolares } from '@/interfaces/lapsos.interface'
import { AsignacionesDocentes } from '@/interfaces/asignaciones_docentes.interface'
import { where } from 'firebase/firestore'
import React from "react"
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from '@/hooks/use-user'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export default function CargarEvaluaciones() {
  const { 
    register, 
    handleSubmit, 
    setValue, 
    reset,
    control,
    formState: { errors },
    watch
  } = useForm<Evaluaciones>({
    defaultValues: {
      fecha: format(new Date(), 'dd/MM/yyyy')
    }
  })

  // Use the useUser hook instead of localStorage
  const user = useUser()

  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionesDocentes[]>([])
  const [showCriterios, setShowCriterios] = useState(false)
  const [criterios, setCriterios] = useState<ContenidoCriterios[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<Evaluaciones | null>(null)
  
  // Ref para el trigger del select de lapso y materia
  const [lapsoKey, setLapsoKey] = useState(0)
  const [materiaKey, setMateriaKey] = useState(0)
  const formatDate = (date: Date) => format(date, 'dd/MM/yyyy', { locale: es })


  // Watch nombre_evaluacion and tipo_evaluacion for capitalization
  const nombreEvaluacion = watch('nombre_evaluacion')
  const tipoEvaluacion = watch('tipo_evaluacion')

  // Function to capitalize first letter of each word
  const capitalizeWords = (text: string) => {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Apply capitalization when inputs change
  useEffect(() => {
    if (nombreEvaluacion) {
      setValue('nombre_evaluacion', capitalizeWords(nombreEvaluacion));
    }
  }, [nombreEvaluacion, setValue]);

  useEffect(() => {
    if (tipoEvaluacion) {
      setValue('tipo_evaluacion', capitalizeWords(tipoEvaluacion));
    }
  }, [tipoEvaluacion, setValue]);

  useEffect(() => {
    // Only fetch data if user is loaded
    if (user?.uid) {
      const fetchData = async () => {
        try {
          const lapsosData = await getCollection('lapsos', [where('status', '==', 'ACTIVO')])
          setLapsos(lapsosData as LapsosEscolares[])
          
          const asignacionesData = await getCollection('asignaciones_docentes', [
            where('docente_id', '==', user.uid)
          ])
          setAsignaciones(asignacionesData as AsignacionesDocentes[])
        } catch (error) {
          toast.error('Error cargando datos iniciales')
        }
      }
      fetchData()
    }
  }, [user])

  const handleAddCriterio = () => {
    if (criterios.length < 5) {
      setCriterios([...criterios, { 
        nro_criterio: (criterios.length + 1).toString(), 
        nombre: '', 
        ponderacion: 0
      }])
    }
  }

  const handleCriterioChange = (index: number, field: keyof ContenidoCriterios, value: string) => {
    if (field === 'nombre') {
      value = capitalizeWords(value);
      
      const duplicate = criterios.some((c, i) => 
        i !== index && c.nombre.toLowerCase() === value.toLowerCase()
      )
      if (duplicate) {
        toast.error('Este criterio ya existe')
        return
      }
    }
      const newCriterios = [...criterios]
        if (field === 'ponderacion') {
      const numValue = parseInt(value) || 0
      newCriterios[index][field] = numValue
    } else {
      newCriterios[index][field] = value
    }
    
    setCriterios(newCriterios)
  }

  const totalPonderacion = criterios.reduce((acc, curr) => acc + Number(curr.ponderacion || 0), 0)

  // Function to validate if a date is weekend (Saturday or Sunday)
  const isWeekend = (dateString: string): boolean => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  }

  const handleSubmitPreview = async (data: Evaluaciones) => {
    if (!user?.uid) {
      toast.error('Debe iniciar sesión para crear evaluaciones')
      return
    }

    if (!data.lapsop_id || !data.materia_id) {
      toast.error('Seleccione lapso y materia')
      return
    }

    if (showCriterios && totalPonderacion !== 20) {
      toast.error('La suma de las ponderaciones debe ser exactamente 20%')
      return
    }

    // Verificar si ya existe una evaluación con la misma fecha para esta materia
    try {
      const evaluacionesExistentes = await getCollection('evaluaciones', [
        where('materia_id', '==', data.materia_id),
        where('lapsop_id', '==', data.lapsop_id),
        where('docente_id', '==', user.uid),
        where('fecha', '==', data.fecha) 
      ])

      if (evaluacionesExistentes.length > 0) {
        toast.error('Ya existe una evaluación para esta materia en la misma fecha');
        return;
      }

      setFormDataToSubmit(data)
      setShowConfirmation(true)
    } catch (error) {
      console.error('Error verificando fechas:', error)
      toast.error('Error al validar la fecha')
    }
  }

  const confirmSubmission = async () => {
    if (!formDataToSubmit || !user?.uid) return
    
    setLoading(true)
    try {
      const evaluacionesExistentes = await getCollection('evaluaciones', [
        where('materia_id', '==', formDataToSubmit.materia_id),
        where('lapsop_id', '==', formDataToSubmit.lapsop_id),
        where('docente_id', '==', user.uid)
      ])
  
      if (evaluacionesExistentes.length >= 5) {
        toast.error('Límite máximo de 5 evaluaciones por materia alcanzado')
        return
      }
  
      // Get the selected asignación to access materia_nombre, año_seccion and seccion_id
      const selectedAsignacion = asignaciones.find(
        asig => asig.materia_id === formDataToSubmit.materia_id
      )
  
      if (!selectedAsignacion) {
        toast.error('Error: No se encontró la asignación seleccionada')
        return
      }
  
      const evaluationData: Evaluaciones = {
        ...formDataToSubmit,
        criterios: showCriterios ? criterios : [],
        nota_definitiva: showCriterios ? totalPonderacion : 20,
        docente_id: user.uid,
        fecha: formDataToSubmit.fecha,
        // Add these fields from the selected asignación
        materia_nombre: selectedAsignacion.materia_nombre,
        año_seccion: selectedAsignacion.año_seccion,
        seccion_id: selectedAsignacion.seccion_id,
        status: "POR EVALUAR"
      }
  
      await addDocument('evaluaciones', evaluationData)
      toast.success('Evaluación creada exitosamente')
      
      // Reset form and states
      setCriterios([])
      setShowCriterios(false)
      
      setLapsoKey(prevKey => prevKey + 1)
      setMateriaKey(prevKey => prevKey + 1)
      
      setValue('lapsop_id', '')
      setValue('materia_id', '')
      setValue('nombre_evaluacion', '')
      setValue('tipo_evaluacion', '')
      
    } catch (error) {
      console.error('Error guardando evaluación:', error)
      toast.error('Error al crear la evaluación')
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  // Get current date for max date validation
  const today = new Date().toISOString().split("T")[0];

  // Show loading or require login if user is not available
  if (user === undefined) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin text-2xl">⏳</div>
    </div>
  }

  return (
    <>
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" />
            Nueva Evaluación
          </CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit(handleSubmitPreview)}>
          <CardContent className="pt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selecciona El Lapso</Label>
                <Select
                  key={`lapso-select-${lapsoKey}`}
                  onValueChange={value => setValue('lapsop_id', value)}
                  required
                >
                  <SelectTrigger className="h-10" aria-invalid={!!errors.lapsop_id}>
                    <SelectValue placeholder="Seleccionar lapso" />
                  </SelectTrigger>
                  <SelectContent>
                    {lapsos.map(lapso => (
                      <SelectItem key={lapso.id_lapso} value={lapso.id_lapso}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lapso.nombre}</span>
                          <span className="text-muted-foreground">{lapso.año_escolar}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lapsop_id && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Campo requerido
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Materia y Sección</Label>
                <Select
                  key={`materia-select-${materiaKey}`}
                  onValueChange={value => setValue('materia_id', value)}
                  required
                >
                  <SelectTrigger className="h-10" aria-invalid={!!errors.materia_id}>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {asignaciones.map(asig => (
                      <SelectItem key={asig.materia_id} value={asig.materia_id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{asig.materia_nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {asig.año_seccion} - {asig.seccion_id}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materia_id && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Campo requerido
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre del Contenido</Label>
                <Input
                  {...register('nombre_evaluacion', { 
                    required: true,
                    validate: value => !!value.trim()
                  })}
                  className="h-10"
                  placeholder="Ej: Historia de Venezuela"
                  aria-invalid={!!errors.nombre_evaluacion}
                />
                {errors.nombre_evaluacion && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    El nombre es requerido
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Evaluación</Label>
                <Input
                  {...register('tipo_evaluacion', { required: true })}
                  className="h-10"
                  placeholder="Ej: Taller | Defensa | Prueba"
                  aria-invalid={!!errors.tipo_evaluacion}
                />
                {errors.tipo_evaluacion && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Campo requerido
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
  <Label className="text-sm font-medium">Fecha de Evaluación</Label>
  <Controller
    control={control}
    name="fecha"
    rules={{
      required: 'La fecha es requerida',
      validate: (value) => {
        const date = new Date(value);
        const day = date.getDay();
        return (day !== 0 && day !== 6) || 'No se permiten fines de semana';
      }
    }}
    render={({ field }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 justify-start text-left font-normal"
            aria-invalid={!!errors.fecha}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value || "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={new Date(field.value)}
            onSelect={(date) => {
              if (date) {
                field.onChange(formatDate(date));
              }
            }}
            disabled={{ 
              dayOfWeek: [0, 6]
            }}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    )}
  />
  {errors.fecha && (
    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {errors.fecha.message}
    </p>
  )}
</div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="criterios"
                  checked={showCriterios}
                  onCheckedChange={(checked) => setShowCriterios(!!checked)}
                />
                <Label htmlFor="criterios" className="text-sm font-medium">
                  Agregar criterios de evaluación
                </Label>
              </div>

              {showCriterios && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-4">
                    {criterios.map((criterio, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1">
                          <Input
                            value={criterio.nro_criterio}
                            disabled
                            className="text-center font-medium bg-background"
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            placeholder="Nombre del criterio"
                            value={criterio.nombre}
                            onChange={(e) => handleCriterioChange(index, 'nombre', e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-4">
                        <Input
  type="number"
  placeholder="Ponderación (%)"
  value={criterio.ponderacion}
  onChange={(e) => handleCriterioChange(index, 'ponderacion', e.target.value)}
  className="bg-background"
  min="1"
  max="20"
  onBlur={(e) => {
    // Asegurar que el valor esté entre 1 y 20
    let value = parseInt(e.target.value) || 0
    value = Math.max(1, Math.min(20, value))
    handleCriterioChange(index, 'ponderacion', value.toString())
  }}
/>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCriterios(criterios.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCriterio}
                        disabled={criterios.length >= 5}
                        className="gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Agregar Criterio
                      </Button>
                      
                      <div className={`flex items-center gap-2 ${
                        totalPonderacion !== 20 ? 'text-destructive' : 'text-success'
                      }`}>
                        {totalPonderacion !== 20 && <AlertCircle className="w-4 h-4" />}
                        <span className="font-medium">
                          Total: {totalPonderacion}/20
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t pt-6">
            <div className="flex justify-end w-full">
              <Button 
                type="submit" 
                size="lg"
                disabled={showCriterios && totalPonderacion !== 20}
                className="gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Guardar Evaluación
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Confirmar envío
            </DialogTitle>
            <DialogDescription asChild className="pt-4">
  <div className="space-y-3">
    <p>¿Estás seguro que deseas crear esta evaluación con los siguientes datos?</p>
    
    {formDataToSubmit && (
      <div className="bg-muted/20 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <p className="font-medium">Materia:</p>
            <p>
              {asignaciones.find(a => a.materia_id === formDataToSubmit.materia_id)?.materia_nombre} - 
              Año: {asignaciones.find(a => a.materia_id === formDataToSubmit.materia_id)?.año_seccion} - 
              Sección: {asignaciones.find(a => a.materia_id === formDataToSubmit.materia_id)?.seccion_id}
            </p>
          </div>

          <div>
            <p className="font-medium">Nombre:</p>
            <p>{formDataToSubmit.nombre_evaluacion}</p>
          </div>
          
          <div>
            <p className="font-medium">Tipo:</p>
            <p>{formDataToSubmit.tipo_evaluacion}</p>
          </div>
          
          <div>
            <p className="font-medium">Fecha:</p>
            <p>{formDataToSubmit.fecha}</p>
          </div>
          
          <div>
            <p className="font-medium">Criterios:</p>
            <p>{criterios.length} criterios agregados</p>
          </div>
          
          <div className="col-span-2">
            <p className="font-medium">Ponderación total:</p>
            <p>{showCriterios ? `${totalPonderacion}%` : '20%'}</p>
          </div>
        </div>
      </div>
    )}
  </div>
</DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={confirmSubmission}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin">⏳</div>
                  Enviando...
                </div>
              ) : 'Confirmar envío'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}