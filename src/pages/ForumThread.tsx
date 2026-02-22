import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowLeft, CheckCircle2, Send, Reply, Bell, BellOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useChatAvailability } from "@/hooks/useChatAvailability";
import { cn } from "@/lib/utils";

interface ReplyRow {
  id: string;
  text: string;
  created_at: string;
  upvotes: number;
  is_instructor_validated: boolean;
  parent_reply_id: string | null;
  user_id: string | null;
}

interface ThreadData {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[] | null;
  created_at: string;
  upvotes: number;
  class_id: string;
}

function ReplyItem({ reply, depth = 0, childReplies, userId, upvotedIds, onUpvote, onReplyTo }: {
  reply: ReplyRow; depth?: number;
  childReplies: Record<string, ReplyRow[]>;
  userId?: string;
  upvotedIds: Set<string>;
  onUpvote: (replyId: string) => void;
  onReplyTo: (replyId: string) => void;
}) {
  const children = childReplies[reply.id] || [];
  const hasUpvoted = upvotedIds.has(reply.id);

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
      <div className={`rounded-xl p-4 ${depth === 0 ? "bg-accent/30" : "bg-muted/30"} ${reply.is_instructor_validated ? "ring-1 ring-eva-green/40" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => onUpvote(reply.id)} className={cn("p-1 rounded hover:bg-muted transition-colors", hasUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary")}>
              <ArrowUp className={cn("h-4 w-4", hasUpvoted && "fill-current")} />
            </button>
            <span className="text-xs font-medium text-muted-foreground">{reply.upvotes}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">{reply.text}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{new Date(reply.created_at).toLocaleString()}</span>
              {reply.is_instructor_validated && (
                <span className="flex items-center gap-1 text-eva-green font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Instructor Verified
                </span>
              )}
              <button onClick={() => onReplyTo(reply.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Reply className="h-3 w-3" /> Reply
              </button>
            </div>
          </div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((r) => (
            <ReplyItem key={r.id} reply={r} depth={depth + 1} childReplies={childReplies} userId={userId} upvotedIds={upvotedIds} onUpvote={onUpvote} onReplyTo={onReplyTo} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForumThread() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadUpvoted, setThreadUpvoted] = useState(false);
  const [replyUpvotedIds, setReplyUpvotedIds] = useState<Set<string>>(new Set());
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const { available: classActive, nextClass } = useChatAvailability(thread?.class_id);

  const fetchThread = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("forum_threads")
      .select("id, title, body, category, tags, created_at, upvotes, class_id")
      .eq("id", id)
      .maybeSingle();
    setThread(data);
  };

  const fetchReplies = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });
    setReplies(data || []);
    setLoading(false);
  };

  // Fetch user's existing upvotes & subscription
  const fetchUserState = async () => {
    if (!id || !user) return;
    const [threadUpRes, replyUpRes, subRes] = await Promise.all([
      supabase.from("thread_upvotes").select("id").eq("thread_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("reply_upvotes").select("reply_id").eq("user_id", user.id),
      supabase.from("thread_subscriptions").select("id").eq("thread_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    setThreadUpvoted(!!threadUpRes.data);

    const replyIds = new Set<string>();
    (replyUpRes.data || []).forEach((r: any) => replyIds.add(r.reply_id));
    setReplyUpvotedIds(replyIds);

    setSubscribed(!!subRes.data);
  };

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [id]);

  useEffect(() => {
    fetchUserState();
  }, [id, user?.id]);

  // Realtime replies
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`thread-replies-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_replies", filter: `thread_id=eq.${id}` }, () => {
        fetchReplies();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleUpvoteThread = async () => {
    if (!thread || !user) return;
    if (threadUpvoted) {
      // Undo upvote
      await supabase.from("thread_upvotes").delete().eq("thread_id", thread.id).eq("user_id", user.id);
      await supabase.from("forum_threads").update({ upvotes: Math.max(0, thread.upvotes - 1) }).eq("id", thread.id);
      setThread({ ...thread, upvotes: Math.max(0, thread.upvotes - 1) });
      setThreadUpvoted(false);
    } else {
      const { error } = await supabase.from("thread_upvotes").insert({ thread_id: thread.id, user_id: user.id });
      if (!error) {
        await supabase.from("forum_threads").update({ upvotes: thread.upvotes + 1 }).eq("id", thread.id);
        setThread({ ...thread, upvotes: thread.upvotes + 1 });
        setThreadUpvoted(true);
      }
    }
  };

  const handleUpvoteReply = async (replyId: string) => {
    if (!user) return;
    const reply = replies.find((r) => r.id === replyId);
    if (!reply) return;

    if (replyUpvotedIds.has(replyId)) {
      // Undo
      await supabase.from("reply_upvotes").delete().eq("reply_id", replyId).eq("user_id", user.id);
      await supabase.from("forum_replies").update({ upvotes: Math.max(0, reply.upvotes - 1) }).eq("id", replyId);
      setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, upvotes: Math.max(0, r.upvotes - 1) } : r));
      setReplyUpvotedIds((prev) => { const n = new Set(prev); n.delete(replyId); return n; });
    } else {
      const { error } = await supabase.from("reply_upvotes").insert({ reply_id: replyId, user_id: user.id });
      if (!error) {
        await supabase.from("forum_replies").update({ upvotes: reply.upvotes + 1 }).eq("id", replyId);
        setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r));
        setReplyUpvotedIds((prev) => new Set(prev).add(replyId));
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !id || !user) return;
    setSending(true);
    const { error } = await supabase.from("forum_replies").insert({
      text: replyText,
      thread_id: id,
      user_id: user.id,
      parent_reply_id: replyingTo || null,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      setReplyText("");
      setReplyingTo(null);
      fetchReplies();
    }
    setSending(false);
  };

  const handleToggleSubscription = async () => {
    if (!id || !user) return;
    setSubLoading(true);
    if (subscribed) {
      await supabase.from("thread_subscriptions").delete().eq("thread_id", id).eq("user_id", user.id);
      setSubscribed(false);
      toast({ title: "Unsubscribed", description: "You'll no longer get notifications for this thread." });
    } else {
      const { error } = await supabase.from("thread_subscriptions").insert({ thread_id: id, user_id: user.id });
      if (!error) {
        setSubscribed(true);
        toast({ title: "Subscribed!", description: "You'll be notified when this thread is updated." });
      }
    }
    setSubLoading(false);
  };

  const replyingToReply = replyingTo ? replies.find(r => r.id === replyingTo) : null;

  // Build nested reply structure
  const topLevelReplies = replies.filter((r) => !r.parent_reply_id);
  const childReplies: Record<string, ReplyRow[]> = {};
  replies.forEach((r) => {
    if (r.parent_reply_id) {
      if (!childReplies[r.parent_reply_id]) childReplies[r.parent_reply_id] = [];
      childReplies[r.parent_reply_id].push(r);
    }
  });

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center h-96"><div className="h-10 w-10 rounded-xl bg-primary/20 animate-pulse" /></div></AppLayout>;
  }

  if (!thread) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p className="text-lg">Thread not found</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/forum">Back to Forum</Link></Button>
        </div>
      </AppLayout>
    );
  }

  // Block instructors from viewing Study Sessions threads
  if (role === "instructor" && thread.category === "Study Sessions") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p className="text-lg">This thread is student-only</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/forum">Back to Forum</Link></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Forum
          </Link>
          <Button
            variant={subscribed ? "default" : "outline"}
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleToggleSubscription}
            disabled={subLoading}
          >
            {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {subscribed ? "Unsubscribe" : "Notify me"}
          </Button>
        </div>

        <div className="bg-eva-orange-light/30 rounded-2xl p-6 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleUpvoteThread} className={cn("p-1 rounded hover:bg-muted transition-colors", threadUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <ArrowUp className={cn("h-5 w-5", threadUpvoted && "fill-current")} />
              </button>
              <span className="text-sm font-bold text-muted-foreground">{thread.upvotes}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground mb-2">{thread.title}</h1>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{thread.body}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={thread.category as any} />
                {(thread.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(thread.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{replies.length} Replies</h2>
          {topLevelReplies.map((r) => (
            <ReplyItem key={r.id} reply={r} childReplies={childReplies} userId={user?.id} upvotedIds={replyUpvotedIds} onUpvote={handleUpvoteReply} onReplyTo={setReplyingTo} />
          ))}
          {replies.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No replies yet. Be the first to respond!</p>}
        </div>

        {!classActive ? (
          <div className="mt-8 bg-muted/30 border border-border rounded-xl p-6">
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Replies are only available during an active class session</p>
              {nextClass && (
                <p className="text-xs text-muted-foreground">
                  Next class: <span className="font-medium text-foreground">{nextClass}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-card border border-border rounded-xl p-4">
            {replyingToReply && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Reply className="h-3 w-3" />
                <span>Replying to: <span className="text-foreground">{replyingToReply.text.slice(0, 60)}...</span></span>
                <button onClick={() => setReplyingTo(null)} className="ml-auto hover:text-foreground">✕</button>
              </div>
            )}
            <h3 className="text-sm font-medium text-foreground mb-3">
              {replyingTo ? "Reply to comment (anonymous)" : "Add a reply (anonymous)"}
            </h3>
            <div className="flex gap-2">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Share your thoughts..." className="rounded-xl min-h-[44px] resize-none" rows={2} />
              <Button size="icon" className="shrink-0 rounded-xl self-end" onClick={handleReply} disabled={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
