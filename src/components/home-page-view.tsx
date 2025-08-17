"use client";

import { useAuth } from '@/context/auth-context';
import { ScheduleView } from '@/components/schedule-view';
import { getEmployees } from '@/lib/data';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function HomePageView() {
  const { user, loading, isAdmin, logout } = useAuth();
  const employees = getEmployees();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
             <Skeleton className="w-8 h-8 rounded-lg" />
             <Skeleton className="w-32 h-6" />
          </div>
          <Skeleton className="w-24 h-9" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/20">
             <Icons.logo className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter font-headline text-foreground">Horario CPW</h1>
        </div>
        <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground hidden sm:inline'>{user.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Salir
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ScheduleView employees={employees} initialScheduleData={[]} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
