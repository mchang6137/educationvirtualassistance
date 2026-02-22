import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { ClassScheduleManager } from "@/components/chat/ClassScheduleManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Bookmark, GraduationCap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleRow { id: string; class_id: string; day_of_week: number; start_time: string; end_time: string; timezone: string; }
interface ClassRow { id: string; name: string; code: string; }
interface SavedThreadRow { id: string; thread_id: string; title?: string; category?: string; upvotes?: number; }

export default function Profile() {
  const { setSelectedClassId } = useClassContext();
  const { user, role } = useAuth();
  const [joinedClasses, setJoinedClasses] = useState<ClassRow[]>([]);
  const [createdClasses, setCreatedClasses] = useState<ClassRow[]>([]);
  const [savedThreads, setSavedThreads] = useState<SavedThreadRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    // Fetch profile
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || "Anonymous"));

    // Fetch joined classes (via class_members)
    supabase.from("class_members").select("class_id, classes(id, name, code)").eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((d: any) => d.classes).filter(Boolean);
        setJoinedClasses(mapped);
      });

    // Fetch created classes (for instructors)
    if (role === "instructor") {
      supabase.from("classes").select("id, name, code").eq("instructor_id", user.id)
        .then(({ data }) => setCreatedClasses(data || []));
    }

    // Fetch saved threads
    supabase.from("saved_threads").select("id, thread_id, forum_threads(id, title, category, upvotes)").eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((d: any) => ({
          id: d.id,
          thread_id: d.thread_id,
          title: d.forum_threads?.title,
          category: d.forum_threads?.category,
          upvotes: d.forum_threads?.upvotes,
        }));
        setSavedThreads(mapped);
      });

    fetchSchedules();
  }, [user, role]);

  const fetchSchedules = () => {
    supabase.from("class_schedules").select("id, class_id, day_of_week, start_time, end_time, timezone")
      .then(({ data }) => setSchedules(data || []));
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const getClassSchedules = (classId: string) =>
    schedules.filter((s) => s.class_id === classId);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground capitalize">{role || "—"} · Private — only you can see this</p>
          </div>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="bg-muted rounded-xl p-1">
            <TabsTrigger value="classes" className="rounded-lg gap-2"><BookOpen className="h-4 w-4" /> Classes</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg gap-2"><Bookmark className="h-4 w-4" /> Saved Threads</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {role === "instructor" ? (
              <Card>
                <CardHeader><CardTitle>Classes Created</CardTitle></CardHeader>
                <CardContent>
                  {createdClasses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">You haven't created any classes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {createdClasses.map((c) => {
                        const scheds = getClassSchedules(c.id);
                        return (
                          <div key={c.id} className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <Link to={`/chat`} onClick={() => setSelectedClassId(c.id)} className="block hover:opacity-80 transition-opacity">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-foreground">{c.name}</p>
                                <Badge variant="outline">Join Code: {c.code}</Badge>
                              </div>
                              {scheds.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {scheds.map((s, i) => (
                                    <span key={i}>{DAY_NAMES[s.day_of_week]} {formatTime(s.start_time)} – {formatTime(s.end_time)}{i < scheds.length - 1 ? ", " : ""}</span>
                                  ))}
                                </div>
                              )}
                            </Link>
                            <ClassScheduleManager classId={c.id} schedules={scheds} onUpdate={fetchSchedules} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>Classes Joined</CardTitle></CardHeader>
                <CardContent>
                  {joinedClasses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">You haven't joined any classes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {joinedClasses.map((c) => {
                        const scheds = getClassSchedules(c.id);
                        return (
                          <Link key={c.id} to={`/chat`} onClick={() => setSelectedClassId(c.id)} className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground">{c.name}</p>
                              <Badge variant="outline">{c.code}</Badge>
                            </div>
                            {scheds.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {scheds.map((s, i) => (
                                  <span key={i}>{DAY_NAMES[s.day_of_week]} {formatTime(s.start_time)} – {formatTime(s.end_time)}{i < scheds.length - 1 ? ", " : ""}</span>
                                ))}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader><CardTitle>Saved Threads</CardTitle></CardHeader>
              <CardContent>
                {savedThreads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No saved threads yet.</p>
                ) : (
                  <div className="space-y-3">
                    {savedThreads.map((t) => (
                      <Link key={t.id} to={`/forum/${t.thread_id}`} className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <p className="font-medium text-foreground hover:text-primary">{t.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {t.category && <CategoryBadge category={t.category as any} />}
                          <span className="text-xs text-muted-foreground">{t.upvotes || 0} upvotes</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
