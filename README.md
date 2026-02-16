
#  Smart Tutoring Monitor

**Smart Tutoring Monitor** is a premium, AI-driven platform designed for educators to manage their tutoring sessions, students, and finances with surgical precision. This is a **Vibe Coding** project—built at the speed of thought through a symbiotic collaboration between human creativity and advanced AI agents.

## What does it do?

Smart Tutoring Monitor transforms the chaotic workflow of private tutoring into a streamlined, automated experience:
- **Live Session Tracking**: Real-time timer with background session persistence and lock-screen media controls.
- **AI-Driven Insights**: Deep analysis of student performance and engagement patterns using Gemini AI.
- **Financial Intelligence**: Automatic payment tracking, earnings analytics, and maturity-based due date calculations.
- **Communication Hub**: Log-based history of student/parent interactions and automated dispatching.
- **Mobile Optimized**: A "Single-Page" compact dashboard designed specifically for high-efficiency mobile use.
- **PWA Ready**: Installable on iOS and Android for a native app-like experience.

##  Project Structure

The project follows a modular and scalable architecture:
```text
├── components/          # Polished React UI components (Tailwind CSS)
├── services/            # Core business logic and Supabase integrations
├── supabase/            # Database schema, RLS policies, and migrations
├── utils/               # Helper utilities (Silent Audio, Time Sync, etc.)
├── types.ts             # Centralized TypeScript definitions
├── App.tsx              # Main application orchestrator and routing
└── index.css            # Advanced animations and global design system
```

## How to run it

**Prerequisites:** Node.js (v18+)

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file with your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Launch the Engine**:
   ```bash
   npm run dev
   ```

## 👤 Built By

Developed with ❤️ by **Mahmudul Hasan Mridul**. 

*This project is a testament to the power of "Vibe Coding"—where the focus is on the flow, the design, and the ultimate user experience.*

---