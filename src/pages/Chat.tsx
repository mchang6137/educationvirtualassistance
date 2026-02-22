import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { ClassSelector, ClassOnboarding } from "@/components/ClassSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertTriangle, X } from "lucide-react";
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
  user_id: string | null;
}

function ChatMessageBubble({ message }: { message: ChatMsg }) {
  return (
    <div className="animate-fade-in flex flex-col gap-1 items-start">
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.is_ai ? "bg-eva-orange-light border border-primary/20" : "bg-card border border-border"}`}>
        <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
      </div>
      <div className="flex items-center gap-2 px-1">
        <CategoryBadge category={message.category as any} />
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedClass, classes } = useClassContext();
  const { user } = useAuth();

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

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${selectedClass.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `class_id=eq.${selectedClass.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedClass?.id]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedClass || !user) return;

    const cheatCheck = checkAntiCheat(input);
    if (cheatCheck.blocked) {
      setWarning(cheatCheck.hint || null);
      toast({ title: "Message blocked", description: "This looks like an assignment answer request.", variant: "destructive" });
      return;
    }

    const category = categorizeMessage(input);
    const { error } = await supabase.from("chat_messages").insert({
      text: input,
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
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (classes.length === 0) {
    return <AppLayout><ClassOnboarding /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="border-b border-border px-6 py-3 bg-card/50 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Live Chat — {selectedClass?.name || "Select a class"}</h1>
            <p className="text-xs text-muted-foreground">All messages are anonymous</p>
          </div>
          <ClassSelector />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No messages yet. Be the first to ask a question!</p>
          )}
          {messages.map((m) => (
            <ChatMessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>

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
              placeholder="Type your question anonymously..."
              className="min-h-[44px] max-h-32 resize-none rounded-xl"
              rows={1}
            />
            <Button size="icon" onClick={handleSend} className="shrink-0 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </AppLayout>
  );
}
