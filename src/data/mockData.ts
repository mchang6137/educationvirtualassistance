// ── Chat Messages ──
export type MessageCategory =
  | "Concept Clarification"
  | "Example Request"
  | "General Question"
  | "Assignment Help"
  | "Lecture Logistics"
  | "Study Sessions";

export interface ChatMessage {
  id: string;
  text: string;
  category: MessageCategory;
  timestamp: Date;
  isAI?: boolean;
}

export const mockChatMessages: ChatMessage[] = [
  { id: "1", text: "Can someone explain the difference between stack and heap memory allocation?", category: "Concept Clarification", timestamp: new Date("2026-02-22T09:05:00") },
  { id: "2", text: "Could you show a real-world example of polymorphism in Java?", category: "Example Request", timestamp: new Date("2026-02-22T09:06:30") },
  { id: "3", text: "When is the midterm review session happening?", category: "Lecture Logistics", timestamp: new Date("2026-02-22T09:07:00") },
  { id: "4", text: "I'm confused about how recursion handles the base case—can we walk through it?", category: "Concept Clarification", timestamp: new Date("2026-02-22T09:08:15") },
  { id: "5", text: "Is the homework due Friday or Monday?", category: "Assignment Help", timestamp: new Date("2026-02-22T09:09:00") },
  { id: "6", text: "What's the practical use of Big-O notation outside of class?", category: "General Question", timestamp: new Date("2026-02-22T09:10:30") },
  { id: "7", text: "Can we see an example of a linked list vs array for insertion performance?", category: "Example Request", timestamp: new Date("2026-02-22T09:12:00") },
  { id: "8", text: "How does garbage collection work in managed languages?", category: "Concept Clarification", timestamp: new Date("2026-02-22T09:14:00") },
];

// ── AI Composer Suggestions ──
export interface AISuggestion {
  text: string;
  tone: "Formal" | "Casual" | "Direct" | "Curious" | "Detailed";
}

export function getAISuggestions(input: string): AISuggestion[] {
  if (!input.trim()) return [];
  return [
    { text: `Could you please elaborate on ${input.toLowerCase()}?`, tone: "Formal" },
    { text: `Hey, can someone break down ${input.toLowerCase()} for me?`, tone: "Casual" },
    { text: `Explain ${input.toLowerCase()}.`, tone: "Direct" },
    { text: `I'm curious about ${input.toLowerCase()}—what's the key idea?`, tone: "Curious" },
    { text: `Could you walk through ${input.toLowerCase()} step by step with an example?`, tone: "Detailed" },
  ];
}

// ── Anti-Cheat ──
const CHEAT_PATTERNS = [
  /what(?:'s| is) the answer/i,
  /give me the (?:answer|solution)/i,
  /answer to (?:question|problem|#)\s*\d/i,
  /just tell me (?:the )?answer/i,
  /copy (?:my|the) (?:code|solution)/i,
];

export function checkAntiCheat(message: string): { blocked: boolean; hint?: string } {
  const isCheat = CHEAT_PATTERNS.some((p) => p.test(message));
  if (isCheat) {
    return {
      blocked: true,
      hint: "It looks like you're asking for a direct answer. Try rephrasing your question to focus on the concept—e.g., 'How does this algorithm handle edge cases?' EVA is here to help you learn, not give answers!",
    };
  }
  return { blocked: false };
}

// ── Auto-categorization ──
export function categorizeMessage(text: string): MessageCategory {
  const lower = text.toLowerCase();
  if (/explain|difference|how does|what is|concept|understand/i.test(lower)) return "Concept Clarification";
  if (/example|show me|demonstrate|walk through/i.test(lower)) return "Example Request";
  if (/homework|assignment|due|submit|grade/i.test(lower)) return "Assignment Help";
  if (/when|where|schedule|lecture|class time|office hours/i.test(lower)) return "Lecture Logistics";
  return "General Question";
}

// ── Forum ──
export interface ForumReply {
  id: string;
  text: string;
  timestamp: Date;
  upvotes: number;
  isInstructorValidated?: boolean;
  replies?: ForumReply[];
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  category: MessageCategory;
  tags: string[];
  timestamp: Date;
  upvotes: number;
  replies: ForumReply[];
}

export const mockForumThreads: ForumThread[] = [
  {
    id: "t1",
    title: "How does dynamic programming differ from divide-and-conquer?",
    body: "I keep mixing up these two strategies. Both seem to break problems into subproblems, but the approach feels different. Can anyone clarify the key distinction and when to use each?",
    category: "Concept Clarification",
    tags: ["algorithms", "dynamic-programming"],
    timestamp: new Date("2026-02-21T14:30:00"),
    upvotes: 24,
    replies: [
      {
        id: "r1",
        text: "The key difference is overlapping subproblems. DP stores results to avoid recomputation (memoization), while divide-and-conquer doesn't because subproblems are independent.",
        timestamp: new Date("2026-02-21T14:45:00"),
        upvotes: 18,
        isInstructorValidated: true,
        replies: [
          { id: "r1a", text: "Great explanation! So Fibonacci is DP because fib(3) is needed by both fib(4) and fib(5)?", timestamp: new Date("2026-02-21T15:00:00"), upvotes: 7 },
        ],
      },
      { id: "r2", text: "Think of merge sort (divide-and-conquer) vs. shortest path (DP). Merge sort splits independently, shortest path reuses sub-paths.", timestamp: new Date("2026-02-21T15:10:00"), upvotes: 12 },
    ],
  },
  {
    id: "t2",
    title: "Can someone show a real example of the Observer pattern?",
    body: "The textbook definition is abstract. I'd love to see a concrete implementation—maybe a notification system or event handler—to really understand how Observer works.",
    category: "Example Request",
    tags: ["design-patterns", "observer"],
    timestamp: new Date("2026-02-20T10:00:00"),
    upvotes: 15,
    replies: [
      { id: "r3", text: "Think of YouTube subscriptions: you subscribe to a channel (subject), and get notified (observer) when a new video drops. The channel doesn't need to know who's watching.", timestamp: new Date("2026-02-20T10:30:00"), upvotes: 21, isInstructorValidated: true },
    ],
  },
  {
    id: "t3",
    title: "When is the best time to use a hash map vs. a balanced BST?",
    body: "Both give fast lookups, but I'm unsure when one is clearly better than the other. What are the trade-offs?",
    category: "General Question",
    tags: ["data-structures", "hash-map", "BST"],
    timestamp: new Date("2026-02-19T16:00:00"),
    upvotes: 19,
    replies: [
      { id: "r4", text: "Hash maps give O(1) average lookup but no ordering. BSTs give O(log n) but keep elements sorted. Use BST when you need range queries or sorted iteration.", timestamp: new Date("2026-02-19T16:20:00"), upvotes: 14 },
      { id: "r5", text: "Also consider worst-case: hash map can degrade to O(n) with bad hash functions, BST is always O(log n) if balanced.", timestamp: new Date("2026-02-19T16:45:00"), upvotes: 9 },
    ],
  },
  {
    id: "t4",
    title: "Midterm study group—who's in?",
    body: "Thinking of organizing a study session this Thursday at 7 PM in the library. We can go over lecture slides and practice problems together.",
    category: "Lecture Logistics",
    tags: ["midterm", "study-group"],
    timestamp: new Date("2026-02-18T20:00:00"),
    upvotes: 31,
    replies: [
      { id: "r6", text: "Count me in! Should we focus on chapters 4-6 or go broader?", timestamp: new Date("2026-02-18T20:15:00"), upvotes: 5 },
      { id: "r7", text: "I'll bring my notes from the recursion and sorting lectures!", timestamp: new Date("2026-02-18T20:30:00"), upvotes: 8 },
    ],
  },
];

// ── Instructor Analytics ──
export interface TopicConfusion {
  topic: string;
  percentage: number;
  questionCount: number;
  isSpike?: boolean;
}

export const mockConfusionData: TopicConfusion[] = [
  { topic: "Recursion", percentage: 35, questionCount: 42, isSpike: true },
  { topic: "Pointers & Memory", percentage: 28, questionCount: 33 },
  { topic: "Big-O Notation", percentage: 18, questionCount: 22 },
  { topic: "Sorting Algorithms", percentage: 12, questionCount: 15 },
  { topic: "OOP Concepts", percentage: 7, questionCount: 8 },
];

export interface TimelinePoint {
  time: string;
  questions: number;
}

export const mockTimelineData: TimelinePoint[] = [
  { time: "9:00", questions: 2 },
  { time: "9:10", questions: 5 },
  { time: "9:20", questions: 12 },
  { time: "9:30", questions: 8 },
  { time: "9:40", questions: 15 },
  { time: "9:50", questions: 22 },
  { time: "10:00", questions: 18 },
  { time: "10:10", questions: 10 },
  { time: "10:20", questions: 7 },
  { time: "10:30", questions: 4 },
];

export interface CategoryBreakdown {
  category: MessageCategory;
  count: number;
  color: string;
}

export const mockCategoryBreakdown: CategoryBreakdown[] = [
  { category: "Concept Clarification", count: 42, color: "hsl(var(--eva-purple))" },
  { category: "Example Request", count: 28, color: "hsl(var(--eva-teal))" },
  { category: "General Question", count: 18, color: "hsl(var(--eva-yellow))" },
  { category: "Assignment Help", count: 8, color: "hsl(var(--eva-pink))" },
  { category: "Lecture Logistics", count: 4, color: "hsl(var(--eva-green))" },
];

// ── Student Profile ──
export interface InquiryRecord {
  id: string;
  question: string;
  category: MessageCategory;
  timestamp: Date;
  resolved: boolean;
}

export const mockInquiryHistory: InquiryRecord[] = [
  { id: "i1", question: "How does recursion handle the base case?", category: "Concept Clarification", timestamp: new Date("2026-02-22T09:08:00"), resolved: true },
  { id: "i2", question: "Can we see an example of polymorphism?", category: "Example Request", timestamp: new Date("2026-02-21T14:00:00"), resolved: true },
  { id: "i3", question: "What's Big-O of binary search?", category: "General Question", timestamp: new Date("2026-02-20T11:00:00"), resolved: false },
  { id: "i4", question: "When is the midterm?", category: "Lecture Logistics", timestamp: new Date("2026-02-19T09:00:00"), resolved: true },
];

export interface JoinedClass {
  id: string;
  name: string;
  instructor: string;
  code: string;
}

export const mockClasses: JoinedClass[] = [
  { id: "c1", name: "CS 201 - Data Structures", instructor: "Dr. Patel", code: "CS201-F26" },
  { id: "c2", name: "CS 301 - Algorithms", instructor: "Prof. Chen", code: "CS301-F26" },
  { id: "c3", name: "CS 150 - Intro to Programming", instructor: "Dr. Kim", code: "CS150-F26" },
];

export const mockLearningGaps = [
  { topic: "Recursion & Base Cases", confidence: 45, suggestion: "Review lecture 7 slides and try the practice problems on recursive tree traversal." },
  { topic: "Pointer Arithmetic", confidence: 30, suggestion: "Watch the supplemental video on memory models and complete lab 4 exercises." },
  { topic: "Time Complexity Analysis", confidence: 60, suggestion: "You're getting there! Practice analyzing nested loops and recursive functions." },
  { topic: "Graph Algorithms", confidence: 75, suggestion: "Strong foundation—try the bonus challenge on Dijkstra's algorithm variations." },
];

export const mockSavedThreads = mockForumThreads.slice(0, 2);
