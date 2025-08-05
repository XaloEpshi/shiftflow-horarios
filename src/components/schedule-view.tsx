"use client"

import * as React from "react"
import { getDaysInMonth, format, addMonths, subMonths, startOfMonth, getWeek } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, User, Calendar as CalendarIcon } from "lucide-react"

import type { Employee, EmployeeSchedule, ShiftType } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ScheduleViewProps {
  employees: Employee[]
  initialScheduleData: EmployeeSchedule[]
}

const SHIFT_TYPES: ShiftType[] = ["Mañana", "Tarde", "Noche", "Administrativo", "Insumos", "Descanso"]

const shiftVariantMap: Record<ShiftType, string> = {
  "Mañana": "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "Tarde": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "Noche": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
  "Administrativo": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  "Insumos": "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  "Descanso": "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
}

export function ScheduleView({ employees, initialScheduleData }: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = React.useState(startOfMonth(new Date()))
  const [schedules, setSchedules] = React.useState<EmployeeSchedule[]>(initialScheduleData)
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("all")
  
  const insumosGroups = React.useMemo(() => {
    const groupA_ids = employees.slice(0, 4).map(e => e.id);
    const groupB_ids = employees.slice(4, 8).map(e => e.id);
    return { groupA: groupA_ids, groupB: groupB_ids };
  }, [employees]);


  const daysInMonth = getDaysInMonth(currentDate)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

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
    if (!currentShift || !prevShift) return false

    if ((currentShift === "Noche" && prevShift === "Noche") || (currentShift === "Insumos" && prevShift === "Insumos")) {
      return true
    }
    return false
  }

  const generateSchedule = React.useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const newSchedules: EmployeeSchedule[] = employees.map(emp => ({
        employeeId: emp.id,
        schedule: Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            shift: 'Descanso',
        })),
    }));

    const monthlyAssignments: { [key: string]: ShiftType[] } = employees.reduce((acc, emp) => ({ ...acc, [emp.id]: [] }), {});
    let lastWeekAssignments: { [key: string]: ShiftType } = {};
    let processedWeeks = new Set<number>();
    
    // Determine which group is eligible for 'Insumos' this month
    const insumosEligibleGroup = month % 2 === 0 ? insumosGroups.groupA : insumosGroups.groupB;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const weekNumber = getWeek(date, { weekStartsOn: 1 });

        if (!processedWeeks.has(weekNumber)) {
            processedWeeks.add(weekNumber);
            const weeklyAssignments: { [key: string]: ShiftType } = {};
            
            let availableEmployees = [...employees];
            
            // Fisher-Yates shuffle for randomness
            for (let i = availableEmployees.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableEmployees[i], availableEmployees[j]] = [availableEmployees[j], availableEmployees[i]];
            }
            
            const assignShift = (shift: ShiftType, count: number, customPool?: Employee[]) => {
                let assignedCount = 0;
                const pool = customPool || availableEmployees;
                const employeesToProcess = pool.filter(e => weeklyAssignments[e.id] === undefined);

                for (const employee of employeesToProcess) {
                    if(assignedCount >= count) break;

                    let canAssign = true;
                    // Rule: Don't repeat Noche or Insumos in the same month
                    if (shift === 'Noche' || shift === 'Insumos') {
                        if (monthlyAssignments[employee.id].includes(shift)) {
                            canAssign = false;
                        }
                    }
                    // Rule: Don't repeat Mañana or Tarde on consecutive weeks
                    if (shift === 'Mañana' || shift === 'Tarde') {
                        if (lastWeekAssignments[employee.id] === shift) {
                            canAssign = false;
                        }
                    }

                    if (canAssign) {
                        weeklyAssignments[employee.id] = shift;
                        monthlyAssignments[employee.id].push(shift);
                        assignedCount++;
                    }
                }
            };
            
            // Assign Insumos from the eligible group
            const insumosPool = availableEmployees.filter(e => insumosEligibleGroup.includes(e.id));
            assignShift('Insumos', 1, insumosPool);
            
            // Assign other shifts from the remaining pool
            assignShift('Noche', 2);
            assignShift('Administrativo', 1);
            assignShift('Mañana', 2);
            assignShift('Tarde', 2);

            lastWeekAssignments = { ...weeklyAssignments };

            const firstDayOfWeek = day;
            for (let d = firstDayOfWeek; d < firstDayOfWeek + 7 && d <= daysInMonth; d++) {
                const currentDay = new Date(year, month, d);
                 if (getWeek(currentDay, { weekStartsOn: 1 }) !== weekNumber) continue;

                const dayOfWeek = currentDay.getDay(); 

                employees.forEach(emp => {
                    const weeklyShift = weeklyAssignments[emp.id] || 'Descanso';
                    let dailyShift: ShiftType = 'Descanso';

                    switch (weeklyShift) {
                        case 'Mañana':
                        case 'Tarde':
                        case 'Insumos':
                            if (dayOfWeek !== 0) { // Mon-Sat
                                dailyShift = weeklyShift;
                            }
                            break;
                        case 'Noche':
                        case 'Administrativo':
                            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
                                dailyShift = weeklyShift;
                            }
                            break;
                    }
                    
                    const schedule = newSchedules.find(s => s.employeeId === emp.id)!.schedule;
                    const dayIndex = schedule.findIndex(s => s.day === d);
                    if(dayIndex !== -1 && schedule[dayIndex].shift === 'Descanso') {
                      schedule[dayIndex].shift = dailyShift;
                    }
                });
            }
        }
    }
     setSchedules(newSchedules);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, employees, daysInMonth, insumosGroups]);


  React.useEffect(() => {
    generateSchedule();
  }, [generateSchedule]);


  const filteredEmployees = selectedEmployeeId === "all"
    ? employees
    : employees.filter(e => e.id === selectedEmployeeId)

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
             <Button onClick={generateSchedule} variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Generar Horario
            </Button>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><Users className="inline-block w-4 h-4 mr-2"/>Todos los empleados</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}><User className="inline-block w-4 h-4 mr-2"/>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 p-2 text-sm font-bold text-left bg-card w-36">Empleado</TableHead>
                {daysArray.map(day => (
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
                    {daysArray.map((day, dayIndex) => {
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
                              {SHIFT_TYPES.map(shiftType => (
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
            {SHIFT_TYPES.map(shiftType => {
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
