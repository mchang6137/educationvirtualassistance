import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { ClassScheduleManager } from "@/components/chat/ClassScheduleManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BookOpen, Bookmark, GraduationCap, Clock, Settings, Sun, Moon, Globe, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, LANGUAGES } from "@/hooks/useLanguage";
import { useSpeechSettings } from "@/hooks/useSpeech";
import { SpeakButton } from "@/components/SpeakButton";
import { T } from "@/components/T";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleRow { id: string; class_id: string; day_of_week: number; start_time: string; end_time: string; timezone: string; }
interface ClassRow { id: string; name: string; code: string; }
interface SavedThreadRow { id: string; thread_id: string; title?: string; category?: string; upvotes?: number; }

export default function Profile() {
  const { setSelectedClassId } = useClassContext();
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { speed, setSpeed } = useSpeechSettings();
  const [joinedClasses, setJoinedClasses] = useState<ClassRow[]>([]);
  const [createdClasses, setCreatedClasses] = useState<ClassRow[]>([]);
  const [savedThreads, setSavedThreads] = useState<SavedThreadRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || "Anonymous"));
    supabase.from("class_members").select("class_id, classes(id, name, code)").eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((d: any) => d.classes).filter(Boolean);
        setJoinedClasses(mapped);
      });
    if (role === "instructor") {
      supabase.from("classes").select("id, name, code").eq("instructor_id", user.id)
        .then(({ data }) => setCreatedClasses(data || []));
    }
    supabase.from("saved_threads").select("id, thread_id, forum_threads(id, title, category, upvotes)").eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((d: any) => ({
          id: d.id, thread_id: d.thread_id, title: d.forum_threads?.title,
          category: d.forum_threads?.category, upvotes: d.forum_threads?.upvotes,
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

  const speedLabel = speed <= 0.5 ? "Very Slow" : speed <= 0.8 ? "Slow" : speed <= 1.2 ? "Normal" : speed <= 1.6 ? "Fast" : "Very Fast";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <SpeakButton text={`${displayName}. ${role || ""}`} />
            </div>
            <p className="text-sm text-muted-foreground capitalize">{role || "—"} · <T>Private — only you can see this</T></p>
          </div>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="bg-muted rounded-xl p-1">
            <TabsTrigger value="classes" className="rounded-lg gap-2"><BookOpen className="h-4 w-4" /> <T>Classes</T></TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg gap-2"><Bookmark className="h-4 w-4" /> <T>Saved Threads</T></TabsTrigger>
            <TabsTrigger value="customization" className="rounded-lg gap-2"><Settings className="h-4 w-4" /> <T>Customization</T></TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {role === "instructor" ? (
              <Card>
                <CardHeader><CardTitle><T>Classes Created</T></CardTitle></CardHeader>
                <CardContent>
                  {createdClasses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6"><T>You haven't created any classes yet.</T></p>
                  ) : (
                    <div className="space-y-3">
                      {createdClasses.map((c) => {
                        const scheds = getClassSchedules(c.id);
                        return (
                          <div key={c.id} className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <Link to={`/chat`} onClick={() => setSelectedClassId(c.id)} className="block hover:opacity-80 transition-opacity">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-foreground">{c.name}</p>
                                <Badge variant="outline"><T>Join Code</T>: {c.code}</Badge>
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
                <CardHeader><CardTitle><T>Classes Joined</T></CardTitle></CardHeader>
                <CardContent>
                  {joinedClasses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6"><T>You haven't joined any classes yet.</T></p>
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
              <CardHeader><CardTitle><T>Saved Threads</T></CardTitle></CardHeader>
              <CardContent>
                {savedThreads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6"><T>No saved threads yet.</T></p>
                ) : (
                  <div className="space-y-3">
                    {savedThreads.map((t) => (
                      <Link key={t.id} to={`/forum/${t.thread_id}`} className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground hover:text-primary flex-1">{t.title}</p>
                          <SpeakButton text={t.title || ""} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {t.category && <CategoryBadge category={t.category as any} />}
                          <span className="text-xs text-muted-foreground">{t.upvotes || 0} <T>upvotes</T></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customization" className="space-y-6">
            {/* Theme */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">{theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} <T>Appearance</T></CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4"><T>Choose your preferred theme for the platform.</T></p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium"><T>Light</T></span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium"><T>Dark</T></span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> <T>Language</T></CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4"><T>Select your preferred language. The entire platform will translate to your chosen language.</T></p>
                <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Accessibility – TTS + Speed */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5" /> <T>Accessibility</T></CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <T>For visually impaired users, look for the speak button next to text throughout the platform. Clicking it will read the text aloud in your selected language.</T>
                  </p>
                  <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-muted/30">
                    <span className="text-sm text-foreground"><T>Try it out</T>:</span>
                    <SpeakButton text="Welcome to EVA! This is the text-to-speech accessibility feature. You can find the speak button next to text throughout the platform." size="default" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    <T>Speech Speed</T>: <span className="text-muted-foreground font-normal">{speed.toFixed(1)}x — {speedLabel}</span>
                  </label>
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={0.3}
                    max={2}
                    step={0.1}
                    className="max-w-xs"
                  />
                  <div className="flex justify-between max-w-xs text-[10px] text-muted-foreground mt-1">
                    <span><T>Slow</T></span>
                    <span><T>Normal</T></span>
                    <span><T>Fast</T></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
