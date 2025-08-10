"use client"

import * as React from "react"
import { getDaysInMonth, format, addMonths, subMonths, startOfMonth, getWeeksInMonth, startOfWeek, addDays, eachDayOfInterval, endOfWeek, getWeek, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, User, Calendar as CalendarIcon, Settings } from "lucide-react"

import type { Employee, EmployeeSchedule, ShiftType } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
  const [schedules, setSchedules] = React.useState<EmployeeSchedule[]>(initialScheduleData)
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("all")
  const [activeEmployeeIds, setActiveEmployeeIds] = React.useState<Set<string>>(new Set(allEmployees.map(e => e.id)));
  const [isScheduleGenerated, setIsScheduleGenerated] = React.useState(false);

  const activeEmployees = React.useMemo(() => allEmployees.filter(e => activeEmployeeIds.has(e.id)), [allEmployees, activeEmployeeIds]);
  
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

  const hasConflict = (employeeSchedule: { day: number; shift: ShiftType }[], dayIndex: number): boolean => {
    if (dayIndex === 0) return false
    const currentShift = employeeSchedule[dayIndex]?.shift
    const prevShift = employeeSchedule[dayIndex - 1]?.shift
    if (!currentShift || !prevShift) return false;
    return false;
  }
  
 const generateSchedule = React.useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);

    if (activeEmployees.length === 0) {
      setSchedules([]);
      return;
    }

    const newSchedules: EmployeeSchedule[] = activeEmployees.map(emp => ({
        employeeId: emp.id,
        schedule: Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            shift: 'Descanso',
        })),
    }));
    
    // Group logic remains for insumos shift
    const groupA_ids = allEmployees.slice(0, 4).map(e => e.id);
    const groupB_ids = allEmployees.slice(4, 8).map(e => e.id);

    const monthStartDate = startOfMonth(currentDate);
    const monthEndDate = endOfMonth(currentDate);
    
    let currentWeekStart = startOfWeek(monthStartDate, { weekStartsOn: 1 });

    const monthlyNightAssignments: Record<string, boolean> = {};
    const monthlyInsumosAssignments: Record<string, boolean> = {};
    let lastWeekAssignments: Record<string, ShiftType> = {};

    while(currentWeekStart <= monthEndDate) {
        const weekOfYear = getWeek(currentWeekStart, { weekStartsOn: 1 });
        let employeesToAssign = [...activeEmployees];
        const weeklyAssignments: { [key: string]: ShiftType } = {};

        const assignShift = (shift: ShiftType, count: number, customPool?: Employee[]) => {
            if (employeesToAssign.length === 0) return;
            let pool = customPool ? [...customPool] : [...employeesToAssign];

            pool = pool.filter(emp => {
                if(shift === 'Noche' && monthlyNightAssignments[emp.id]) return false;
                if(shift === 'Insumos' && monthlyInsumosAssignments[emp.id]) return false;
                if((shift === 'Mañana' || shift === 'Tarde') && lastWeekAssignments[emp.id] === shift) return false;
                return true;
            });
            
            for (let j = 0; j < count; j++) {
                 if (pool.length === 0) break;
                 // Deterministic but rotating selection
                 const employeeIndex = (weekOfYear + j) % pool.length;
                 const employee = pool[employeeIndex];

                 weeklyAssignments[employee.id] = shift;
                 if(shift === 'Noche') monthlyNightAssignments[employee.id] = true;
                 if(shift === 'Insumos') monthlyInsumosAssignments[employee.id] = true;
                 
                 // Remove from pool and employeesToAssign
                 pool.splice(employeeIndex, 1);
                 employeesToAssign = employeesToAssign.filter(e => e.id !== employee.id);
            }
        };

        const includeInsumos = activeEmployees.length >= 8;
        if (includeInsumos) {
          const insumosEligibleGroupIds = (month + 1) % 2 === 1 ? groupA_ids : groupB_ids;
          const insumosPool = employeesToAssign.filter(e => insumosEligibleGroupIds.includes(e.id));
          assignShift('Insumos', 1, insumosPool.length > 0 ? insumosPool : undefined);
        }

        assignShift('Noche', 2);
        assignShift('Administrativo', 1);
        assignShift('Mañana', 2);
        
        // Assign rest to Tarde
        employeesToAssign.forEach(emp => {
           weeklyAssignments[emp.id] = 'Tarde';
        });

        lastWeekAssignments = {...weeklyAssignments};

        const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) });
        
        for (const dayDate of weekDays) {
            if (dayDate.getMonth() !== month) continue;

            const dayOfWeek = dayDate.getDay(); // Sunday is 0, Monday is 1...
            const dayOfMonth = dayDate.getDate();

            activeEmployees.forEach(emp => {
                const weeklyShift = weeklyAssignments[emp.id];
                if (!weeklyShift) return;

                let dailyShift: ShiftType = weeklyShift;
                
                // Strict rest day rules
                const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
                if ( (['Mañana', 'Tarde', 'Insumos'].includes(weeklyShift) && dayOfWeek === 0) || (['Noche', 'Administrativo'].includes(weeklyShift) && isWeekend) ) {
                   dailyShift = 'Descanso';
                }
                
                const empSchedule = newSchedules.find(s => s.employeeId === emp.id);
                if (empSchedule) {
                    const dayIndex = empSchedule.schedule.findIndex(s => s.day === dayOfMonth);
                    if (dayIndex !== -1) {
                        empSchedule.schedule[dayIndex].shift = dailyShift;
                    }
                }
            });
        }
        currentWeekStart = addDays(currentWeekStart, 7);
    }
    setSchedules(newSchedules);
    setIsScheduleGenerated(true);
  }, [currentDate, activeEmployees, allEmployees]);


  React.useEffect(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const resetSchedules = activeEmployees.map(emp => ({
      employeeId: emp.id,
      schedule: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        shift: 'Descanso' as ShiftType,
      })),
    }));
    setSchedules(resetSchedules);
    setIsScheduleGenerated(false); // Reset when month or active employees change
  }, [currentDate, activeEmployees]);


  const filteredEmployees = selectedEmployeeId === "all"
    ? activeEmployees
    : activeEmployees.filter(e => e.id === selectedEmployeeId)

  const shiftTypesToDisplay = activeEmployees.length >= 8 ? ALL_SHIFT_TYPES : ALL_SHIFT_TYPES.filter(s => s !== 'Insumos');

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-headline">Horario de Trabajo</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
             <Button onClick={generateSchedule} variant="outline" disabled={isScheduleGenerated}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Generar Horario
            </Button>
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
                                   newSet.delete(employee.id);
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 p-2 text-sm font-bold text-left bg-card w-36">Empleado</TableHead>
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
                      const conflict = hasConflict(empSchedule.schedule, dayIndex)
                      return (
                        <TableCell key={day} className={cn("p-1.5 text-center border-l", conflict && "ring-2 ring-destructive ring-inset")}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn("w-full h-full p-1 text-xs font-semibold border", shiftVariantMap[shift])}
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
        </div>
         {selectedEmployeeId !== 'all' && (
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
