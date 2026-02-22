import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockForumThreads, ForumThread, MessageCategory } from "@/data/mockData";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUp, MessageSquare, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const categories: MessageCategory[] = ["Concept Clarification", "Example Request", "General Question", "Assignment Help", "Lecture Logistics"];

export default function Forum() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MessageCategory | null>(null);

  const filtered = mockForumThreads.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !activeCategory || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Discussion Forum</h1>
            <p className="text-sm text-muted-foreground">All posts are anonymous</p>
          </div>
          <Button className="rounded-xl" asChild>
            <Link to="/forum/new"><Plus className="h-4 w-4 mr-2" /> New Thread</Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads, tags, or keywords..." className="pl-10 rounded-xl" />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="space-y-3">
          {filtered.map((t) => (
            <Link key={t.id} to={`/forum/${t.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <CategoryBadge category={t.category} />
                      {t.tags.map((tag) => (
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
                  <span>{t.timestamp.toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.replies.length} replies</span>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No threads found.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
