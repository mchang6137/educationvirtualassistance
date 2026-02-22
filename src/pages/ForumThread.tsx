import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
}

function ReplyItem({ reply, depth = 0, childReplies, userId, onUpvote }: {
  reply: ReplyRow; depth?: number;
  childReplies: Record<string, ReplyRow[]>;
  userId?: string;
  onUpvote: (replyId: string) => void;
}) {
  const children = childReplies[reply.id] || [];

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
      <div className={`rounded-xl p-4 ${depth === 0 ? "bg-accent/30" : "bg-muted/30"} ${reply.is_instructor_validated ? "ring-1 ring-eva-green/40" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => onUpvote(reply.id)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
              <ArrowUp className="h-4 w-4" />
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
            </div>
          </div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((r) => (
            <ReplyItem key={r.id} reply={r} depth={depth + 1} childReplies={childReplies} userId={userId} onUpvote={onUpvote} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForumThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchThread = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("forum_threads")
      .select("id, title, body, category, tags, created_at, upvotes")
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

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [id]);

  const handleUpvoteThread = async () => {
    if (!thread || !user) return;
    const { error } = await supabase.from("thread_upvotes").insert({ thread_id: thread.id, user_id: user.id });
    if (!error) {
      await supabase.from("forum_threads").update({ upvotes: thread.upvotes + 1 }).eq("id", thread.id);
      setThread({ ...thread, upvotes: thread.upvotes + 1 });
    }
  };

  const handleUpvoteReply = async (replyId: string) => {
    if (!user) return;
    const reply = replies.find((r) => r.id === replyId);
    if (!reply) return;
    const { error } = await supabase.from("reply_upvotes").insert({ reply_id: replyId, user_id: user.id });
    if (!error) {
      await supabase.from("forum_replies").update({ upvotes: reply.upvotes + 1 }).eq("id", replyId);
      setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !id || !user) return;
    setSending(true);
    const { error } = await supabase.from("forum_replies").insert({
      text: replyText,
      thread_id: id,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      setReplyText("");
      fetchReplies();
    }
    setSending(false);
  };

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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Forum
        </Link>

        <div className="bg-eva-orange-light/30 rounded-2xl p-6 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleUpvoteThread} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                <ArrowUp className="h-5 w-5" />
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
            <ReplyItem key={r.id} reply={r} childReplies={childReplies} userId={user?.id} onUpvote={handleUpvoteReply} />
          ))}
          {replies.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No replies yet. Be the first to respond!</p>}
        </div>

        <div className="mt-8 bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Add a reply (anonymous)</h3>
          <div className="flex gap-2">
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Share your thoughts..." className="rounded-xl min-h-[44px] resize-none" rows={2} />
            <Button size="icon" className="shrink-0 rounded-xl self-end" onClick={handleReply} disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
