import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Users, BarChart3, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-eva-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-eva-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Shield className="h-4 w-4" />
          100% Anonymous • AI-Assisted
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
          Ask freely.
          <br />
          <span className="text-primary">Learn boldly.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          EVA is your anonymous AI-powered classroom companion. Ask questions without judgment,
          get help phrasing your thoughts, and engage in meaningful academic discussions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
            <Link to="/chat">
              Start Chatting <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl">
            <Link to="/instructor">
              Instructor Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: MessageSquare,
    title: "Live Anonymous Chat",
    description: "Ask questions in real-time during lectures without anyone knowing it's you.",
    color: "bg-eva-orange-light text-primary",
  },
  {
    icon: Brain,
    title: "AI Question Composer",
    description: "Not sure how to phrase it? AI suggests multiple ways to ask your question.",
    color: "bg-eva-purple-light text-eva-purple",
  },
  {
    icon: Users,
    title: "Anonymous Forum",
    description: "Post discussions, upvote answers, and build knowledge together—anonymously.",
    color: "bg-eva-teal-light text-eva-teal",
  },
  {
    icon: BarChart3,
    title: "Instructor Insights",
    description: "Professors see real-time confusion analytics and can validate correct answers.",
    color: "bg-eva-pink-light text-eva-pink",
  },
];

export function FeatureCards() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Everything you need to learn better
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Built for students who want to participate more and professors who want to understand their class better.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-xl ${f.color} mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
