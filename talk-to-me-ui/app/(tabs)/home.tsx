import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import API_BASE from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';
//

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(2);
  const [hasAppointments, setHasAppointments] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', start: '', end: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const week = useMemo(() => {
    // Generate a simple week row centered on today
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 2);
    return new Array(7).fill(0).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        day: d.getDate(),
      };
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const id = Platform.OS === 'web' ? localStorage.getItem('user_id') : await AsyncStorage.getItem('user_id');
        setUserId(id);
        // quick optimistic update: if there is a local last mood, prefill score
        if (id) {
          const key = `last_mood_${id}`;
          let lastMood: string | null = null;
          try {
            lastMood = Platform.OS === 'web' ? localStorage.getItem(key) : await AsyncStorage.getItem(key);
          } catch {}
          if (lastMood) {
            const MOOD_MAP: Record<string, number> = {
              happy: 90, joyful: 92, good: 80, calm: 82, content: 78, neutral: 60, okay: 60, sad: 35,
              upset: 30, angry: 25, stressed: 30, anxious: 35, tired: 40, frustrated: 30, depressed: 20,
              excited: 88, optimistic: 85, grateful: 86,
            };
            const score = MOOD_MAP[String(lastMood).toLowerCase().trim()] ?? 50;
            // show immediate feedback; network recompute will override shortly
            setMoodScore(score);
          }
        }
      } catch {}
    };
    load();
  }, []);

  const computeMoodScore = useCallback(async (uid: string, signal?: AbortSignal) => {
    const MOOD_MAP: Record<string, number> = {
      happy: 90,
      joyful: 92,
      good: 80,
      calm: 82,
      content: 78,
      neutral: 60,
      okay: 60,
      sad: 35,
      upset: 30,
      angry: 25,
      stressed: 30,
      anxious: 35,
      tired: 40,
      frustrated: 30,
      depressed: 20,
      excited: 88,
      optimistic: 85,
      grateful: 86,
    };
    try {
      const res = await fetch(`${API_BASE}/api/journal/fetch-mood-history/${uid}`, { signal });
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.data ?? [];
      if (!arr.length) { setMoodScore(null); return; }
      const last = arr.slice(-5);
      const scores = last.map((e: any) => {
        const key = String(e.user_mood || '').toLowerCase().trim();
        return MOOD_MAP[key] ?? 50;
      });
      const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      setMoodScore(avg);
    } catch {}
  }, [API_BASE]);

  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    computeMoodScore(userId, ctrl.signal);
    return () => ctrl.abort();
  }, [userId, computeMoodScore]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const ctrl = new AbortController();
      computeMoodScore(userId, ctrl.signal);
      return () => ctrl.abort();
    }, [userId, computeMoodScore])
  );

  // platform-aware API base
  // Appointments are stored locally (AsyncStorage on native, localStorage on web)

  // Fetch appointments for the selected day
  const fetchApptsForSelectedDay = async () => {
    if (!userId) return;
    try {
      const today = new Date();
      const base = new Date(today);
      base.setDate(today.getDate() - 2 + selectedIndex);
      const dateStr = base.toISOString().slice(0, 10);
      const storageKey = `appointments_${userId}`;
      let all: any[] = [];
      if (Platform.OS === 'web') {
        try {
          const raw = localStorage.getItem(storageKey);
          all = raw ? JSON.parse(raw) : [];
        } catch {}
      } else {
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          all = raw ? JSON.parse(raw) : [];
        } catch {}
      }
      const filtered = (all || [])
        .filter((a: any) => typeof a?.start_time === 'string' && a.start_time.slice(0, 10) === dateStr)
        .sort((a: any, b: any) => (a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0));
      setAppointments(filtered);
      setHasAppointments(filtered.length > 0);
    } catch (e) {
      setAppointments([]);
      setHasAppointments(false);
    }
  };

  useEffect(() => {
    fetchApptsForSelectedDay();
  }, [userId, selectedIndex]);

  const openAdd = () => {
    // Prefill date based on selected day
    const today = new Date();
    const base = new Date(today);
    base.setDate(today.getDate() - 2 + selectedIndex);
    const dateStr = base.toISOString().slice(0, 10);
    setForm({ title: '', date: dateStr, start: '09:00', end: '09:30', location: '', notes: '' });
    setShowModal(true);
  };

  const saveAppointment = async () => {
    if (!userId) return;
    if (!form.title || !form.date || !form.start || !form.end) return;
    setSaving(true);
    try {
      const startIso = new Date(`${form.date}T${form.start}:00`).toISOString();
      const endIso = new Date(`${form.date}T${form.end}:00`).toISOString();
      const appt = {
        id: `appt_${Date.now()}`,
        user_id: userId,
        title: form.title.trim(),
        start_time: startIso,
        end_time: endIso,
        location: form.location?.trim() || '',
        notes: form.notes?.trim() || '',
      };
      const storageKey = `appointments_${userId}`;
      let all: any[] = [];
      if (Platform.OS === 'web') {
        try { all = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { all = []; }
        localStorage.setItem(storageKey, JSON.stringify([...(all || []), appt]));
      } else {
        try { all = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]'); } catch { all = []; }
        await AsyncStorage.setItem(storageKey, JSON.stringify([...(all || []), appt]));
      }
      setShowModal(false);
      setForm({ title: '', date: '', start: '', end: '', location: '', notes: '' });
      await fetchApptsForSelectedDay();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100, minHeight: '100%' }}>
      {/* Greeting Header */}
  <View style={styles.greetingRow}>
        <View>
          <Text style={styles.hello}>Hello{userId ? ',' : ''} {userId ? 'Friend' : ''}</Text>
          <Text style={styles.subtle}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/account')}
          accessibilityRole="button"
          accessibilityLabel="Open account"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Mood score card */}
      <View style={styles.metricCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.metricLabel}>Mood score</Text>
          <TouchableOpacity onPress={() => router.push('/history')} accessibilityRole="button" accessibilityLabel="View mood history">
            <Text style={styles.metricLink}>View history →</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.metricValue}>{moodScore ?? '—'}</Text>
        <Text style={styles.metricSubtle}>Based on last 5 entries</Text>
      </View>

      {/* Daily challenge card */}
      <View style={styles.challengeCard}>
        <Text style={styles.challengeTitle}>Daily challenge</Text>
        <Text style={styles.challengeText}>Write a short note before 09:00 AM</Text>
        <View style={styles.peepsRow}>
          <View style={[styles.peep, { left: 0 }]} />
          <View style={[styles.peep, { left: 14 }]} />
          <View style={[styles.peep, { left: 28 }]} />
          <View style={[styles.morePeep]} />
        </View>
      </View>

      {/* Date pills */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2, marginBottom: 2 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {week.map((d, i) => {
          const active = i === selectedIndex;
          return (
            <TouchableOpacity key={i} onPress={() => setSelectedIndex(i)} style={[styles.datePill, active && styles.datePillActive]}>
              <Text style={[styles.dateWeek, active && styles.dateActiveText]}>{d.label}</Text>
              <View style={[styles.dateCircle, active && styles.dateCircleActive]}><Text style={[styles.dateNum, active && styles.dateActiveText]}>{d.day}</Text></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Appointments or empty state */}
      {/* Add appointment button */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAdd()}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* No appointments message (between calendar and Your plan) */}
      {hasAppointments ? (
        <View style={styles.apptList}>
          {appointments.map((a, idx) => (
            <View key={idx} style={styles.apptItem}>
              <Text style={styles.apptTitle}>{a.title}</Text>
              <Text style={styles.apptTime}>{new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(a.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {!!a.location && <Text style={styles.apptMeta}>{a.location}</Text>}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyAppointments}>
          <Text style={styles.emptyText}>You have no appointments.</Text>
        </View>
      )}

      {/* Your plan */}
      <Text style={styles.sectionTitle}>Your plan</Text>
      <View style={styles.planRow}>
        <View style={[styles.planCard, { backgroundColor: '#FEE5A1' }]}>
          <Text style={styles.planBadge}>Medium</Text>
          <Text style={styles.planTitle}>Mood Reflection</Text>
          <Text style={styles.planMeta}>Today • 9:00–9:15 AM</Text>
          <TouchableOpacity onPress={() => router.push('/journal-entry')}>
            <Text style={styles.planLink}>Start now →</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.planCard, { backgroundColor: '#CDE6FF' }]}>
          <Text style={styles.planBadge}>Light</Text>
          <Text style={styles.planTitle}>Breathing Break</Text>
          <Text style={styles.planMeta}>6:00–6:10 PM</Text>
          <TouchableOpacity onPress={() => router.push('/chat')}>
            <Text style={styles.planLink}>Guided chat →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    {/* Add Appointment Modal */}
    <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New appointment</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={form.date}
            onChangeText={(v) => setForm({ ...form, date: v })}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Start (HH:MM)"
              value={form.start}
              onChangeText={(v) => setForm({ ...form, start: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="End (HH:MM)"
              value={form.end}
              onChangeText={(v) => setForm({ ...form, end: v })}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Location (optional)"
            value={form.location}
            onChangeText={(v) => setForm({ ...form, location: v })}
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Notes (optional)"
            multiline
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setShowModal(false)} disabled={saving}>
              <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#111827' }]} onPress={saveAppointment} disabled={saving}>
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F5F9',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F6F5F9',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hello: {
    fontSize: 22,
    color: '#101112',
    fontWeight: '700',
  },
  subtle: {
    color: '#6B7280',
    marginTop: 4,
  },
  avatarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  challengeCard: {
    marginTop: 12,
    backgroundColor: '#EAE2FF',
    borderRadius: 22,
    padding: 16,
  },
  challengeTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  challengeText: { color: '#374151', marginTop: 4 },
  peepsRow: { height: 40, marginTop: 12 },
  peep: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    borderWidth: 2,
    borderColor: '#fff',
  },
  morePeep: {
    position: 'absolute',
    left: 44,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F472B6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  datePill: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
  dateWeek: { color: '#9CA3AF', fontSize: 12 },
  dateCircle: {
    marginTop: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNum: { color: '#111827', fontWeight: '600' },
  datePillActive: {},
  dateCircleActive: { backgroundColor: '#111827', borderColor: '#111827' },
  dateActiveText: { color: '#fff' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  planRow: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  planBadge: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  planTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  planMeta: { color: '#374151', marginTop: 2 },
  planLink: { color: '#111827', marginTop: 10, textDecorationLine: 'underline', fontWeight: '600' },
  emptyAppointments: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  emptyText: { color: '#6B7280', fontSize: 14 },
  sectionTitle: { marginTop: 6, marginBottom: 6, fontWeight: '700', fontSize: 18, color: '#111827' },
  apptList: { gap: 8, marginBottom: 6 },
  apptItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  apptTitle: { color: '#111827', fontWeight: '700' },
  apptTime: { color: '#374151', marginTop: 2 },
  apptMeta: { color: '#6B7280', marginTop: 2 },

  addBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#111827', borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 8, color: '#111827' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalBtnText: { fontWeight: '700' },
  // Mood metric styles
  metricCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  metricLabel: { color: '#6B7280', fontWeight: '600' },
  metricValue: { fontSize: 34, fontWeight: '800', color: '#111827', marginTop: 6 },
  metricSubtle: { color: '#6B7280', marginTop: 2 },
  metricLink: { color: '#111827', fontWeight: '700', textDecorationLine: 'underline' },
});
