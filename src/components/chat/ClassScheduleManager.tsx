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
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    setLoading(true);
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
                <span className="text-sm text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
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
            <Label className="text-xs">Start</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs">End</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-xl mt-1" />
          </div>
        </div>

        <Button onClick={handleAdd} disabled={loading} className="w-full rounded-xl mt-2 gap-2">
          <Plus className="h-4 w-4" /> Add Time Slot
        </Button>
      </DialogContent>
    </Dialog>
  );
}
