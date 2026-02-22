import { HeroSection, FeatureCards } from "@/components/landing/HeroSection";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { T } from "@/components/T";

const Index = () => {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">E</div>
            <span className="text-xl font-bold text-foreground">EVA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <Link to="/chat" className="hover:text-foreground transition-colors"><T>Live Chat</T></Link>
              <Link to="/forum" className="hover:text-foreground transition-colors"><T>Forum</T></Link>
            </div>
            {user ? (
              <Button asChild variant="default" className="rounded-xl">
                <Link to={role === "instructor" ? "/instructor" : "/profile"}>
                  <T>{role === "instructor" ? "Instructor Dashboard" : "Student Dashboard"}</T>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default" className="rounded-xl">
                <Link to="/auth"><T>Sign In</T></Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeatureCards />

      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p><T>EVA — Anonymous AI-Assisted Classroom Discussions</T></p>
          <p className="mt-1"><T>Built for students, by students. Ask freely, learn boldly.</T></p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
