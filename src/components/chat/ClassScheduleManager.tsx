import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0-59

function to24(hour: string, minute: string, period: string): string {
  let h = parseInt(hour);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function from24(time: string): { hour: string; minute: string; period: string } {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour: String(hour), minute: String(m).padStart(2, "0"), period };
}

export function ClassScheduleManager({
  classId,
  schedules,
  onUpdate,
}: {
  classId: string;
  schedules: Schedule[];
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("1");

  const startParsed = from24("09:00");
  const endParsed = from24("10:15");
  const [startHour, setStartHour] = useState(startParsed.hour);
  const [startMin, setStartMin] = useState(startParsed.minute);
  const [startPeriod, setStartPeriod] = useState(startParsed.period);
  const [endHour, setEndHour] = useState(endParsed.hour);
  const [endMin, setEndMin] = useState(endParsed.minute);
  const [endPeriod, setEndPeriod] = useState(endParsed.period);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    setLoading(true);
    const startTime = to24(startHour, startMin, startPeriod);
    const endTime = to24(endHour, endMin, endPeriod);
    const { error } = await supabase.from("class_schedules").insert({
      class_id: classId,
      day_of_week: parseInt(day),
      start_time: startTime,
      end_time: endTime,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Schedule added" });
      onUpdate();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("class_schedules").delete().eq("id", id);
    toast({ title: "Schedule removed" });
    onUpdate();
  };

  const formatDisplay = (time: string) => {
    const { hour, minute, period } = from24(time);
    return `${hour}:${minute} ${period}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <Clock className="h-4 w-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Class Schedule</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Set recurring weekly times when live chat is available.</p>

        {schedules.filter(s => s.class_id === classId).length > 0 && (
          <div className="space-y-2 mt-2">
            {schedules.filter(s => s.class_id === classId).map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                <span className="text-sm font-medium">{DAYS[s.day_of_week]}</span>
                <span className="text-sm text-muted-foreground">{formatDisplay(s.start_time)} – {formatDisplay(s.end_time)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Start Time</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Hr" /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startMin} onValueChange={setStartMin}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Min" /></SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startPeriod} onValueChange={setStartPeriod}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">End Time</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Hr" /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endMin} onValueChange={setEndMin}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Min" /></SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endPeriod} onValueChange={setEndPeriod}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={handleAdd} disabled={loading} className="w-full rounded-xl mt-2 gap-2">
          <Plus className="h-4 w-4" /> Add Time Slot
        </Button>
      </DialogContent>
    </Dialog>
  );
}
