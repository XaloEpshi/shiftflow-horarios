import { getDaysInMonth, startOfMonth, eachDayOfInterval, getWeek } from 'date-fns';
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
  ["1", "2"],
  ["3", "4"],
  ["5", "6"],
  ["7", "8"],
];

export function getEmployees(): Employee[] {
  return employees;
}

const applyWeeklySchedule = (
  schedules: EmployeeSchedule[],
  year: number,
  month: number,
  weekAssignments: { [employeeId: string]: ShiftType }
) => {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  
  Object.keys(weekAssignments).forEach(employeeId => {
    const weeklyShift = weekAssignments[employeeId];
    const empSchedule = schedules.find(s => s.employeeId === employeeId);

    if (empSchedule) {
      empSchedule.schedule.forEach(daySchedule => {
        const dayDate = new Date(year, month, daySchedule.day);
        const dayOfWeek = dayDate.getDay(); 
        
        let dailyShift: ShiftType = weeklyShift;
        if (weeklyShift === "Noche" && (dayOfWeek === 6 || dayOfWeek === 0)) {
          dailyShift = "Descanso";
        } else if ((weeklyShift === "Mañana" || weeklyShift === "Tarde" || weeklyShift === "Insumos") && dayOfWeek === 0) {
          dailyShift = "Descanso";
        } else if (weeklyShift === "Administrativo" && (dayOfWeek === 6 || dayOfWeek === 0)) {
           dailyShift = "Descanso";
        }
        
        const currentWeekNumber = getWeek(dayDate, { weekStartsOn: 1 });
        const startOfWeekForDay = getWeek(new Date(year, month, 1), { weekStartsOn: 1 });
        if(currentWeekNumber === getWeek(new Date(year, month, daySchedule.day), {weekStartsOn:1})) {
            const dayIndex = empSchedule.schedule.findIndex(s => s.day === daySchedule.day);
            if (dayIndex !== -1) {
              empSchedule.schedule[dayIndex].shift = dailyShift;
            }
        }
      });
    }
  });
};

const generateFor8Employees = (
  employeeList: Employee[],
  year: number,
  month: number
): EmployeeSchedule[] => {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const newSchedules: EmployeeSchedule[] = employeeList.map(emp => ({
    employeeId: emp.id,
    schedule: Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      shift: "Descanso",
    })),
  }));

  const monthStartDate = startOfMonth(new Date(year, month));
  
  const weeksOfMonth = eachDayOfInterval({
    start: monthStartDate,
    end: new Date(year, month, daysInMonth),
  });

  const weeklyScheduleMap: { [week: number]: { day: number, dayOfWeek: number }[] } = {};
  weeksOfMonth.forEach(day => {
    const weekOfYear = getWeek(day, { weekStartsOn: 1 });
    if (!weeklyScheduleMap[weekOfYear]) {
      weeklyScheduleMap[weekOfYear] = [];
    }
    weeklyScheduleMap[weekOfYear].push({ day: day.getDate(), dayOfWeek: day.getDay() });
  });
  
  Object.keys(weeklyScheduleMap).forEach(weekOfYearStr => {
    const weekOfYear = parseInt(weekOfYearStr, 10);
    const weekOfMonth = weekOfYear - getWeek(monthStartDate, { weekStartsOn: 1 });

    const rotationIndex = weekOfMonth % 4;

    const nightPair = EMPLOYEE_PAIRS[rotationIndex % 4];
    const morningPair = EMPLOYEE_PAIRS[(rotationIndex + 1) % 4];
    const afternoonPair = EMPLOYEE_PAIRS[(rotationIndex + 2) % 4];
    const supportPair = EMPLOYEE_PAIRS[(rotationIndex + 3) % 4];

    const weeklyAssignments: { [employeeId: string]: ShiftType } = {};

    nightPair.forEach(id => (weeklyAssignments[id] = "Noche"));
    morningPair.forEach(id => (weeklyAssignments[id] = "Mañana"));
    afternoonPair.forEach(id => (weeklyAssignments[id] = "Tarde"));
    weeklyAssignments[supportPair[0]] = "Administrativo";
    weeklyAssignments[supportPair[1]] = "Insumos";

    const weekDays = weeklyScheduleMap[weekOfYear];
    weekDays.forEach(({ day, dayOfWeek }) => {
      employeeList.forEach(emp => {
        const weeklyShift = weeklyAssignments[emp.id];
        if (!weeklyShift) return;

        let dailyShift: ShiftType = weeklyShift;
        if (weeklyShift === "Noche" && (dayOfWeek === 6 || dayOfWeek === 0)) {
          dailyShift = "Descanso";
        } else if ((weeklyShift === "Mañana" || weeklyShift === "Tarde" || weeklyShift === "Insumos") && dayOfWeek === 0) {
          dailyShift = "Descanso";
        } else if (weeklyShift === "Administrativo" && (dayOfWeek === 6 || dayOfWeek === 0)) {
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
};

const generateFor7Employees = (
  employeeList: Employee[],
  year: number,
  month: number
): EmployeeSchedule[] => {
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const newSchedules: EmployeeSchedule[] = employeeList.map(emp => ({
        employeeId: emp.id,
        schedule: Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            shift: "Descanso",
        })),
    }));

    const monthStartDate = startOfMonth(new Date(year, month));

    const weeksOfMonth = eachDayOfInterval({
        start: monthStartDate,
        end: new Date(year, month, daysInMonth),
    });

    const weeklyScheduleMap: { [week: number]: { day: number, dayOfWeek: number }[] } = {};
    weeksOfMonth.forEach(day => {
        const weekOfYear = getWeek(day, { weekStartsOn: 1 });
        if (!weeklyScheduleMap[weekOfYear]) {
            weeklyScheduleMap[weekOfYear] = [];
        }
        weeklyScheduleMap[weekOfYear].push({ day: day.getDate(), dayOfWeek: day.getDay() });
    });

    const sortedEmployees = [...employeeList].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    Object.keys(weeklyScheduleMap).forEach(weekOfYearStr => {
        const weekOfYear = parseInt(weekOfYearStr, 10);
        const weekOfMonth = weekOfYear - getWeek(monthStartDate, { weekStartsOn: 1 });
        
        const weeklyAssignments: { [employeeId: string]: ShiftType } = {};
        
        const adminIndex = weekOfMonth % 7;
        const adminEmployee = sortedEmployees[adminIndex];
        weeklyAssignments[adminEmployee.id] = "Administrativo";

        const remainingEmployees = sortedEmployees.filter(emp => emp.id !== adminEmployee.id);
        const rotationPairs = [
            [remainingEmployees[0].id, remainingEmployees[1].id],
            [remainingEmployees[2].id, remainingEmployees[3].id],
            [remainingEmployees[4].id, remainingEmployees[5].id],
        ];

        const shiftRotationIndex = weekOfMonth % 3;
        const nightPair = rotationPairs[shiftRotationIndex % 3];
        const morningPair = rotationPairs[(shiftRotationIndex + 1) % 3];
        const afternoonPair = rotationPairs[(shiftRotationIndex + 2) % 3];

        nightPair.forEach(id => (weeklyAssignments[id] = "Noche"));
        morningPair.forEach(id => (weeklyAssignments[id] = "Mañana"));
        afternoonPair.forEach(id => (weeklyAssignments[id] = "Tarde"));

        const weekDays = weeklyScheduleMap[weekOfYear];
        weekDays.forEach(({ day, dayOfWeek }) => {
            employeeList.forEach(emp => {
                const weeklyShift = weeklyAssignments[emp.id];
                if (!weeklyShift) return;

                let dailyShift: ShiftType = weeklyShift;
                 if (weeklyShift === "Noche" && (dayOfWeek === 6 || dayOfWeek === 0)) {
                    dailyShift = "Descanso";
                } else if ((weeklyShift === "Mañana" || weeklyShift === "Tarde") && dayOfWeek === 0) {
                    dailyShift = "Descanso";
                } else if (weeklyShift === "Administrativo" && (dayOfWeek === 6 || dayOfWeek === 0)) {
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
};


export function generateInitialSchedule(
  employeeList: Employee[],
  year: number,
  month: number
): EmployeeSchedule[] {
  if (employeeList.length === 7) {
    return generateFor7Employees(employeeList, year, month);
  }
  
  return generateFor8Employees(employeeList, year, month);
}
