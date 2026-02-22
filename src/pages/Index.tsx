import { HeroSection, FeatureCards } from "@/components/landing/HeroSection";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">E</div>
            <span className="text-xl font-bold text-foreground">EVA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/chat" className="hover:text-foreground transition-colors">Live Chat</Link>
            <Link to="/forum" className="hover:text-foreground transition-colors">Forum</Link>
            <Link to="/instructor" className="hover:text-foreground transition-colors">Instructor</Link>
            <Link to="/profile" className="hover:text-foreground transition-colors">Profile</Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeatureCards />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>EVA — Anonymous AI-Assisted Classroom Discussions</p>
          <p className="mt-1">Built for students, by students. Ask freely, learn boldly.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
