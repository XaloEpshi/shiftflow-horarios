import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { EmployeeSchedule } from '@/types';

// Function to save the schedule to Firestore
export const saveSchedule = async (scheduleId: string, data: EmployeeSchedule[]): Promise<void> => {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await setDoc(scheduleRef, { scheduleData: data });
  } catch (error) {
    console.error('Error saving schedule to Firestore:', error);
    throw new Error('Could not save the schedule.');
  }
};

// Function to load the schedule from Firestore
export const loadSchedule = async (scheduleId: string): Promise<EmployeeSchedule[] | null> => {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    const docSnap = await getDoc(scheduleRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.scheduleData as EmployeeSchedule[];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error loading schedule from Firestore:', error);
    throw new Error('Could not load the schedule.');
  }
};
