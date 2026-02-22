import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockForumThreads, ForumReply } from "@/data/mockData";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Send } from "lucide-react";

function ReplyItem({ reply, depth = 0 }: { reply: ForumReply; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const [upvotes, setUpvotes] = useState(reply.upvotes);
  const [voted, setVoted] = useState(false);

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
      <div className={`rounded-xl p-4 ${depth === 0 ? "bg-eva-teal-light/30" : "bg-muted/30"} ${reply.isInstructorValidated ? "ring-1 ring-eva-green/40" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => { if (!voted) { setUpvotes(upvotes + 1); setVoted(true); } }}
              className={`p-1 rounded hover:bg-muted transition-colors ${voted ? "text-primary" : "text-muted-foreground"}`}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">{upvotes}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">{reply.text}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{reply.timestamp.toLocaleString()}</span>
              {reply.isInstructorValidated && (
                <span className="flex items-center gap-1 text-eva-green font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Instructor Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setCollapsed(!collapsed)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 ml-2">
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {reply.replies.length} {reply.replies.length === 1 ? "reply" : "replies"}
          </button>
          {!collapsed && reply.replies.map((r) => <ReplyItem key={r.id} reply={r} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function ForumThread() {
  const { id } = useParams();
  const thread = mockForumThreads.find((t) => t.id === id);
  const [replyText, setReplyText] = useState("");
  const [upvotes, setUpvotes] = useState(thread?.upvotes || 0);
  const [voted, setVoted] = useState(false);

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

        {/* Original post */}
        <div className="bg-eva-orange-light/30 rounded-2xl p-6 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => { if (!voted) { setUpvotes(upvotes + 1); setVoted(true); } }}
                className={`p-1 rounded hover:bg-muted transition-colors ${voted ? "text-primary" : "text-muted-foreground"}`}
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold text-muted-foreground">{upvotes}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground mb-2">{thread.title}</h1>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{thread.body}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={thread.category} />
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">{thread.timestamp.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{thread.replies.length} Replies</h2>
          {thread.replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}
        </div>

        {/* Reply input */}
        <div className="mt-8 bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Add a reply (anonymous)</h3>
          <div className="flex gap-2">
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Share your thoughts..." className="rounded-xl min-h-[44px] resize-none" rows={2} />
            <Button size="icon" className="shrink-0 rounded-xl self-end" onClick={() => setReplyText("")}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
