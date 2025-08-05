import { Icons } from '@/components/icons';
import { ScheduleView } from '@/components/schedule-view';
import { getEmployees, generateInitialSchedule } from '@/lib/data';

export default function Home() {
  const employees = getEmployees();
  const initialSchedule = generateInitialSchedule(employees, new Date().getFullYear(), new Date().getMonth());

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/20">
             <Icons.logo className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter font-headline text-foreground">ShiftFlow</h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ScheduleView employees={employees} initialScheduleData={initialSchedule} />
      </main>
    </div>
  );
}
