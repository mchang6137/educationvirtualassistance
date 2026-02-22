import { MessageCategory } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

const categoryStyles: Record<MessageCategory, string> = {
  "Concept Clarification": "bg-eva-purple-light text-secondary-foreground border-eva-purple/30",
  "Example Request": "bg-eva-teal-light text-accent-foreground border-eva-teal/30",
  "General Question": "bg-eva-yellow-light text-foreground border-eva-yellow/30",
  "Assignment Help": "bg-eva-pink-light text-foreground border-eva-pink/30",
  "Lecture Logistics": "bg-eva-green-light text-foreground border-eva-green/30",
  "Study Sessions": "bg-blue-100 dark:bg-blue-900/30 text-foreground border-blue-300/30",
};

export function CategoryBadge({ category }: { category: MessageCategory }) {
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${categoryStyles[category]}`}>
      {category}
    </Badge>
  );
}
