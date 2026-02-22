# EVA — Anonymous AI-Assisted Classroom Discussion Platform

EVA is a modern, real-time classroom discussion platform designed for college students and instructors. It prioritizes **anonymity**, **pedagogy**, and **academic integrity** while leveraging AI to help students ask better questions.

## Features

- **Anonymous Live Chat** — Real-time class discussion where all messages are anonymous, with auto-categorization (Concept Clarification, Example Request, Assignment Help, etc.)
- **AI Question Refinement** — Students type a rough question and get multiple AI-suggested phrasings with tone labels to choose from
- **Anti-Cheating Safeguard** — Messages that look like assignment answer requests are blocked with a warning and helpful hint
- **Discussion Forum** — Threaded, anonymous forum with upvoting, nested replies, instructor-validated answers, and search/filter
- **Instructor Dashboard** — Real-time analytics including question volume timeline, category breakdown, and confusion heatmaps
- **Slide Presentations** — Instructors can upload and present slides with a synced student viewer
- **Multi-Language Support** — Full UI translation and text-to-speech in the student's chosen language
- **Adjustable Text-to-Speech** — Students can listen to messages read aloud at a custom speed
- **Class Management** — Create classes, join via code, and schedule chat availability windows

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — authentication, database, edge functions, file storage
- **Charts**: Recharts
- **AI**: Lovable AI for question refinement

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## License

This project is proprietary.
