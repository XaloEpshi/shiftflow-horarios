export type ShiftType = 'Mañana' | 'Tarde' | 'Noche' | 'Administrativo' | 'Insumos' | 'Descanso';

export interface Employee {
  id: string;
  name: string;
  active?: boolean;
}

export interface ScheduleEntry {
  day: number;
  shift: ShiftType;
}

export interface EmployeeSchedule {
  employeeId: string;
  schedule: ScheduleEntry[];
}
