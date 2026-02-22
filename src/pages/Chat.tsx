import { useState, useRef, KeyboardEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockChatMessages, ChatMessage, getAISuggestions, AISuggestion, checkAntiCheat, categorizeMessage } from "@/data/mockData";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`animate-fade-in flex flex-col gap-1 ${message.isAI ? "items-start" : "items-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.isAI ? "bg-eva-orange-light border border-primary/20" : "bg-card border border-border"}`}>
        <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
      </div>
      <div className="flex items-center gap-2 px-1">
        <CategoryBadge category={message.category} />
        <span className="text-[10px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function AIComposerPanel({ suggestions, onSelect, onClose }: { suggestions: AISuggestion[]; onSelect: (text: string) => void; onClose: () => void }) {
  if (suggestions.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition-colors flex items-center justify-between group"
          >
            <span className="flex-1">{s.text}</span>
            <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full ml-2">{s.tone}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const cheatCheck = checkAntiCheat(msg);
    if (cheatCheck.blocked) {
      setWarning(cheatCheck.hint || null);
      toast({ title: "Message blocked", description: "This looks like an assignment answer request.", variant: "destructive" });
      return;
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: msg,
      category: categorizeMessage(msg),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setSuggestions([]);
    setShowComposer(false);
    setWarning(null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleComposer = () => {
    if (input.trim()) {
      setSuggestions(getAISuggestions(input));
      setShowComposer(true);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="border-b border-border px-6 py-3 bg-card/50">
          <h1 className="text-lg font-semibold text-foreground">Live Chat — CS 201</h1>
          <p className="text-xs text-muted-foreground">All messages are anonymous</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

          {showComposer && (
            <AIComposerPanel
              suggestions={suggestions}
              onSelect={(text) => { setInput(text); setShowComposer(false); }}
              onClose={() => setShowComposer(false)}
            />
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
            <Button variant="outline" size="icon" onClick={handleComposer} className="shrink-0 rounded-xl" title="AI Suggestions">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => handleSend()} className="shrink-0 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Press Enter to send · Shift+Enter for new line · Click ✨ for AI help</p>
        </div>
      </div>
    </AppLayout>
  );
}
