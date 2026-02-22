import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockConfusionData, mockTimelineData, mockCategoryBreakdown } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, TrendingUp, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function Instructor() {
  const [aiMode, setAiMode] = useState(false);
  const total = mockCategoryBreakdown.reduce((s, c) => s + c.count, 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instructor Dashboard</h1>
            <p className="text-sm text-muted-foreground">CS 201 — Real-time classroom analytics</p>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2">
            <Brain className="h-4 w-4 text-eva-purple" />
            <span className="text-sm font-medium text-foreground">AI Teaching Mode</span>
            <Switch checked={aiMode} onCheckedChange={setAiMode} />
          </div>
        </div>

        {aiMode && (
          <div className="bg-eva-purple-light border border-eva-purple/20 rounded-xl p-4 mb-6 animate-fade-in">
            <p className="text-sm text-secondary-foreground">
              <strong>AI Teaching Assistant is active.</strong> The AI will only respond with hints, guiding questions, and references to lecture material — never direct answers.
            </p>
          </div>
        )}

        {/* Confusion Heatmap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Topic Confusion Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockConfusionData.map((d) => (
                <div key={d.topic} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground w-40 shrink-0 flex items-center gap-2">
                    {d.topic}
                    {d.isSpike && <AlertTriangle className="h-3 w-3 text-primary" />}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-eva-pink transition-all duration-700"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground w-12 text-right">{d.percentage}%</span>
                  <span className="text-xs text-muted-foreground w-20">{d.questionCount} questions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Volume Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={mockTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                  <Area type="monotone" dataKey="questions" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={mockCategoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                    {mockCategoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {mockCategoryBreakdown.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.category}</span>
                    <span className="font-medium text-foreground">{Math.round((c.count / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
