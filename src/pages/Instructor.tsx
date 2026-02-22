import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassSelector, ClassOnboarding } from "@/components/ClassSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useClassContext } from "@/hooks/useClassContext";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_COLORS: Record<string, string> = {
  "Concept Clarification": "hsl(260, 60%, 65%)",
  "Example Request": "hsl(174, 60%, 50%)",
  "General Question": "hsl(45, 95%, 60%)",
  "Assignment Help": "hsl(340, 70%, 65%)",
  "Lecture Logistics": "hsl(145, 60%, 45%)",
};

export default function Instructor() {
  const { selectedClass, classes } = useClassContext();
  const [categoryData, setCategoryData] = useState<{ category: string; count: number; color: string }[]>([]);
  const [timelineData, setTimelineData] = useState<{ time: string; questions: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);

    const fetchAnalytics = async () => {
      // Fetch all messages for the class
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("category, created_at")
        .eq("class_id", selectedClass.id)
        .order("created_at", { ascending: true });

      const msgs = messages || [];

      // Category breakdown
      const catCount: Record<string, number> = {};
      msgs.forEach((m) => {
        catCount[m.category] = (catCount[m.category] || 0) + 1;
      });
      setCategoryData(
        Object.entries(catCount).map(([category, count]) => ({
          category,
          count,
          color: CATEGORY_COLORS[category] || "hsl(0, 0%, 60%)",
        }))
      );

      // Timeline (group by hour)
      const hourMap: Record<string, number> = {};
      msgs.forEach((m) => {
        const d = new Date(m.created_at);
        const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
        hourMap[key] = (hourMap[key] || 0) + 1;
      });
      setTimelineData(
        Object.entries(hourMap).map(([time, questions]) => ({ time, questions }))
      );

      setLoading(false);
    };

    fetchAnalytics();
  }, [selectedClass?.id]);

  if (classes.length === 0) {
    return <AppLayout><ClassOnboarding /></AppLayout>;
  }

  const total = categoryData.reduce((s, c) => s + c.count, 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instructor Dashboard</h1>
            <p className="text-sm text-muted-foreground">{selectedClass?.name || "Select a class"} — Real-time classroom analytics</p>
          </div>
          <ClassSelector />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading analytics...</p>
        ) : total === 0 ? (
          <p className="text-center text-muted-foreground py-12">No data yet. Analytics will appear once students start asking questions.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Question Volume Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                    <Area type="monotone" dataKey="questions" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{c.category}</span>
                      <span className="font-medium text-foreground">{total > 0 ? Math.round((c.count / total) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
