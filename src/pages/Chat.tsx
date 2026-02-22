import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassSelector, ClassOnboarding } from "@/components/ClassSelector";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, AlertTriangle, X, Sparkles, Loader2, Search } from "lucide-react";
import type { MessageCategory } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { checkAntiCheat, categorizeMessage } from "@/data/mockData";

interface ChatMsg {
  id: string;
  text: string;
  category: string;
  created_at: string;
  is_ai: boolean;
  is_starred: boolean;
  user_id: string | null;
}

interface AISuggestion {
  label: string;
  text: string;
}

const categories: MessageCategory[] = ["Concept Clarification", "Example Request", "General Question", "Assignment Help", "Lecture Logistics"];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedClass, classes, loading } = useClassContext();
  const { user, role } = useAuth();

  // Fetch messages for selected class
  useEffect(() => {
    if (!selectedClass) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("class_id", selectedClass.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedClass.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `class_id=eq.${selectedClass.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMessages((prev) => {
            if (prev.some(m => m.id === (payload.new as ChatMsg).id)) return prev;
            return [...prev, payload.new as ChatMsg];
          });
        } else if (payload.eventType === "UPDATE") {
          setMessages((prev) => prev.map(m => m.id === (payload.new as ChatMsg).id ? payload.new as ChatMsg : m));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedClass?.id]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || !selectedClass || !user) return;

    const cheatCheck = checkAntiCheat(text);
    if (cheatCheck.blocked) {
      setWarning(cheatCheck.hint || null);
      toast({ title: "Message blocked", description: "This looks like an assignment answer request.", variant: "destructive" });
      return;
    }

    const category = categorizeMessage(text);
    const { error } = await supabase.from("chat_messages").insert({
      text,
      category,
      class_id: selectedClass.id,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      return;
    }

    setInput("");
    setWarning(null);
    setAiOpen(false);
    setAiSuggestions([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAiRefine = async () => {
    if (!input.trim()) {
      toast({ title: "Type something first", description: "Enter your rough question or idea, then click the AI button to refine it.", variant: "destructive" });
      return;
    }
    setAiOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("refine-question", {
        body: { question: input },
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
    setInput(text);
    setAiOpen(false);
    setAiSuggestions([]);
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-16 text-muted-foreground">Loading classes...</div></AppLayout>;
  }

  if (classes.length === 0) {
    return <AppLayout><ClassOnboarding /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="border-b border-border px-6 py-3 bg-card/50 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Live Chat — {selectedClass?.name || "Select a class"}</h1>
            <p className="text-xs text-muted-foreground">
              {role === "instructor" ? "You can reply and ⭐ star stellar responses" : "All messages are anonymous · updates live"}
            </p>
          </div>
          <ClassSelector />
        </div>

        {/* Search & Category Filter */}
        <div className="border-b border-border px-6 py-3 bg-muted/20 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." className="pl-10 rounded-xl h-8 text-sm" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveCategory(null)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>All</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(activeCategory === c ? null : c)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {(() => {
            const filtered = messages.filter((m) => {
              const matchSearch = !search || m.text.toLowerCase().includes(search.toLowerCase());
              const matchCategory = !activeCategory || m.category === activeCategory;
              return matchSearch && matchCategory;
            });
            if (messages.length === 0) return <p className="text-center text-muted-foreground py-12">No messages yet. Be the first to ask a question!</p>;
            if (filtered.length === 0) return <p className="text-center text-muted-foreground py-12">No messages match your filter.</p>;
            return filtered.map((m) => <ChatMessageBubble key={m.id} message={m} />);
          })()}
          <div ref={bottomRef} />
        </div>

        {/* AI Suggestions Panel */}
        {aiOpen && (
          <div className="border-t border-border bg-muted/30 px-4 py-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">AI Question Refinement</span>
              </div>
              <button onClick={() => { setAiOpen(false); setAiSuggestions([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Pick a refined version to use, or close to keep your original.</p>
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
                {aiSuggestions.length === 0 && !aiLoading && (
                  <p className="text-sm text-muted-foreground text-center py-2">No suggestions generated. Try again.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border p-4 bg-card/50">
          {warning && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-3 text-sm text-foreground animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Academic Integrity Notice</p>
                <p className="text-muted-foreground mt-1">{warning}</p>
              </div>
              <button onClick={() => setWarning(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={role === "instructor" ? "Reply to students..." : "Type your question or thoughts..."}
              className="min-h-[44px] max-h-32 resize-none rounded-xl"
              rows={1}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleAiRefine}
              className="shrink-0 rounded-xl"
              title="Refine with AI — get multiple phrasing options"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => handleSend()} className="shrink-0 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Press Enter to send · Click ✨ to refine your question with AI</p>
        </div>
      </div>
    </AppLayout>
  );
}
