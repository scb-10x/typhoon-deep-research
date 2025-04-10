# Typhoon Deep Research

## Introduction

[Typhoon Deep Research](https://deep-research.apps.opentyphoon.ai) is a modern application that leverages AI to conduct comprehensive research on any topic. It streamlines the research process by asking clarifying questions, conducting thorough investigations, and generating comprehensive reports with key insights.

This project is part of [Typhoon Application Week](https://apps.opentyphoon.ai), showcasing the capabilities of the [Typhoon platform](https://opentyphoon.ai). Please note that this application is not maintained for production use and is not production-ready. Use at your own risk.

## Highlighted Features + Typhoon Integration

- **Intelligent Query Refinement**: Typhoon generates follow-up questions to narrow down research scope and understand user intent more precisely.

- **Multi-perspective Research**: Powered by Typhoon's reasoning capabilities, the application explores topics from multiple angles to provide comprehensive coverage.

- **Structured Research Reports**: Typhoon organizes findings into coherent, well-structured reports with clear sections and insights.

- **Interactive Research Progress**: Real-time visualization of the research process powered by Typhoon's streaming capabilities.

- **Markdown-based Reports**: Generate and download well-formatted research reports with Typhoon's text generation capabilities.

## Getting Started (Local Development)

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/typhoon-deep-research2
   cd typhoon-deep-research2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   # OpenTyphoon API Key - Get one at https://opentyphoon.ai/
   TYPHOON_API_KEY=your_typhoon_api_key_here
   
   # AI Model configuration
   AI_MODEL=typhoon-v2-70b-instruct
   AI_REASONING_MODEL=typhoon-v2-r1-70b-preview
   
   # Tavily API Key for web search
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the LICENSE file for details.

## Connect With Us

- Website: [Typhoon](https://opentyphoon.ai)
- GitHub: [SCB 10X](https://github.com/scb-10x)
- Hugging Face: [SCB 10X](https://huggingface.co/scb10x)
- Discord: [Join our community](https://discord.com/invite/9F6nrFXyNt)
- X (formerly Twitter): [Typhoon](https://x.com/opentyphoon)
