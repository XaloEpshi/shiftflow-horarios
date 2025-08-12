import { getDaysInMonth, startOfMonth, endOfWeek, addDays, eachDayOfInterval, format, getWeek } from 'date-fns';
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

const EMPLOYEE_PAIRS: [string, string][] = [
  ["1", "2"], // Pair 0
  ["3", "4"], // Pair 1
  ["5", "6"], // Pair 2
  ["7", "8"], // Pair 3
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

  const newSchedules: EmployeeSchedule[] = employeeList.map(emp => ({
    employeeId: emp.id,
    schedule: Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      shift: "Descanso",
    })),
  }));

  const monthStartDate = startOfMonth(currentDate);
  const weeksInMonth = eachDayOfInterval({
    start: monthStartDate,
    end: addDays(monthStartDate, daysInMonth - 1),
  });

  // Group days by week
  const weeklySchedule: Record<number, { day: number; dayOfWeek: number }[]> = {};
  weeksInMonth.forEach(dayDate => {
    const weekOfYear = getWeek(dayDate, { weekStartsOn: 1 });
    if (!weeklySchedule[weekOfYear]) {
      weeklySchedule[weekOfYear] = [];
    }
    weeklySchedule[weekOfYear].push({
      day: dayDate.getDate(),
      dayOfWeek: dayDate.getDay(),
    });
  });

  Object.keys(weeklySchedule).forEach(weekOfYearStr => {
    const weekOfYear = parseInt(weekOfYearStr, 10);
    const weekDays = weeklySchedule[weekOfYear];

    // Determine the rotation index based on the week number
    // This creates a 4-week rotation cycle for the pairs
    const rotationIndex = (weekOfYear - 1) % 4;

    const nightPair = EMPLOYEE_PAIRS[rotationIndex % 4];
    const morningPair = EMPLOYEE_PAIRS[(rotationIndex + 1) % 4];
    const afternoonPair = EMPLOYEE_PAIRS[(rotationIndex + 2) % 4];
    const supportPair = EMPLOYEE_PAIRS[(rotationIndex + 3) % 4];

    const weeklyAssignments: Record<string, ShiftType> = {};
    
    // Assign pairs to their weekly roles
    nightPair.forEach(id => weeklyAssignments[id] = "Noche");
    morningPair.forEach(id => weeklyAssignments[id] = "Mañana");
    afternoonPair.forEach(id => weeklyAssignments[id] = "Tarde");
    weeklyAssignments[supportPair[0]] = "Administrativo";
    weeklyAssignments[supportPair[1]] = "Insumos";


    // Apply the assigned shifts to each day of the week
    weekDays.forEach(({ day, dayOfWeek }) => {
      employeeList.forEach(emp => {
        const weeklyShift = weeklyAssignments[emp.id];
        if (!weeklyShift) return;

        let dailyShift: ShiftType = weeklyShift;

        // Apply weekend rest days based on the shift
        if ((weeklyShift === "Noche" || weeklyShift === "Administrativo") && (dayOfWeek === 6 || dayOfWeek === 0)) {
          dailyShift = "Descanso";
        } else if ((weeklyShift === "Mañana" || weeklyShift === "Tarde" || weeklyShift === "Insumos") && dayOfWeek === 0) {
          dailyShift = "Descanso";
        }

        const empSchedule = newSchedules.find(s => s.employeeId === emp.id);
        if (empSchedule) {
          const dayIndex = empSchedule.schedule.findIndex(s => s.day === day);
          if (dayIndex !== -1) {
            empSchedule.schedule[dayIndex].shift = dailyShift;
          }
        }
      });
    });
  });

  return newSchedules;
}
