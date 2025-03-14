# Typhoon Deep Research

Typhoon Deep Research is a modern, production-grade Next.js application that leverages AI to conduct comprehensive research on any topic. The application follows a structured research process:

1. **User Query**: Users submit their research topic or question.
2. **Follow-up Questions**: The AI asks clarifying questions to better understand the research needs.
3. **Deep Research**: The AI conducts thorough research, exploring multiple angles of the topic.
4. **Research Report**: Users receive a comprehensive report with key insights and findings.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- AI-powered research algorithm that explores topics in depth
- Interactive research progress visualization
- Markdown-based research reports with download capability
- Dark mode support

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI Integration**: OpenAI API, Vercel AI SDK
- **Styling**: Tailwind CSS, Heroicons
- **Content Rendering**: React Markdown

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/typhoon-research.git
   cd typhoon-research
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_AI_MODEL=gpt-4-turbo
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
typhoon-research/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Core library code
│   │   ├── ai/          # AI-related utilities
│   │   ├── deep-research.ts  # Main research algorithm
│   │   ├── feedback.ts  # Follow-up questions generation
│   │   └── prompt.ts    # AI prompt templates
│   └── utils/           # Utility functions
├── .env.local           # Environment variables (create this file)
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Deployment

This application can be easily deployed to Vercel:

```bash
npm run build
# or
vercel deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- The research algorithm is based on the deep-research library.
- UI design inspired by modern research and AI tools.
