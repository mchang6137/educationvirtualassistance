

# EVA - Anonymous AI-Assisted Classroom Discussion Platform

## Overview
EVA is a modern, vibrant classroom discussion platform for college students (18-22). We'll build a frontend-first prototype with mock data, covering all major features: landing page, live chat, forum, instructor dashboard, and student profiles.

## Design System
- **Primary color**: Warm orange (as specified in the style guide)
- **Palette**: Bright, modern colors with pastel contrasting backgrounds
- **Typography**: Clean, academic, modern sans-serif (Inter/system fonts) -- no playful or heavy serif fonts
- **Target audience**: College students 18-22, so the UI will feel fresh, fast, and intuitive with generous whitespace and large touch targets

## Pages and Features

### 1. Landing Page (`/`)
- Hero section with EVA branding and tagline
- Feature cards: Live Chat, AI Question Helper, Anonymous Forum, Instructor Insights
- Call-to-action buttons for students and instructors
- Modern, colorful design with warm orange accents

### 2. Live Chat (`/chat`)
- Real-time-style chat interface with mock messages
- Anonymous message display (no usernames shown)
- AI Question Composer panel: student types a thought, sees 3-5 AI-suggested phrasings with tone labels (formal, casual, direct, etc.)
- Enter sends message, Shift+Enter creates newline
- Message auto-categorization badges (Concept Clarification, Example Request, General Question, Assignment Help, Lecture Logistics)
- Anti-cheating safeguard: if a message looks like "What's the answer to question 3?", show a warning and block it, responding with a hint instead

### 3. Forum (`/forum`)
- List of discussion threads sorted newest to oldest
- Search bar with keyword/tag/category support
- Category and tag filters
- All posts displayed anonymously

### 4. Forum Thread (`/forum/:id`)
- Original post with off-white background
- Replies with slightly tinted backgrounds
- Nested/threaded replies with collapse/expand
- Anonymous upvoting
- Instructor validation badges (checkmark for verified correct answers)
- Create thread form with category dropdown (Concept Clarification, Example, General)

### 5. Instructor Dashboard (`/instructor`)
- Confusion Heatmap: percentage of questions per topic, spike alerts, most repeated question cluster
- Timeline graph of question volume (using Recharts)
- Live category percentage breakdown
- AI Teaching Assistant Mode toggle: AI responds only with hints, questions, and references to lecture material

### 6. Student Profile (`/profile`) - Private
- Inquiry history
- Classes joined
- Saved threads
- Learning gaps summary (mock AI-generated)

## Technical Approach

### File Structure
```
src/
  components/
    layout/
      AppLayout.tsx          -- Main layout with sidebar navigation
      AppSidebar.tsx         -- Sidebar with navigation links
    landing/
      HeroSection.tsx        -- Hero with branding
      FeatureCards.tsx        -- Feature showcase cards
    chat/
      ChatRoom.tsx           -- Main chat container
      ChatMessage.tsx        -- Individual message bubble
      ChatInput.tsx          -- Input with Enter/Shift+Enter handling
      AIComposer.tsx         -- AI question phrasing suggestions
      CategoryBadge.tsx      -- Auto-categorization badge
    forum/
      ForumList.tsx          -- Thread listing
      ForumSearch.tsx        -- Search and filters
      ThreadView.tsx         -- Thread with nested replies
      CreateThreadForm.tsx   -- New thread form
      ReplyItem.tsx          -- Individual reply with nesting
    instructor/
      ConfusionHeatmap.tsx   -- Topic confusion visualization
      TimelineChart.tsx      -- Question volume over time
      CategoryBreakdown.tsx  -- Live category percentages
      AITeachingMode.tsx     -- AI assistant config
    profile/
      InquiryHistory.tsx     -- Past questions
      SavedThreads.tsx       -- Bookmarked threads
      LearningGaps.tsx       -- AI-generated learning summary
  data/
    mockData.ts              -- All mock data for chat, forum, analytics
  pages/
    Index.tsx                -- Landing page
    Chat.tsx                 -- Live chat page
    Forum.tsx                -- Forum listing page
    ForumThread.tsx          -- Individual thread page
    Instructor.tsx           -- Instructor dashboard
    Profile.tsx              -- Student profile
  hooks/
    useChat.ts               -- Chat state management
    useForum.ts              -- Forum state management
```

### Routing
All pages added to `App.tsx` with React Router. Sidebar navigation using the existing Shadcn sidebar component.

### Design Tokens (CSS Variables)
Custom warm orange primary color and pastel accent colors added to `src/index.css`:
- Primary: warm orange (~25 95% 53%)
- Accent colors: pastel purple, teal, pink for category badges and backgrounds
- High readability contrast maintained throughout

### Mock Data
All features will use realistic mock data in `src/data/mockData.ts` including:
- Sample chat messages with categories and timestamps
- Forum threads with nested replies and upvote counts
- Instructor analytics data for charts
- Student profile history

### Anti-Cheating Logic (Frontend Mock)
A simple keyword detection function that checks messages for assignment-related patterns and displays a warning toast instead of sending the message, with a hint response from the AI.

### Charts
Recharts (already installed) used for the instructor dashboard timeline graph and category breakdown visualizations.

## Implementation Sequence
1. Design system (colors, CSS variables, typography)
2. Mock data file
3. Landing page with hero and feature cards
4. App layout with sidebar navigation and routing
5. Live Chat page with AI composer and categorization
6. Forum pages (list, thread, create)
7. Instructor dashboard with charts
8. Student profile page
9. Anti-cheating safeguard logic in chat

