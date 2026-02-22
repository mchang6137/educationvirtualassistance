import { useState, useEffect } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { Star, SmilePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  text: string;
  category: string;
  created_at: string;
  is_ai: boolean;
  is_starred: boolean;
  user_id: string | null;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

const EMOJI_OPTIONS = ["👍", "❤️", "🔥", "💡", "👏", "😂", "🤔", "✅"];

export function ChatMessageBubble({ message }: { message: ChatMsg }) {
  const { user, role } = useAuth();
  const [starred, setStarred] = useState(message.is_starred);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    setStarred(message.is_starred);
  }, [message.is_starred]);

  // Fetch reactions for this message
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("chat_reactions")
        .select("emoji, user_id")
        .eq("message_id", message.id);
      if (!data) return;

      const map = new Map<string, { count: number; reacted: boolean }>();
      for (const r of data) {
        const existing = map.get(r.emoji) || { count: 0, reacted: false };
        existing.count++;
        if (r.user_id === user?.id) existing.reacted = true;
        map.set(r.emoji, existing);
      }
      setReactions(Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v })));
    };
    fetch();
  }, [message.id, user?.id]);

  // Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${message.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions", filter: `message_id=eq.${message.id}` }, () => {
        // Refetch on any change
        supabase
          .from("chat_reactions")
          .select("emoji, user_id")
          .eq("message_id", message.id)
          .then(({ data }) => {
            if (!data) return;
            const map = new Map<string, { count: number; reacted: boolean }>();
            for (const r of data) {
              const existing = map.get(r.emoji) || { count: 0, reacted: false };
              existing.count++;
              if (r.user_id === user?.id) existing.reacted = true;
              map.set(r.emoji, existing);
            }
            setReactions(Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v })));
          });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [message.id, user?.id]);

  const toggleStar = async () => {
    const next = !starred;
    setStarred(next);
    await supabase.from("chat_messages").update({ is_starred: next }).eq("id", message.id);
  };

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.emoji === emoji && r.reacted);
    if (existing) {
      await supabase.from("chat_reactions").delete().eq("message_id", message.id).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("chat_reactions").insert({ message_id: message.id, user_id: user.id, emoji });
    }
    setEmojiOpen(false);
  };

  const isInstructor = role === "instructor";

  return (
    <div className="animate-fade-in flex flex-col gap-1 items-start group">
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 relative",
        message.is_ai ? "bg-eva-orange-light border border-primary/20" : "bg-card border border-border",
        starred && "ring-2 ring-yellow-400/60"
      )}>
        <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
        {starred && (
          <Star className="absolute -top-2 -right-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
        )}
      </div>

      <div className="flex items-center gap-2 px-1 flex-wrap">
        <CategoryBadge category={message.category as any} />
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        {/* Reaction pills */}
        {reactions.map(r => (
          <button
            key={r.emoji}
            onClick={() => toggleReaction(r.emoji)}
            className={cn(
              "inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors",
              r.reacted ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border hover:border-primary/30"
            )}
          >
            <span>{r.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{r.count}</span>
          </button>
        ))}

        {/* Action buttons - visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <SmilePlus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => toggleReaction(e)} className="text-lg hover:scale-125 transition-transform p-0.5">
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {isInstructor && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={toggleStar} title="Star this response">
              <Star className={cn("h-3 w-3", starred ? "fill-yellow-400 text-yellow-400" : "")} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
