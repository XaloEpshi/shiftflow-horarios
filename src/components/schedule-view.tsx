
"use client"

import * as React from "react"
import { getDaysInMonth, format, addMonths, subMonths, startOfMonth, getWeeksInMonth, startOfWeek, addDays, eachDayOfInterval, endOfWeek, getWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, User, Calendar as CalendarIcon, Settings, FileDown } from "lucide-react"

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
  
  const [isGenerated, setIsGenerated] = React.useState(false);
  const [regenerationCount, setRegenerationCount] = React.useState(0);

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
  
  const getStorageKey = (date: Date) => `schedule-${date.getFullYear()}-${date.getMonth()}`;

  const generateSchedule = React.useCallback((force = false) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);

    if (activeEmployees.length < 8) {
      const resetSchedules = activeEmployees.map(emp => ({
        employeeId: emp.id,
        schedule: Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          shift: 'Descanso' as ShiftType,
        })),
      }));
      setSchedules(resetSchedules);
      setIsGenerated(false);
      return;
    }

    const newSchedules: EmployeeSchedule[] = activeEmployees.map(emp => ({
      employeeId: emp.id,
      schedule: Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, shift: 'Descanso' })),
    }));
    
    // Define fixed groups and pairs
    const groupA_ids = allEmployees.slice(0, 4).map(e => e.id);
    const groupB_ids = allEmployees.slice(4, 8).map(e => e.id);
    const nightPairs = [
      [allEmployees[0].id, allEmployees[1].id],
      [allEmployees[2].id, allEmployees[3].id],
      [allEmployees[4].id, allEmployees[5].id],
      [allEmployees[6].id, allEmployees[7].id],
    ];

    const monthStartDate = startOfMonth(currentDate);
    // Get the first 4 weeks of the month for planning
    const weeksInMonth = eachDayOfInterval({
        start: startOfWeek(monthStartDate, { weekStartsOn: 1 }),
        end: addDays(startOfWeek(monthStartDate, { weekStartsOn: 1 }), 27) // Exactly 4 weeks
    }).reduce((acc, cur) => {
        const weekNum = getWeek(cur, { weekStartsOn: 1 });
        if (!acc.find(w => isSameDay(w.start, startOfWeek(cur, { weekStartsOn: 1 })))) {
            acc.push({ weekNum, start: startOfWeek(cur, { weekStartsOn: 1 }), end: endOfWeek(cur, { weekStartsOn: 1 }) });
        }
        return acc;
    }, [] as { weekNum: number; start: Date; end: Date }[]).slice(0, 4);

    const weeklyAssignments: { [weekIndex: number]: { [shift: string]: string[] } } = {};
    const monthlyAssignments: { [employeeId: string]: boolean } = {};

    // 1. Assign Night Shifts (1 pair per week)
    const shuffledNightPairs = [...nightPairs].sort(() => Math.random() - 0.5);
    weeksInMonth.forEach((week, weekIndex) => {
      weeklyAssignments[weekIndex] = {};
      const pair = shuffledNightPairs[weekIndex];
      weeklyAssignments[weekIndex]['Noche'] = pair;
      pair.forEach(id => monthlyAssignments[id] = true);
    });

    // 2. Assign Insumos Shifts (1 employee from the designated group per week)
    const insumosGroup = (month + 1) % 2 !== 0 ? groupA_ids : groupB_ids;
    const shuffledInsumosGroup = [...insumosGroup].sort(() => Math.random() - 0.5);

    weeksInMonth.forEach((week, weekIndex) => {
      let assigned = false;
      for (const empId of shuffledInsumosGroup) {
        if (!weeklyAssignments[weekIndex]['Noche'].includes(empId) && !monthlyAssignments[empId]) {
          weeklyAssignments[weekIndex]['Insumos'] = [empId];
          monthlyAssignments[empId] = true;
          assigned = true;
          break;
        }
      }
      // Fallback if the whole group is on night shift that week (unlikely but possible)
      if (!assigned) {
          const availableForInsumos = activeEmployees.filter(e => !monthlyAssignments[e.id]);
          if (availableForInsumos.length > 0) {
            const fallbackEmpId = availableForInsumos[0].id;
            weeklyAssignments[weekIndex]['Insumos'] = [fallbackEmpId];
            monthlyAssignments[fallbackEmpId] = true;
          }
      }
    });

    // 3. Assign remaining shifts weekly
    weeksInMonth.forEach((week, weekIndex) => {
      const assignedThisWeek = [
        ...(weeklyAssignments[weekIndex]['Noche'] || []),
        ...(weeklyAssignments[weekIndex]['Insumos'] || [])
      ];
      let availableForWeek = activeEmployees.filter(emp => !assignedThisWeek.includes(emp.id)).map(e => e.id);
      availableForWeek.sort(() => Math.random() - 0.5); // Shuffle remaining employees
      
      // Assign Administrativo
      if(availableForWeek.length > 0) {
        weeklyAssignments[weekIndex]['Administrativo'] = [availableForWeek.pop()!];
      }
      
      // Assign Mañana
      if(availableForWeek.length > 1) {
        weeklyAssignments[weekIndex]['Mañana'] = [availableForWeek.pop()!, availableForWeek.pop()!];
      }

      // Assign Tarde
      if(availableForWeek.length > 1) {
        weeklyAssignments[weekIndex]['Tarde'] = [availableForWeek.pop()!, availableForWeek.pop()!];
      }
    });

    // 4. Populate the daily schedule from weekly assignments
    weeksInMonth.forEach((week, weekIndex) => {
      const weekPlan = weeklyAssignments[weekIndex];
      if (!weekPlan) return;

      Object.entries(weekPlan).forEach(([shift, employeeIds]) => {
        const shiftType = shift as ShiftType;
        employeeIds.forEach(empId => {
          eachDayOfInterval({ start: week.start, end: week.end }).forEach(dayDate => {
            if (dayDate.getMonth() !== month) return;

            const dayOfMonth = dayDate.getDate();
            const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

            let dailyShift: ShiftType = shiftType;

            const empSchedule = newSchedules.find(s => s.employeeId === empId);
            if (empSchedule) {
              const dayIndex = empSchedule.schedule.findIndex(s => s.day === dayOfMonth);
              if (dayIndex !== -1) {
                empSchedule.schedule[dayIndex].shift = dailyShift;
              }
            }
          });
        });
      });
    });

    // 5. Apply strict rest day rules OVER the generated schedule
    newSchedules.forEach(empSchedule => {
        const empId = empSchedule.employeeId;
        empSchedule.schedule.forEach((dayEntry, dayIndex) => {
            const dayOfMonth = dayEntry.day;
            const currentDayDate = new Date(year, month, dayOfMonth);
            const dayOfWeek = currentDayDate.getDay();
            const weekStart = startOfWeek(currentDayDate, { weekStartsOn: 1 });

            // Find what was this employee's assigned shift for the week
            let weeklyShift: ShiftType = 'Descanso';
            for(const week of weeksInMonth) {
              if (currentDayDate >= week.start && currentDayDate <= week.end) {
                const weekIdx = weeksInMonth.indexOf(week);
                const weekPlan = weeklyAssignments[weekIdx];
                for(const shift in weekPlan) {
                  if (weekPlan[shift as ShiftType].includes(empId)) {
                    weeklyShift = shift as ShiftType;
                    break;
                  }
                }
                break;
              }
            }
            
            if ((weeklyShift === 'Mañana' || weeklyShift === 'Tarde' || weeklyShift === 'Insumos') && dayOfWeek === 0) { // Sunday
                dayEntry.shift = 'Descanso';
            }
            if ((weeklyShift === 'Noche' || weeklyShift === 'Administrativo') && (dayOfWeek === 6 || dayOfWeek === 0)) { // Saturday or Sunday
                dayEntry.shift = 'Descanso';
            }
        });
    });


    setSchedules(newSchedules);
    localStorage.setItem(getStorageKey(currentDate), JSON.stringify(newSchedules));
    setIsGenerated(true);
    if(force) {
      setRegenerationCount(prev => prev + 1);
    }
  }, [currentDate, activeEmployees, allEmployees]);
  
  React.useEffect(() => {
    const storageKey = getStorageKey(currentDate);
    const savedSchedules = localStorage.getItem(storageKey);
    if (savedSchedules) {
      try {
        const parsed = JSON.parse(savedSchedules);
        // Basic validation
        if (Array.isArray(parsed) && parsed.every(p => p.employeeId && Array.isArray(p.schedule))) {
          setSchedules(parsed);
          setIsGenerated(true);
        } else {
          throw new Error("Invalid schedule format");
        }
      } catch (e) {
        console.error("Failed to parse saved schedules, resetting.", e);
        localStorage.removeItem(storageKey);
        setIsGenerated(false);
      }
    } else {
      const daysInMonth = getDaysInMonth(currentDate);
      const resetSchedules = activeEmployees.map(emp => ({
        employeeId: emp.id,
        schedule: Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          shift: 'Descanso' as ShiftType,
        })),
      }));
      setSchedules(resetSchedules);
      setIsGenerated(false);
    }
    setRegenerationCount(0);
  }, [currentDate, activeEmployeeIds]);

  const filteredEmployees = selectedEmployeeId === "all"
    ? activeEmployees
    : activeEmployees.filter(e => e.id === selectedEmployeeId)

  const shiftTypesToDisplay = activeEmployees.length >= 8 ? ALL_SHIFT_TYPES : ALL_SHIFT_TYPES.filter(s => s !== 'Insumos');

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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={activeEmployees.length < 8}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Generar Horario
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
                  <AlertDialogDescription>
                    {activeEmployees.length < 8 ? "Se necesitan al menos 8 empleados activos para generar el horario." : 
                      isGenerated
                      ? `Ya has generado el horario para este mes. ${regenerationCount < 5 ? `Puedes volver a generarlo, pero ten en cuenta que solo puedes hacerlo ${5 - regenerationCount} veces más.` : 'Has alcanzado el límite de regeneraciones para este mes.'}`
                      : 'Estás a punto de generar el horario para el mes actual.'
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => generateSchedule(isGenerated)}
                    disabled={(isGenerated && regenerationCount >= 5) || activeEmployees.length < 8}
                  >
                    {isGenerated ? 'Volver a generar' : 'Generar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={exportToCsv} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a CSV
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
                                 // When changing active employees, clear existing schedule for the month
                                 localStorage.removeItem(getStorageKey(currentDate));
                                 setIsGenerated(false);
                                 setRegenerationCount(0);
                                 // Also reset employees state
                                 const daysInMonth = getDaysInMonth(currentDate);
                                 const newActiveEmployees = allEmployees.filter(e => newSet.has(e.id));
                                 const resetSchedules = newActiveEmployees.map(emp => ({
                                  employeeId: emp.id,
                                  schedule: Array.from({ length: daysInMonth }, (_, i) => ({
                                    day: i + 1,
                                    shift: 'Descanso' as ShiftType,
                                  })),
                                 }));
                                 setSchedules(resetSchedules);

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
                      return (
                        <TableCell key={day} className={cn("p-1.5 text-center border-l")}>
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
