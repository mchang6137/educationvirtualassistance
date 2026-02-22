import { AppLayout } from "@/components/layout/AppLayout";
import { mockInquiryHistory, mockClasses, mockSavedThreads, mockLearningGaps } from "@/data/mockData";
import { CategoryBadge } from "@/components/chat/CategoryBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, History, Bookmark, Brain, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
            <p className="text-sm text-muted-foreground">Private — only you can see this</p>
          </div>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="bg-muted rounded-xl p-1">
            <TabsTrigger value="history" className="rounded-lg gap-2"><History className="h-4 w-4" /> History</TabsTrigger>
            <TabsTrigger value="classes" className="rounded-lg gap-2"><BookOpen className="h-4 w-4" /> Classes</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg gap-2"><Bookmark className="h-4 w-4" /> Saved</TabsTrigger>
            <TabsTrigger value="gaps" className="rounded-lg gap-2"><Brain className="h-4 w-4" /> Learning Gaps</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle>Inquiry History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockInquiryHistory.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      {q.resolved ? <CheckCircle2 className="h-4 w-4 text-eva-green shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.timestamp.toLocaleString()}</p>
                      </div>
                      <CategoryBadge category={q.category} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes">
            <Card>
              <CardHeader><CardTitle>Classes Joined</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClasses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.instructor}</p>
                      </div>
                      <Badge variant="outline">{c.code}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader><CardTitle>Saved Threads</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSavedThreads.map((t) => (
                    <Link key={t.id} to={`/forum/${t.id}`} className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <p className="font-medium text-foreground hover:text-primary">{t.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryBadge category={t.category} />
                        <span className="text-xs text-muted-foreground">{t.upvotes} upvotes · {t.replies.length} replies</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaps">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-eva-purple" /> AI Learning Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLearningGaps.map((g) => (
                    <div key={g.topic} className="p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{g.topic}</span>
                        <span className={`text-sm font-bold ${g.confidence >= 70 ? "text-eva-green" : g.confidence >= 50 ? "text-eva-yellow" : "text-eva-pink"}`}>
                          {g.confidence}% confident
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${g.confidence >= 70 ? "bg-eva-green" : g.confidence >= 50 ? "bg-eva-yellow" : "bg-eva-pink"}`}
                          style={{ width: `${g.confidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{g.suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
