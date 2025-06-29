import type { User, Agent, Review, Transaction, ApiUsage, Purchase } from "@/lib/types"
import type { Workflow } from "@/lib/workflow-types"

// In a real app, you'd use a proper database. For this mock, we'll use globalThis
// to preserve state across hot reloads in development.

declare global {
  var mock_users: User[]
  var mock_agents: Agent[]
  var mock_reviews: Review[]
  var mock_transactions: Transaction[]
  var mock_api_usage: ApiUsage[]
  var mock_purchases: Purchase[]
}

// --- Initial Data ---
const initialUsers: User[] = [
  {
    id: "user_1",
    name: "Alice",
    email: "alice@example.com",
    role: "buyer",
    credits: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user_2",
    name: "Bob",
    email: "bob@example.com",
    role: "seller",
    credits: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user_admin",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    credits: 9999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Content Summarizer",
    description: "Summarizes long texts into concise overviews.",
    readme: `# Content Summarizer Pro

## Overview
This agent uses advanced NLP models to provide high-quality summaries of text-based content. It's ideal for quickly understanding articles, reports, and documents.

## Features
- Adjustable summary length (short, medium, long)
- Supports various input formats (text, URL)
- Extracts key sentences and concepts

## Input Schema
\`\`\`json
{
  "content": "string", // The full text to summarize
  "length": "short" | "medium" | "long" // Desired summary length
}
\`\`\`

## Output Schema
\`\`\`json
{
  "summary": "string",
  "keywords": ["string"]
}
\`\`\`
`,
    documentation: "Detailed documentation for Content Summarizer.",
    avatar: "/placeholder.svg",
    creator: "AI Content Inc.",
    sellerId: "user_2",
    capabilities: ["Content", "Analytics", "Summarization"],
    status: "active",
    pricing: { currency: "credits", amount: 10 },
    examples: [
      {
        input: { text: "A long article about AI..." },
        output: { summary: "AI is revolutionizing technology." },
      },
    ],
    reviews: [],
    ratings: { average: 4.5, count: 25 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    a2aEndpoint: "https://api.example.com/summarizer",
    metadata: { version: "1.0" },
  },
  {
    id: "agent-2",
    name: "Image Recognition API",
    description: "Identifies objects and concepts in images.",
    readme: `# Code Review Assistant

## Overview
This agent performs static analysis on your code to find common issues. It supports multiple languages and can be integrated into your CI/CD pipeline.

## Features
- Supports Python, JavaScript, and TypeScript
- Checks for security vulnerabilities (e.g., OWASP Top 10)
- Enforces coding style and best practices
`,
    documentation: "Detailed documentation for Image Recognition API.",
    avatar: "/placeholder.svg",
    creator: "Vision Systems",
    sellerId: "user_2",
    capabilities: ["Vision", "AI", "Images"],
    status: "active",
    pricing: { currency: "credits", amount: 25 },
    examples: [
      {
        input: { imageUrl: "http://example.com/image.jpg" },
        output: { tags: ["nature", "mountain", "lake"] },
      },
    ],
    reviews: [],
    ratings: { average: 4.8, count: 42 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    a2aEndpoint: "https://api.example.com/image-recognition",
    metadata: { version: "2.1" },
  },
  {
    id: "agent-3",
    name: "Data Visualization Bot",
    description: "Creates insightful charts and graphs from your data sets.",
    creator: "DataViz Experts",
    sellerId: "user-3",
    capabilities: ["Data Analysis", "Analytics"],
    pricing: {
      amount: 100,
      currency: "credits",
      type: "one-time",
    },
    ratings: {
      average: 4.9,
      count: 210,
    },
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/data-viz",
    metadata: { version: "1.5" },
    reviews: [],
    documentation: `# Data Visualization Bot

## Overview
Turns your raw data into beautiful, easy-to-understand charts. Supports various chart types and data formats.

## Features
- Supported chart types: bar, line, pie, scatter
- Input data as CSV or JSON array
- Customizable colors and labels
`,
    examples: [
      {
        description: "Create a bar chart from a simple JSON dataset.",
        input: {
          chartType: "bar",
          data: [
            { "category": "A", "value": 30 },
            { "category": "B", "value": 50 },
            { "category": "C", "value": 20 }
          ],
          "options": {
            "title": "Category Values"
          }
        },
        output: {
          "chartUrl": "https://example.com/charts/12345.png",
          "chartType": "bar"
        },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "agent-4",
    name: "Social Media Post Generator",
    description: "Generates engaging posts for various social media platforms.",
    creator: "Socially AI",
    sellerId: "user-3",
    capabilities: ["Content Writing", "Content"],
    pricing: {
      amount: 15,
      currency: "credits",
      type: "one-time",
    },
    ratings: {
      average: 4.3,
      count: 95,
    },
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/social-media",
    metadata: { version: "3.0" },
    reviews: [],
    documentation: `# Social Media Post Generator

## Overview
Generates engaging posts tailored for different social media platforms.

## Features
- Supports Twitter, Facebook, and LinkedIn
- Can include relevant hashtags
- Tone adjustment (professional, casual, witty)
`,
    examples: [
      {
        description: "Generate a witty Twitter post.",
        input: {
          platform: "twitter",
          topic: "The importance of coffee for developers",
          tone: "witty"
        },
        output: {
          post: "Roses are red, violets are blue, syntax errors are hard, and so is life without coffee. #devlife #coding #coffee"
        }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// --- Database Initialization ---
if (process.env.NODE_ENV === "production") {
  global.mock_users = initialUsers
  global.mock_agents = initialAgents
  global.mock_reviews = []
  global.mock_transactions = []
  global.mock_api_usage = []
  global.mock_purchases = []
} else {
  if (!global.mock_users) {
    global.mock_users = initialUsers
  }
  if (!global.mock_agents) {
    global.mock_agents = initialAgents
  }
  if (!global.mock_reviews) {
    global.mock_reviews = []
  }
  if (!global.mock_transactions) {
    global.mock_transactions = []
  }
  if (!global.mock_api_usage) {
    global.mock_api_usage = []
  }
  if (!global.mock_purchases) {
    global.mock_purchases = []
  }
}

// --- Database Access Object ---
export const db = {
  users: {
    find: (predicate: (user: User) => boolean) => global.mock_users.find(predicate),
    getAll: () => global.mock_users,
    create: (data: Omit<User, "id" | "createdAt" | "updatedAt">) => {
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      global.mock_users.push(newUser)
      return newUser
    },
    update: (id: string, data: Partial<Omit<User, "id">>) => {
      const userIndex = global.mock_users.findIndex((u) => u.id === id)
      if (userIndex > -1) {
        global.mock_users[userIndex] = {
          ...global.mock_users[userIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        }
        return global.mock_users[userIndex]
      }
      return null
    },
  },
  agents: {
    find: (predicate: (agent: Agent) => boolean) => global.mock_agents.find(predicate),
    getAll: () => global.mock_agents,
    create: (data: Omit<Agent, "id" | "createdAt" | "status" | "updatedAt">) => {
      const newAgent: Agent = {
        id: `agent_${Date.now()}`,
        ...data,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      global.mock_agents.push(newAgent)
      return newAgent
    },
    update: (id: string, data: Partial<Omit<Agent, "id">>) => {
      const agentIndex = global.mock_agents.findIndex((a) => a.id === id)
      if (agentIndex > -1) {
        global.mock_agents[agentIndex] = { ...global.mock_agents[agentIndex], ...data }
        return global.mock_agents[agentIndex]
      }
      return null
    },
  },
  reviews: {
    findByAgentId: (agentId: string) => global.mock_reviews.filter((r) => r.agentId === agentId),
    create: (data: Omit<Review, "id" | "createdAt">) => {
      const newReview: Review = {
        id: `review_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      }
      global.mock_reviews.push(newReview)
      return newReview
    },
  },
  transactions: {
    findByUserId: (userId: string) => global.mock_transactions.filter((t) => t.userId === userId),
    getAll: () => global.mock_transactions,
    create: (data: Omit<Transaction, "id">) => {
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        ...data,
      }
      global.mock_transactions.push(newTransaction)
      return newTransaction
    },
  },
  apiUsage: {
    get: (userId: string, endpoint: string): ApiUsage | undefined => {
      return global.mock_api_usage.find((u) => u.userId === userId && u.endpoint === endpoint)
    },
    record: (userId: string, endpoint: string): ApiUsage => {
      let usage = global.mock_api_usage.find((u) => u.userId === userId && u.endpoint === endpoint)
      if (usage) {
        usage.timestamps.push(Date.now())
      } else {
        usage = {
          userId,
          endpoint,
          timestamps: [Date.now()],
        }
        global.mock_api_usage.push(usage)
      }
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      usage.timestamps = usage.timestamps.filter((ts) => ts > oneHourAgo)
      return usage
    },
  },
  purchases: {
    find: (predicate: (purchase: Purchase) => boolean) => global.mock_purchases.find(predicate),
    findByUserId: (userId: string) => global.mock_purchases.filter((p) => p.userId === userId),
    create: (data: Omit<Purchase, "id" | "createdAt">) => {
      const newPurchase: Purchase = {
        id: `purchase_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      }
      global.mock_purchases.push(newPurchase)
      return newPurchase
    },
  },
} 