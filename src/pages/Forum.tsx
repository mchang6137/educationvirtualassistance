import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { ClassSelector, ClassOnboarding } from "@/components/ClassSelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowUp, MessageSquare, Plus, Sparkles, Loader2, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { useChatAvailability } from "@/hooks/useChatAvailability";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MessageCategory } from "@/data/mockData";
import { T } from "@/components/T";
import { SpeakButton } from "@/components/SpeakButton";

const ALL_CATEGORIES: MessageCategory[] = ["Concept Clarification", "Example Request", "General Question", "Assignment Help", "Lecture Logistics", "Study Sessions"];

interface ThreadRow {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[] | null;
  created_at: string;
  upvotes: number;
  reply_count?: number;
}

export default function Forum() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedClass, classes, loading: classesLoading } = useClassContext();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isInstructor = role === "instructor";
  const { available: chatActive, nextClass } = useChatAvailability(selectedClass?.id);
  const visibleCategories = isInstructor ? ALL_CATEGORIES.filter(c => c !== "Study Sessions") : ALL_CATEGORIES;

  const fetchThreads = async () => {
    if (!selectedClass) return;
    setLoading(true);
    let query = supabase
      .from("forum_threads")
      .select("id, title, body, category, tags, created_at, upvotes, forum_replies(count)")
      .eq("class_id", selectedClass.id)
      .order("created_at", { ascending: false });

    if (isInstructor) {
      query = query.neq("category", "Study Sessions");
    }

    const { data } = await query;

    if (data) {
      setThreads(data.map((t: any) => ({
        ...t,
        reply_count: t.forum_replies?.[0]?.count || 0,
        forum_replies: undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, [selectedClass?.id, role]);

  // Realtime: new threads
  useEffect(() => {
    if (!selectedClass) return;
    const channel = supabase
      .channel(`forum-${selectedClass.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "forum_threads",
        filter: `class_id=eq.${selectedClass.id}`,
      }, () => { fetchThreads(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedClass?.id]);

  const filtered = threads.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || t.category === activeCategory;
    const hideStudySessions = isInstructor && t.category === "Study Sessions";
    return matchSearch && matchCategory && !hideStudySessions;
  });

  if (classesLoading) {
    return <AppLayout><div className="flex items-center justify-center py-16 text-muted-foreground">Loading classes...</div></AppLayout>;
  }

  if (classes.length === 0) {
    return <AppLayout><ClassOnboarding /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground"><T>Discussion Forum</T></h1>
            <p className="text-sm text-muted-foreground"><T>All posts are anonymous</T></p>
          </div>
          <div className="flex items-center gap-2">
            <ClassSelector />
            <NewThreadDialog classId={selectedClass?.id} userId={user?.id} onCreated={fetchThreads} categories={visibleCategories} />
          </div>
        </div>

        {/* Live Chat schedule info for students */}
        {!isInstructor && selectedClass && (
          <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl border text-sm ${chatActive ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" : "bg-muted/50 border-border text-muted-foreground"}`}>
            <Clock className="h-4 w-4 shrink-0" />
             {chatActive ? (
              <span><T>Live Chat is active now — head to the chat to participate!</T></span>
            ) : (
              <span>
                <T>Live Chat is only available during scheduled class times.</T>
                {nextClass && <> <T>Next session</T>: <span className="font-medium text-foreground">{nextClass}</span></>}
              </span>
            )}
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads..." className="pl-10 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveCategory(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}><T>All</T></button>
          {visibleCategories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(activeCategory === c ? null : c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}><T>{c}</T></button>
          ))}
        </div>

        <div className="space-y-3">
          {loading && <p className="text-center text-muted-foreground py-12">Loading...</p>}
          {!loading && filtered.map((t) => (
            <Link key={t.id} to={`/forum/${t.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex-1"><T>{t.title}</T></h3>
                      <SpeakButton text={`${t.title}. ${t.body}`} className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2"><T>{t.body}</T></p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <CategoryBadge category={t.category as any} />
                      {(t.tags || []).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0">
                    <ArrowUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.upvotes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.reply_count || 0} <T>replies</T></span>
                </div>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 && <p className="text-center text-muted-foreground py-12"><T>No threads found. Start a discussion!</T></p>}
        </div>
      </div>
    </AppLayout>
  );
}

function NewThreadDialog({ classId, userId, onCreated, categories }: { classId?: string; userId?: string; onCreated: () => void; categories: MessageCategory[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("General Question");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ label: string; text: string }[]>([]);
  const [aiTarget, setAiTarget] = useState<"title" | "body">("body");
  const { toast } = useToast();

  const handleAiRefine = async (target: "title" | "body") => {
    const text = target === "title" ? title : body;
    if (!text.trim()) {
      toast({ title: "Type something first", description: `Enter your ${target} text, then click the AI button to refine it.`, variant: "destructive" });
      return;
    }
    setAiTarget(target);
    setAiOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("refine-question", {
        body: { question: text },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        setAiLoading(false);
        return;
      }
      setAiSuggestions(data?.suggestions || []);
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message || "Failed to get suggestions", variant: "destructive" });
    }
    setAiLoading(false);
  };

  const handlePickSuggestion = (text: string) => {
    if (aiTarget === "title") setTitle(text);
    else setBody(text);
    setAiOpen(false);
    setAiSuggestions([]);
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || !classId || !userId) return;
    setLoading(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    // Auto-detect study session content and force category
    const combined = (title + " " + body).toLowerCase();
    const studyKeywords = ["study session", "study group", "study together", "meet up to study", "study meetup", "come study", "study at", "library to study"];
    const isStudySession = studyKeywords.some((kw) => combined.includes(kw));
    const finalCategory = isStudySession ? "Study Sessions" : category;

    const { error } = await supabase.from("forum_threads").insert({
      title, body, category: finalCategory, tags,
      class_id: classId,
      user_id: userId,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thread created!" });
      setOpen(false);
      setTitle(""); setBody(""); setTagsInput("");
      setAiOpen(false); setAiSuggestions([]);
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" /> <T>New Thread</T></Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle><T>New Discussion Thread</T></DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label><T>Title</T></Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAiRefine("title")}
                className="h-6 gap-1 text-xs text-primary hover:text-primary"
                title="Refine title with AI"
              >
                <Sparkles className="h-3 w-3" /> <T>Refine</T>
              </Button>
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your question?" className="rounded-xl mt-1" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label><T>Body</T></Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAiRefine("body")}
                className="h-6 gap-1 text-xs text-primary hover:text-primary"
                title="Refine body with AI"
              >
                <Sparkles className="h-3 w-3" /> <T>Refine</T>
              </Button>
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your question in detail..." className="rounded-xl mt-1" rows={4} />
          </div>

          {/* AI Suggestions Panel */}
          {aiOpen && (
            <div className="bg-muted/30 border border-border rounded-xl p-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">AI Refinement — {aiTarget}</span>
                </div>
                <button onClick={() => { setAiOpen(false); setAiSuggestions([]); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Pick a refined version, or close to keep your original.</p>
              {aiLoading ? (
                <div className="flex items-center gap-2 justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating options...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {aiSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handlePickSuggestion(s.text)}
                      className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <span className="text-xs font-semibold text-primary">{s.label}</span>
                      <p className="text-sm text-foreground mt-1 group-hover:text-primary transition-colors">{s.text}</p>
                    </button>
                  ))}
                  {aiSuggestions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No suggestions generated. Try again.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <Label><T>Category</T></Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}><T>{c}</T></button>
              ))}
            </div>
          </div>
          <div>
            <Label><T>Tags (comma-separated)</T></Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="algorithms, recursion" className="rounded-xl mt-1" />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl">
            <T>{loading ? "Creating..." : "Post Thread"}</T>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
