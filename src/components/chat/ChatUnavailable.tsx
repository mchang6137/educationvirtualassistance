import { Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ChatUnavailable({ nextClass }: { nextClass: string | null }) {
  const navigate = useNavigate();

  return (
    <div className="border-t border-border p-6 bg-muted/30">
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Live Chat Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This feature is only available during scheduled class time.
          {nextClass && (
            <> Next class: <span className="font-medium text-foreground">{nextClass}</span></>
          )}
        </p>
        <p className="text-xs text-muted-foreground">You can still view past messages above.</p>
        <Button variant="outline" className="rounded-xl gap-2 mt-2" onClick={() => navigate("/forum")}>
          <MessageSquare className="h-4 w-4" /> Go to Forum
        </Button>
      </div>
    </div>
  );
}
