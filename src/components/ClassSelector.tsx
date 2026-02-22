import { useState } from "react";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ClassSelector() {
  const { classes, selectedClass, setSelectedClassId } = useClassContext();
  const { role } = useAuth();

  if (classes.length === 0) return <ClassOnboarding />;

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedClass?.id || ""} onValueChange={setSelectedClassId}>
        <SelectTrigger className="w-[200px] rounded-xl">
          <SelectValue placeholder="Select class" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role === "instructor" ? <CreateClassDialog /> : <JoinClassDialog />}
    </div>
  );
}

export function ClassOnboarding() {
  const { role } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Plus className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        {role === "instructor" ? "Create your first class" : "Join a class"}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {role === "instructor"
          ? "Create a class to get started. Students will join using your class code."
          : "Enter the class code provided by your instructor to join."}
      </p>
      {role === "instructor" ? <CreateClassDialog /> : <JoinClassDialog />}
    </div>
  );
}

function JoinClassDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { joinClass } = useClassContext();
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { error } = await joinClass(code.trim());
    if (error) {
      toast({ title: "Failed to join", description: error, variant: "destructive" });
    } else {
      toast({ title: "Joined!", description: "You've joined the class." });
      setOpen(false);
      setCode("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <LogIn className="h-4 w-4" /> Join Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Join a Class</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Class Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS201-F26" className="rounded-xl mt-1" />
          </div>
          <Button onClick={handleJoin} disabled={loading} className="w-full rounded-xl">
            {loading ? "Joining..." : "Join Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { createClass } = useClassContext();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    const { error } = await createClass(name.trim(), code.trim());
    if (error) {
      toast({ title: "Failed to create", description: error, variant: "destructive" });
    } else {
      toast({ title: "Class created!", description: `Code: ${code}` });
      setOpen(false);
      setName("");
      setCode("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Create Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a Class</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Class Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CS 201 - Data Structures" className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Class Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS201-F26" className="rounded-xl mt-1" />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl">
            {loading ? "Creating..." : "Create Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
