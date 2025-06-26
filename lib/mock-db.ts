import type { User, Agent, Review, Transaction } from "@/lib/types"
import type { Workflow } from "@/lib/workflow-types"

// --- Users ---
const users: User[] = [
  { id: "1", email: "admin@agentverse.com", name: "Admin User", role: "admin", credits: 1000, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", email: "seller@agentverse.com", name: "Seller User", role: "seller", credits: 500, createdAt: new Date(), updatedAt: new Date() },
  { id: "3", email: "buyer@agentverse.com", name: "Buyer User", role: "buyer", credits: 100, createdAt: new Date(), updatedAt: new Date() },
]

// --- Agents ---
export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Content Summarizer Pro",
    description: "Summarizes long articles and documents into concise, easy-to-read summaries.",
    creator: "AI Content Inc.",
    sellerId: "user-2",
    capabilities: ["Content", "Analytics"],
    pricing: {
      amount: 50,
      currency: "credits",
      type: "one-time",
    },
    ratings: {
      average: 4.8,
      count: 120,
    },
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/content-summarizer",
    metadata: { version: "1.0" },
    reviews: [],
    documentation: `# Content Summarizer Pro

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
    examples: [
      {
        description: "Summarize a short block of text.",
        input: {
          content: "The quick brown fox jumps over the lazy dog. This sentence is used to demonstrate all the letters of the alphabet. It is a well-known pangram.",
          length: "short",
        },
        output: {
          summary: "A sentence containing all letters of the alphabet, 'The quick brown fox jumps over the lazy dog,' is a famous pangram.",
          keywords: ["pangram", "alphabet", "fox"],
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-2",
    name: "Code Review Assistant",
    description: "Analyzes your code for potential bugs, security vulnerabilities, and style issues.",
    creator: "DevTools LLC",
    sellerId: "user-2",
    capabilities: ["Development", "Code Review"],
    pricing: {
      amount: 25,
      currency: "credits",
      type: "one-time",
    },
    ratings: {
      average: 4.5,
      count: 85,
    },
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/code-reviewer",
    metadata: { version: "2.1" },
    reviews: [],
    documentation: `# Code Review Assistant

## Overview
This agent performs static analysis on your code to find common issues. It supports multiple languages and can be integrated into your CI/CD pipeline.

## Features
- Supports Python, JavaScript, and TypeScript
- Checks for security vulnerabilities (e.g., OWASP Top 10)
- Enforces coding style and best practices
`,
    examples: [
      {
        description: "Review a simple Python function for issues.",
        input: {
          language: "python",
          code: "def add(a, b):\n  return a + b",
        },
        output: {
          issues: [
            {
              line: 1,
              severity: "low",
              message: "Missing docstring for public function.",
            },
          ],
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// --- Purchases ---
const purchases = [
  { purchaseId: "pur_1", userId: "3", agentId: "agent_1", purchaseDate: new Date(), type: "oneTime" },
  { purchaseId: "pur_2", userId: "3", agentId: "agent_2", purchaseDate: new Date(), type: "subscription" },
  { purchaseId: "pur_3", userId: "3", agentId: "agent_3", purchaseDate: new Date(), type: "oneTime" },
]

// --- Workflows ---
const workflows: Workflow[] = []

// --- Transactions ---
const transactions: Transaction[] = []

// --- Standalone Database Functions ---
export function getAgentById(id: string): Agent | undefined {
  return MOCK_AGENTS.find((agent) => agent.id === id)
}

export function addReviewForAgent(
  agentId: string,
  reviewData: Omit<Review, "id" | "date">
): Review | null {
  const agent = getAgentById(agentId)
  if (!agent) {
    return null
  }

  const newReview: Review = {
    ...reviewData,
    id: `${agent.reviews.length + 1}-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
  }

  agent.reviews.unshift(newReview) // Add to the beginning of the array
  agent.ratings.count += 1
  // In a real app, average would be recalculated properly
  // For now, let's just do a simple approximation
  agent.ratings.average =
    (agent.ratings.average * (agent.ratings.count - 1) + newReview.rating) / agent.ratings.count

  return newReview
}

// --- Database Accessor Functions ---
export const db = {
  users: {
    find: (predicate: (user: User) => boolean) => users.find(predicate),
    create: (data: Omit<User, "id">) => {
      const { credits, ...restData } = data
      const newUser: User = { id: `${users.length + 1}`, credits: credits || 0, ...restData }
      users.push(newUser)
      return newUser
    },
    update: (id: string, data: Partial<Omit<User, "id">>) => {
      const index = users.findIndex((u) => u.id === id)
      if (index !== -1) {
        users[index] = { ...users[index], ...data, updatedAt: new Date() }
        return users[index]
      }
      return null
    },
  },
  agents: {
    find: (predicate: (agent: Agent) => boolean) => MOCK_AGENTS.find(predicate),
    getAll: () => MOCK_AGENTS,
    create: (data: Omit<Agent, "id" | "createdAt" | "updatedAt" | "status" | "ratings" | "reviews"> & Partial<Agent>) => {
      const newAgent: Agent = {
        id: `agent-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
        ratings: { average: 0, count: 0 },
        reviews: [],
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      MOCK_AGENTS.push(newAgent)
      return newAgent
    },
  },
  purchases: {
    findForUser: (userId: string) => purchases.filter((p) => p.userId === userId),
  },
  transactions: {
    findForUser: (userId: string) => transactions.filter((t) => t.userId === userId),
    create: (data: Omit<Transaction, "id">) => {
      const newTransaction: Transaction = { id: `txn_${Date.now()}`, ...data }
      transactions.push(newTransaction)
      return newTransaction
    },
  },
  workflows: {
    find: (predicate: (workflow: Workflow) => boolean) => workflows.find(predicate),
    findForUser: (userId: string) => workflows.filter((w) => w.userId === userId),
    create: (data: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "status" | "executionHistory">) => {
      const newWorkflow: Workflow = {
        id: `wf_${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "draft",
        executionHistory: [],
      }
      workflows.push(newWorkflow)
      return newWorkflow
    },
    update: (id: string, data: Partial<Workflow>) => {
        const index = workflows.findIndex(w => w.id === id);
        if (index !== -1) {
            workflows[index] = { ...workflows[index], ...data, updatedAt: new Date() };
            return workflows[index];
        }
        return null;
    }
  },
} 