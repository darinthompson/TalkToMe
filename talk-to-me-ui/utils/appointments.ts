import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
};

export class AppointmentStore {
  private keyFor(userId: string) {
    return `appointments_${userId}`;
  }

  private async loadAll(userId: string): Promise<Appointment[]> {
    const key = this.keyFor(userId);
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      }
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async saveAll(userId: string, list: Appointment[]): Promise<void> {
    const key = this.keyFor(userId);
    const payload = JSON.stringify(list);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, payload);
    } else {
      await AsyncStorage.setItem(key, payload);
    }
  }

  async listForDate(userId: string, dateISO: string): Promise<Appointment[]> {
    const all = await this.loadAll(userId);
    const filtered = (all || [])
      .filter((a) => typeof a?.start_time === 'string' && a.start_time.slice(0, 10) === dateISO)
      .sort((a, b) => (a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0));
    return filtered;
  }

  async add(userId: string, appt: Omit<Appointment, 'id' | 'user_id'>): Promise<Appointment> {
    const list = await this.loadAll(userId);
    const newAppt: Appointment = {
      id: `appt_${Date.now()}`,
      user_id: userId,
      ...appt,
    };
    await this.saveAll(userId, [...(list || []), newAppt]);
    return newAppt;
  }
}
