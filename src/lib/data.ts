import { getDaysInMonth, startOfMonth, endOfWeek, addDays, getWeek, subMonths, eachDayOfInterval, format, differenceInDays, startOfWeek } from 'date-fns';
import type { Employee, EmployeeSchedule, ShiftType } from '@/types';

const employees: Employee[] = [
  { id: '1', name: '1. Gonzalo Mellao' },
  { id: '2', name: '2. Luis Villagra' },
  { id: '3', name: '3. Osvaldo Amaro' },
  { id: '4', name: '4. Sebastian Amaro' },
  { id: '5', name: '5. Darien Marambio' },
  { id: '6', name: '6. Abraham Romero' },
  { id: '7', name: '7. Ariel Donoso' },
  { id: '8', name: '8. Bastian Lopez' },
];

// Grupos de empleados fijos para la rotación mensual
const EMPLOYEE_GROUPS = {
  groupA: ["1", "2", "3", "4"],
  groupB: ["5", "6", "7", "8"],
};

// Parejas fijas para la rotación semanal
const EMPLOYEE_PAIRS: [string, string][] = [
  ["1", "2"],
  ["3", "4"],
  ["5", "6"],
  ["7", "8"],
];


export function getEmployees(): Employee[] {
  return employees;
}

export function generateInitialSchedule(
  employeeList: Employee[],
  year: number,
  month: number
): EmployeeSchedule[] {
  const currentDate = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(currentDate);

  // Initialize schedules with 'Descanso' for all employees
  const newSchedules: EmployeeSchedule[] = employeeList.map(emp => ({
    employeeId: emp.id,
    schedule: Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      shift: "Descanso",
    })),
  }));

  // --- 1. MONTHLY FIXED ASSIGNMENTS (Admin & Insumos) ---
  const isEvenMonth = (month + 1) % 2 === 0;
  const adminEmployeeIds = isEvenMonth ? EMPLOYEE_GROUPS.groupA : EMPLOYEE_GROUPS.groupB;
  const insumosEmployeeIds = isEvenMonth ? EMPLOYEE_GROUPS.groupB : EMPLOYEE_GROUPS.groupA;

  // Assign Admin and Insumos shifts for the entire month
  employeeList.forEach(emp => {
    let assignedShift: ShiftType | null = null;
    if (adminEmployeeIds.includes(emp.id)) {
      assignedShift = "Administrativo";
    } else if (insumosEmployeeIds.includes(emp.id)) {
      assignedShift = "Insumos";
    }

    if (assignedShift) {
      const empSchedule = newSchedules.find(s => s.employeeId === emp.id);
      if (empSchedule) {
        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(year, month, day);
          const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
          let dailyShift: ShiftType = assignedShift;

          // Apply weekend rest days
          if (assignedShift === "Administrativo" && (dayOfWeek === 6 || dayOfWeek === 0)) {
            dailyShift = "Descanso";
          }
          if (assignedShift === "Insumos" && dayOfWeek === 0) {
            dailyShift = "Descanso";
          }

          const dayIndex = empSchedule.schedule.findIndex(s => s.day === day);
          if (dayIndex !== -1) {
            empSchedule.schedule[dayIndex].shift = dailyShift;
          }
        }
      }
    }
  });


  // --- 2. WEEKLY ROTATING ASSIGNMENTS (Mañana & Noche) ---
  const employeesForRotation = employeeList.filter(
    emp => !adminEmployeeIds.includes(emp.id) && !insumosEmployeeIds.includes(emp.id)
  );
  
  const pairsForRotation = EMPLOYEE_PAIRS.filter(p =>
      employeesForRotation.some(e => e.id === p[0]) && employeesForRotation.some(e => e.id === p[1])
  );

  const monthStartDate = startOfMonth(currentDate);
  const weeks = eachDayOfInterval({ start: monthStartDate, end: endOfWeek(addDays(monthStartDate, daysInMonth -1)) });
  
  for (let i = 0; i < weeks.length; i += 7) {
      const weekStart = weeks[i];
      if (weekStart.getMonth() !== month) continue;

      const weekOfMonth = Math.floor((weekStart.getDate() - 1) / 7);

      if (pairsForRotation.length < 2) continue; // Need at least two pairs

      // Simple rotation: one pair gets "Noche", the other gets "Mañana"
      const nightPair = pairsForRotation[weekOfMonth % 2];
      const morningPair = pairsForRotation[(weekOfMonth + 1) % 2];
      
      const weeklyAssignments: Record<string, ShiftType> = {};
      if(nightPair) {
        weeklyAssignments[nightPair[0]] = "Noche";
        weeklyAssignments[nightPair[1]] = "Noche";
      }
      if(morningPair) {
        weeklyAssignments[morningPair[0]] = "Mañana";
        weeklyAssignments[morningPair[1]] = "Mañana";
      }
      
      // Apply the weekly shifts to the days of the week
      const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) });
      for (const dayDate of weekDays) {
          if (dayDate.getMonth() !== month) continue;
          
          const dayOfMonth = dayDate.getDate();
          const dayOfWeek = dayDate.getDay();

          employeesForRotation.forEach(emp => {
              const weeklyShift = weeklyAssignments[emp.id];
              if (!weeklyShift) return;

              let dailyShift: ShiftType = weeklyShift;
              // Apply weekend rest days
              if (weeklyShift === "Mañana" && dayOfWeek === 0) {
                  dailyShift = "Descanso";
              }
              if (weeklyShift === "Noche" && (dayOfWeek === 6 || dayOfWeek === 0)) {
                  dailyShift = "Descanso";
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
  }

  return newSchedules;
}