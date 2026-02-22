import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
}

const BUFFER_MINUTES = 5;

function isWithinSchedule(schedules: Schedule[]): { available: boolean; nextClass: string | null } {
  if (schedules.length === 0) return { available: false, nextClass: null };

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const s of schedules) {
    if (s.day_of_week !== currentDay) continue;
    const [startH, startM] = s.start_time.split(":").map(Number);
    const [endH, endM] = s.end_time.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM + BUFFER_MINUTES;

    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      return { available: true, nextClass: null };
    }
  }

  // Find next upcoming class
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let nextClass: string | null = null;
  let minDist = Infinity;

  for (const s of schedules) {
    let dayDiff = s.day_of_week - currentDay;
    if (dayDiff < 0) dayDiff += 7;
    const [startH, startM] = s.start_time.split(":").map(Number);
    const startMin = startH * 60 + startM;
    if (dayDiff === 0 && startMin <= currentMinutes) dayDiff = 7;
    const dist = dayDiff * 24 * 60 + (dayDiff === 0 ? startMin - currentMinutes : startMin);
    if (dist < minDist) {
      minDist = dist;
      const timeStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
      const [endH, endM] = s.end_time.split(":").map(Number);
      const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      nextClass = `${dayNames[s.day_of_week]} ${timeStr} – ${endStr}`;
    }
  }

  return { available: false, nextClass };
}

export function useChatAvailability(classId: string | undefined) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [available, setAvailable] = useState(true);
  const [nextClass, setNextClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!classId) { setLoading(false); return; }
    const { data } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("class_id", classId);
    const scheds = (data || []) as Schedule[];
    setSchedules(scheds);
    if (scheds.length === 0) {
      // No schedule set — always available (backward compat)
      setAvailable(true);
      setNextClass(null);
    } else {
      const result = isWithinSchedule(scheds);
      setAvailable(result.available);
      setNextClass(result.nextClass);
    }
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    fetchSchedules();
    // Re-check every 30 seconds
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, [fetchSchedules]);

  return { available, nextClass, schedules, loading, refetchSchedules: fetchSchedules };
}
