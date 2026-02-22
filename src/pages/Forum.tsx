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
import { Search, ArrowUp, MessageSquare, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MessageCategory } from "@/data/mockData";

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
  const visibleCategories = isInstructor ? ALL_CATEGORIES.filter(c => c !== "Study Sessions") : ALL_CATEGORIES;

  const fetchThreads = async () => {
    if (!selectedClass) return;
    setLoading(true);
    const { data } = await supabase
      .from("forum_threads")
      .select("id, title, body, category, tags, created_at, upvotes")
      .eq("class_id", selectedClass.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch reply counts
      const threadIds = data.map((t) => t.id);
      const { data: replyCounts } = await supabase
        .from("forum_replies")
        .select("thread_id")
        .in("thread_id", threadIds.length > 0 ? threadIds : ["none"]);

      const countMap: Record<string, number> = {};
      (replyCounts || []).forEach((r: any) => {
        countMap[r.thread_id] = (countMap[r.thread_id] || 0) + 1;
      });

      setThreads(data.map((t) => ({ ...t, reply_count: countMap[t.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, [selectedClass?.id]);

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
            <h1 className="text-2xl font-bold text-foreground">Discussion Forum</h1>
            <p className="text-sm text-muted-foreground">All posts are anonymous</p>
          </div>
          <div className="flex items-center gap-2">
            <ClassSelector />
            <NewThreadDialog classId={selectedClass?.id} userId={user?.id} onCreated={fetchThreads} categories={visibleCategories} />
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads..." className="pl-10 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveCategory(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>All</button>
          {visibleCategories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(activeCategory === c ? null : c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>{c}</button>
          ))}
        </div>

        <div className="space-y-3">
          {loading && <p className="text-center text-muted-foreground py-12">Loading...</p>}
          {!loading && filtered.map((t) => (
            <Link key={t.id} to={`/forum/${t.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
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
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.reply_count || 0} replies</span>
                </div>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No threads found. Start a discussion!</p>}
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
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || !classId || !userId) return;
    setLoading(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("forum_threads").insert({
      title, body, category, tags,
      class_id: classId,
      user_id: userId,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thread created!" });
      setOpen(false);
      setTitle(""); setBody(""); setTagsInput("");
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" /> New Thread</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Discussion Thread</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your question?" className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your question in detail..." className="rounded-xl mt-1" rows={4} />
          </div>
          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="algorithms, recursion" className="rounded-xl mt-1" />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl">
            {loading ? "Creating..." : "Post Thread"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
