import { getDaysInMonth } from 'date-fns';
import type { Employee, EmployeeSchedule } from '@/types';

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

export function getEmployees(): Employee[] {
  return employees;
}

export function generateInitialSchedule(
  employeeList: Employee[],
  year: number,
  month: number
): EmployeeSchedule[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  
  // Return a simple, non-random schedule.
  // The complex generation will happen on the client.
  return employeeList.map(employee => {
    return {
      employeeId: employee.id,
      schedule: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        shift: 'Descanso',
      })),
    };
  });
}
