# AI Interview Simulator 🎯

Bachelor's Thesis Project - A zero-cost AI-powered technical interview simulator that helps candidates practice their interview skills.

## 🌟 Features

- **Resume Analysis**: Upload your PDF resume and get it analyzed by AI
- **Personalized Questions**: AI interviewer asks questions tailored to your experience
- **Zero-Cost Architecture**: Uses free tier APIs with intelligent fallback mechanisms
- **Real-time Chat**: Smooth conversational experience with streaming responses
- **Senior Tech Lead Persona**: Professional interviewer that asks ONE question at a time
- **Apple-like Design**: Clean, modern UI built with Shadcn/UI

## 🏗️ Architecture

### Zero-Cost Resilience Pattern

The application implements a **Hybrid Fallback Pattern** to maximize free tier usage:

1. **Primary (Fast)**: Groq API with `llama-3.3-70b-versatile`
   - Ultra-fast responses
   - Free tier with generous limits

2. **Fallback (Reliable)**: Google Gemini API with `gemini-1.5-flash`
   - Automatically activated on Groq rate limits (429 errors)
   - Higher rate limits on free tier
   - Used for resume analysis

### Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **AI SDK**: Vercel AI SDK (with streaming support)
- **PDF Parsing**: pdf-parse (server-side)
- **Evaluation**: promptfoo (for prompt quality testing)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Free API keys from:
  - [Groq](https://console.groq.com/keys)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   cd ai-interview-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

1. **Upload Resume**: Drag and drop your PDF resume or click to select
2. **Wait for Analysis**: The AI will parse and structure your resume
3. **Start Interview**: Chat with the AI Senior Tech Lead
4. **Answer Questions**: Type your responses naturally
5. **Get Feedback**: Receive follow-up questions based on your answers

## 🧪 Testing Prompts (Thesis Evaluation)

The project includes automated prompt quality testing using promptfoo.

### Run Prompt Tests

```bash
npm run test:prompts
```

This tests:
- ✅ Character consistency (stays in Senior Tech Lead persona)
- ✅ One question at a time rule
- ✅ Technical question relevance
- ✅ Professional tone maintenance
- ✅ No AI acknowledgment

### View Test Results

```bash
npm run test:prompts:view
```

Opens an interactive dashboard showing test results and comparisons.

## 📁 Project Structure

```
ai-interview-simulator/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API with fallback logic
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main application page
├── components/
│   ├── ui/                        # Shadcn UI components
│   ├── ChatInterface.tsx          # Chat UI with streaming
│   └── ResumeUpload.tsx           # Drag-and-drop upload
├── lib/
│   ├── actions/
│   │   └── resume.ts              # Server Action for PDF parsing
│   ├── prompts.ts                 # System prompt generation
│   └── utils.ts
├── types/
│   └── resume.ts                  # TypeScript interfaces
├── CLAUDE.md                      # Project guidelines
├── promptfooconfig.yaml           # Prompt testing configuration
├── .env.local.example             # Environment template
└── README.md
```

## 🎓 Academic Context

This project demonstrates:

1. **Hybrid AI Architecture**: Intelligent provider switching for cost optimization
2. **Prompt Engineering**: Consistent persona maintenance across conversations
3. **Real-time Processing**: Server Actions + Streaming for optimal UX
4. **Evaluation Methodology**: Automated prompt testing for thesis validation

### Key Metrics for Thesis

- **Character Consistency**: % of responses maintaining Senior Tech Lead persona
- **Question Quality**: Relevance to candidate's resume (LLM-as-judge)
- **Cost Efficiency**: Zero dollars spent on API usage
- **Response Time**: Average latency (Groq vs Gemini comparison)

## 🔧 Troubleshooting

### PDF Upload Issues

- Ensure PDF contains selectable text (not scanned images)
- File size should be < 5MB
- Only PDF files are supported

### API Rate Limits

- The app automatically falls back to Gemini when Groq hits limits
- Check browser console for fallback logs
- Gemini has higher free tier limits

### Environment Variables

- Make sure `.env.local` is in the project root
- API keys should have no quotes or spaces
- Restart dev server after changing `.env.local`

## 📝 License

This is an academic project for Bachelor's thesis purposes.

## 🙏 Acknowledgments

- Vercel AI SDK team for excellent documentation
- Groq and Google for generous free tiers
- Shadcn for the beautiful component library

---

**Built with ❤️ for academic excellence**
