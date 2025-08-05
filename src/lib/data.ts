import { getDaysInMonth } from 'date-fns';
import type { Employee, EmployeeSchedule } from '@/types';

const employees: Employee[] = [
  { id: '1', name: 'Carlos Gomez' },
  { id: '2', name: 'Ana Lopez' },
  { id: '3', name: 'Luis Fernandez' },
  { id: '4', name: 'Maria Rodriguez' },
  { id: '5', name: 'Javier Morales' },
  { id: '6', name: 'Sofia Castillo' },
  { id: '7', name: 'Pedro Ramirez' },
  { id: '8', name: 'Laura Herrera' },
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
