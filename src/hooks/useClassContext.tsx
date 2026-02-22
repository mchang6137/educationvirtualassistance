import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  instructor_id: string;
}

interface ClassContextType {
  classes: ClassInfo[];
  selectedClass: ClassInfo | null;
  setSelectedClassId: (id: string) => void;
  loading: boolean;
  joinClass: (code: string) => Promise<{ error: string | null }>;
  createClass: (name: string, code: string) => Promise<{ error: string | null }>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    if (!user) { setClasses([]); setLoading(false); return; }

    // Fetch both in parallel — use whichever matches the role
    const [instructorRes, studentRes] = await Promise.all([
      supabase.from("classes").select("*").eq("instructor_id", user.id),
      supabase.from("class_members").select("class_id, classes(id, name, code, instructor_id)").eq("user_id", user.id),
    ]);

    const instructorClasses = instructorRes.data || [];
    const studentClasses = (studentRes.data || [])
      .map((d: any) => d.classes)
      .filter(Boolean) as ClassInfo[];

    if (role === "instructor") {
      setClasses(instructorClasses);
    } else if (role === "student") {
      setClasses(studentClasses);
    } else {
      // Role not loaded yet — use whichever has data
      setClasses(instructorClasses.length > 0 ? instructorClasses : studentClasses);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, [user, role]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;

  const joinClass = async (code: string): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!cls) return { error: "Class not found with that code" };

    const { error } = await supabase
      .from("class_members")
      .insert({ class_id: cls.id, user_id: user.id });
    if (error) {
      if (error.code === "23505") return { error: "You already joined this class" };
      return { error: error.message };
    }
    await fetchClasses();
    setSelectedClassId(cls.id);
    return { error: null };
  };

  const createClass = async (name: string, code: string): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("classes")
      .insert({ name, code, instructor_id: user.id })
      .select()
      .single();
    if (error) return { error: error.message };
    await fetchClasses();
    setSelectedClassId(data.id);
    return { error: null };
  };

  return (
    <ClassContext.Provider value={{ classes, selectedClass, setSelectedClassId, loading, joinClass, createClass }}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClassContext() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useClassContext must be inside ClassProvider");
  return ctx;
}
