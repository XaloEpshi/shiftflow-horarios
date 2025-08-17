//Gestiona y visualiza los horarios de trabajo.
"use client"

import * as React from "react"
import { getDaysInMonth, format, addMonths, subMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, User, Calendar as CalendarIcon, Settings, FileDown, MoreVertical } from "lucide-react"

import type { Employee, EmployeeSchedule, ShiftType } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { generateInitialSchedule } from "@/lib/data"
import { saveSchedule, loadSchedule } from "@/lib/firestore"
import { Skeleton } from "./ui/skeleton"

const ALL_SHIFT_TYPES: ShiftType[] = ["Mañana", "Tarde", "Noche", "Administrativo", "Insumos", "Descanso"]

const shiftVariantMap: Record<ShiftType, string> = {
  "Mañana": "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "Tarde": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "Noche": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
  "Administrativo": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  "Insumos": "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  "Descanso": "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
}

interface ScheduleViewProps {
  employees: Employee[]
  initialScheduleData: EmployeeSchedule[]
}

export function ScheduleView({ employees: allEmployees, initialScheduleData }: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = React.useState(startOfMonth(new Date()))
  const [schedules, setSchedules] = React.useState<EmployeeSchedule[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("all")
  const [activeEmployeeIds, setActiveEmployeeIds] = React.useState<Set<string>>(new Set(allEmployees.map(e => e.id)));
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast()

  const activeEmployees = React.useMemo(() => allEmployees.filter(e => activeEmployeeIds.has(e.id)), [allEmployees, activeEmployeeIds]);
  
  const getScheduleId = (date: Date) => `schedule_${format(date, "yyyy-MM")}`;

  const generateBlankSchedule = React.useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    return activeEmployees.map(emp => ({
      employeeId: emp.id,
      schedule: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        shift: 'Descanso' as ShiftType,
      })),
    }));
  }, [currentDate, activeEmployees]);

  React.useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      const scheduleId = getScheduleId(currentDate);
      try {
        const savedSchedules = await loadSchedule(scheduleId);
        if (savedSchedules) {
          setSchedules(savedSchedules);
        } else {
          setSchedules(generateBlankSchedule());
        }
      } catch (error) {
        console.error("Failed to read from Firestore", error);
        setSchedules(generateBlankSchedule());
        toast({
          variant: "destructive",
          title: "Error al Cargar",
          description: "No se pudo cargar el horario. Mostrando uno en blanco.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [currentDate, activeEmployeeIds.size, generateBlankSchedule]);

  const generateSchedule = React.useCallback(() => {
    const newSchedules = generateInitialSchedule(
        activeEmployees,
        currentDate.getFullYear(),
        currentDate.getMonth()
    );
    setSchedules(newSchedules);
  }, [currentDate, activeEmployees]);

  const handleShiftChange = (employeeId: string, day: number, newShift: ShiftType) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(empSchedule => {
        if (empSchedule.employeeId === employeeId) {
          const newDailySchedules = empSchedule.schedule.map(d =>
            d.day === day ? { ...d, shift: newShift } : d
          )
          return { ...empSchedule, schedule: newDailySchedules }
        }
        return empSchedule
      })
    )
  }
  
  const clearSchedule = () => {
    setSchedules(generateBlankSchedule());
  };
  
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    const scheduleId = getScheduleId(currentDate);
    try {
      await saveSchedule(scheduleId, schedules);
      toast({
        title: "Horario Guardado",
        description: "El horario actual ha sido guardado en la nube.",
      });
    } catch (error) {
      console.error("Failed to save to Firestore", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo guardar el horario. Inténtalo de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const filteredEmployees = selectedEmployeeId === "all"
    ? activeEmployees
    : activeEmployees.filter(e => e.id === selectedEmployeeId)

  const shiftTypesToDisplay = activeEmployees.length === 7 
    ? ALL_SHIFT_TYPES.filter(s => s !== 'Insumos')
    : ALL_SHIFT_TYPES;

  const exportToCsv = () => {
    const headers = ["Empleado", ...Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => `${i + 1}`)];
    const rows = filteredEmployees.map(employee => {
      const empSchedule = schedules.find(s => s.employeeId === employee.id);
      if (!empSchedule) return [employee.name];
      const shifts = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
        return empSchedule.schedule.find(s => s.day === i + 1)?.shift || 'Descanso';
      });
      return [employee.name, ...shifts];
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const monthName = format(currentDate, "MMMM-yyyy", { locale: es });
    link.setAttribute("download", `horario-${monthName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-2xl font-headline">Horario de Trabajo</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="text-lg font-semibold text-center w-40 capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </h3>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            
                <div className="hidden md:flex items-center gap-2">
                     <Button variant="outline" onClick={generateSchedule} disabled={isSaving}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Generar
                     </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="outline" disabled={isSaving}>
                            <Icons.save className="mr-2 h-4 w-4" />
                            Guardar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Guardado</AlertDialogTitle>
                          <AlertDialogDescription>
                           Esta acción guardará el horario actual en la nube. ¿Estás seguro?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSaveSchedule}>
                            Guardar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                     <Button variant="outline" onClick={clearSchedule} disabled={isSaving}>
                        <Icons.trash className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                    <Button onClick={exportToCsv} variant="outline" disabled={isSaving}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                </div>

                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><Users className="inline-block w-4 h-4 mr-2"/>Todos los empleados</SelectItem>
                    {activeEmployees.map(e => (
                      <SelectItem key={e.id} value={e.id}><User className="inline-block w-4 h-4 mr-2"/>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Settings className="w-4 h-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Gestionar Empleados</SheetTitle>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                           {allEmployees.map(employee => (
                             <div key={employee.id} className="flex items-center space-x-2">
                               <Checkbox
                                 id={`employee-${employee.id}`}
                                 checked={activeEmployeeIds.has(employee.id)}
                                 onCheckedChange={(checked) => {
                                   setActiveEmployeeIds(prev => {
                                     const newSet = new Set(prev);
                                     if (checked) {
                                       newSet.add(employee.id);
                                     } else {
                                       if (newSet.size > 7) { // Prevent disabling all employees
                                         newSet.delete(employee.id);
                                       } else {
                                          toast({
                                            variant: "destructive",
                                            title: "Operación no permitida",
                                            description: "Debe haber al menos 7 empleados activos.",
                                          });
                                       }
                                     }
                                     return newSet;
                                   });
                                 }}
                               />
                               <Label htmlFor={`employee-${employee.id}`}>{employee.name}</Label>
                             </div>
                           ))}
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={generateSchedule} disabled={isSaving}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Generar Horario
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                 <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                     <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                        <Icons.save className="mr-2 h-4 w-4" />
                                        Guardar
                                     </div>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Guardado</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción guardará el horario actual en la nube. ¿Estás seguro?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleSaveSchedule}>
                                        Guardar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={clearSchedule} disabled={isSaving}>
                                <Icons.trash className="mr-2 h-4 w-4" />
                                Limpiar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={exportToCsv} disabled={isSaving}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : (
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-20 p-2 text-sm font-bold text-left bg-card w-36">Empleado</TableHead>
                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map(day => (
                  <TableHead key={day} className="p-2 text-sm font-bold text-center w-28">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(employee => {
                const empSchedule = schedules.find(s => s.employeeId === employee.id)
                if (!empSchedule) return null
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="sticky left-0 z-10 p-2 font-medium text-left bg-card w-36">{employee.name}</TableCell>
                    {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map((day, dayIndex) => {
                      const shift = empSchedule.schedule.find(s => s.day === day)?.shift || "Descanso"
                      return (
                        <TableCell key={day} className={cn("p-1.5 text-center border-l")}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn("w-full h-full p-1 text-xs font-semibold border", shiftVariantMap[shift])}
                                disabled={isSaving}
                              >
                                {shift}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {shiftTypesToDisplay.map(shiftType => (
                                <DropdownMenuItem key={shiftType} onSelect={() => handleShiftChange(employee.id, day, shiftType)}>
                                  {shiftType}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          )}
        </div>
         {selectedEmployeeId !== 'all' && !isLoading && (
          <div className="p-4 mt-4 border rounded-lg bg-muted/50">
            <h4 className="mb-2 font-bold">Resumen de Turnos:</h4>
            <div className="flex flex-wrap gap-2">
            {shiftTypesToDisplay.map(shiftType => {
              const count = schedules.find(s => s.employeeId === selectedEmployeeId)?.schedule.filter(d => d.shift === shiftType).length || 0;
              if (count === 0) return null;
              return <Badge key={shiftType} variant="outline" className={cn("text-sm", shiftVariantMap[shiftType])}>{shiftType}: {count}</Badge>
            })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
