<div align="center">
  <img src="logo.svg" alt="Wajibika Mazingira Logo" width="150">
  <h1>Wajibika Mazingira</h1>
  <p><strong>Empowering East African communities with AI-driven environmental conservation and carbon credit management.</strong></p>
  <p><em>A minima PiNet OS project by William Majanja</em></p>
</div>

<p align="center">
  <img alt="Technology" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Technology" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white">
</p>

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a comprehensive web platform for environmental conservation, carbon credit sequestering, carbon token pricing, and community governance. Built as part of the **minima PiNet OS** ecosystem by **William Majanja**, it features AI-powered environmental oversight via **Ollama** (local) or **OpenRouter** (cloud free tier).

> **Note:** This project is **not** affiliated with or related to Pi Network (the cryptocurrency). It is an independent project under the minima PiNet OS initiative by William Majanja.

---

## Core Features

### 1. AI Impact Assessment Generator
Generate professional environmental, social, health, climate, and **carbon sequestration** impact assessments. Features AI-powered report generation with real-time streaming and deep analysis mode.

### 2. Carbon Dashboard
Track carbon sequestration projects with:
- Project registration and management (reforestation, afforestation, conservation, agroforestry, soil carbon, blue carbon, renewable energy)
- Carbon sequestration rate tracking (tCO₂e/ha/yr)
- Automated carbon credit issuance based on sequestration calculations
- AI-powered carbon potential analysis
- Real-time metrics (total sequestered, credits issued, area restored)

### 3. Carbon Market
A decentralized carbon credit marketplace with:
- Order book for buying and selling carbon credits
- Automated order matching engine
- Real-time price discovery with historical charting
- AI-powered market insights and price predictions
- Credit listing, trading, and retirement
- Project type filtering and market depth visualization

### 4. Governance Portal
Community-driven governance for carbon credit management with:
- Proposal creation and voting (Carbon Standards, Pricing, Project Approval, Parameter Changes, Funding)
- Weighted voting power based on carbon projects (10 VP each) and credit ownership (1 VP each)
- Quorum-based decision making (20% participation required)
- Automatic proposal execution when conditions are met
- AI-powered debate analysis for informed voting
- Proposal categories with progress tracking

### 5. Secure Evidence Locker
Store reports and upload photographic evidence with AI-powered image analysis. Export assessments as PDF.

### 6. AI Community Assistant
Engage with "Mazingira Rafiki," a multi-mode AI assistant with voice-to-text, text-to-speech, and modes for fast, smart, grounded (web search), and maps-based queries.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 3.4
- **AI**: Ollama (local) or OpenRouter (cloud) — no API key required for Ollama
- **Storage**: Client-side localStorage
- **Auth & Payments**: Pi Network SDK
- **Deployment**: GitHub Pages

---

## Getting Started

### Prerequisites

- Node.js and npm
- **Option A (Ollama — recommended, free, private):** Install [Ollama](https://ollama.ai) and pull a model:
  ```bash
  ollama pull deepseek-r1:8b
  ```
- **Option B (OpenRouter — free cloud tier):** Sign up at [openrouter.ai](https://openrouter.ai) and create a free API key.

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/WilliamMajanja/wajibika-mazingira.git
    cd wajibika-mazingira
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the local address provided (e.g., `http://localhost:5173`).
5.  Click the **AI icon (✨)** in the header to configure your AI provider — choose Ollama (default, local) or OpenRouter (cloud).

---

## Carbon Credit System

The platform implements a complete carbon credit lifecycle:

1. **Project Registration**: Users register conservation projects with type, area, location, and sequestration rate
2. **Credit Issuance**: Projects are activated to generate verified carbon credits, each with unique serial numbers
3. **Market Trading**: Credits can be listed on the order book for peer-to-peer trading with price discovery
4. **Retirement**: Credits can be permanently retired with a recorded reason, removing them from circulation
5. **Governance**: The community votes on carbon standards, pricing parameters, and project approvals

### Default Sequestration Rates
| Project Type | Rate (tCO₂/ha/yr) |
|---|---|
| Reforestation | 12 |
| Afforestation | 10 |
| Agroforestry | 8 |
| Blue Carbon | 7 |
| Conservation | 5 |
| Renewable Energy | 4 |
| Soil Carbon | 3 |

---

## AI Provider Configuration

Click the **AI icon (✨)** in the header to open the configuration panel.

### Ollama (Default — Free & Private)
- Runs entirely on your machine — no data leaves your computer.
- Default URL: `http://localhost:11434`
- Recommended models: `deepseek-r1:8b`, `llama3.2`, `mistral`, `qwen2.5`
- Vision-capable models (for image analysis): `llava`, `bakllava`

### OpenRouter (Cloud — Free Tier)
- Sign up at [openrouter.ai](https://openrouter.ai) and get a free API key.
- Free models include: `deepseek/deepseek-v4-flash-free`, `cognitivecomputations/dolphin-mixtral-8x7b`
- Supports vision models for image analysis.

---

## Deployment

This project is configured for automatic deployment via GitHub Actions to GitHub Pages.

1. Push your repository to GitHub.
2. Go to **Settings > Pages** and set the source to **GitHub Actions**.
3. Push to the `main` branch. Your site will be live at `https://<username>.github.io/wajibika-mazingira/`.

> **Note:** No API keys are embedded in the build when using Ollama. If using OpenRouter, the API key is stored only in your browser's localStorage.
