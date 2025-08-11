import { getDaysInMonth } from 'date-fns';
import type { Employee, EmployeeSchedule } from '@/types';

const employees: Employee[] = [
  { id: '1', name: 'Gonzalo Mellao' },
  { id: '2', name: 'Luis Villagra' },
  { id: '3', name: 'Osvaldo Amaro' },
  { id: '4', name: 'Sebastian Amaro' },
  { id: '5', name: 'Darien Marambio' },
  { id: '6', name: 'Abraham Romero' },
  { id: '7', name: 'Ariel Donoso' },
  { id: '8', name: 'Bastian Lopez' },
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
