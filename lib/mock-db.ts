import type { User, Agent, Review } from "@/lib/types"
import type { Workflow } from "@/lib/workflow-types"

// --- Users ---
const users: User[] = [
  { id: "1", email: "admin@agentverse.com", name: "Admin User", role: "admin", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", email: "seller@agentverse.com", name: "Seller User", role: "seller", createdAt: new Date(), updatedAt: new Date() },
  { id: "3", email: "buyer@agentverse.com", name: "Buyer User", role: "buyer", createdAt: new Date(), updatedAt: new Date() },
]

// --- Agents ---
const agents: Agent[] = [
  {
    id: "1",
    name: "Data Analyst Pro",
    creator: "Analytics Corp",
    description:
      "Advanced data analysis and visualization agent with machine learning capabilities. Perfect for business intelligence, statistical analysis, and data-driven decision making.",
    capabilities: [
      "Data Analysis",
      "Machine Learning",
      "Visualization",
      "Statistical Modeling",
      "Predictive Analytics",
      "Data Cleaning",
    ],
    pricing: {
      type: "subscription",
      amount: 4999,
      currency: "usd",
      interval: "month",
    },
    sellerId: "seller1",
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/data-analyst",
    ratings: {
      average: 4.8,
      count: 127,
    },
    metadata: {
      version: "2.1.0",
      lastUpdated: "2024-01-15",
      category: "Analytics",
      tags: ["data", "analytics", "ml", "visualization"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    documentation: `# Data Analyst Pro

## Overview
Data Analyst Pro is a comprehensive AI agent designed for advanced data analysis and visualization. It combines statistical analysis, machine learning, and data visualization capabilities to provide actionable insights from your data.

## Features
- **Statistical Analysis**: Descriptive and inferential statistics
- **Machine Learning**: Classification, regression, clustering
- **Data Visualization**: Interactive charts and graphs
- **Data Cleaning**: Automated data preprocessing
- **Predictive Analytics**: Forecasting and trend analysis

## Input Schema
\`\`\`json
{
  "data": "array|string", // CSV data or array of objects
  "analysis_type": "string", // "descriptive", "predictive", "classification"
  "target_column": "string", // For supervised learning
  "visualization": "boolean" // Whether to generate charts
}
\`\`\`

## Output Schema
\`\`\`json
{
  "analysis": {
    "summary": "object",
    "insights": "array",
    "recommendations": "array"
  },
  "visualizations": "array",
  "model_performance": "object"
}
\`\`\``,
    examples: [
      {
        input: {
          data: "sales_data.csv",
          analysis_type: "descriptive",
          visualization: true,
        },
        output: {
          analysis: {
            summary: { total_sales: 125000, avg_order: 85.5, growth_rate: 0.15 },
            insights: ["Sales increased 15% compared to last quarter", "Peak sales occur on weekends"],
            recommendations: ["Focus marketing on weekend campaigns", "Expand high-performing product lines"],
          },
          visualizations: ["sales_trend_chart.png", "product_performance_bar.png"],
        },
        description: "Analyze sales data to identify trends and opportunities",
      },
      {
        input: {
          data: "customer_data.csv",
          analysis_type: "classification",
          target_column: "churn_risk",
        },
        output: {
          analysis: {
            summary: { accuracy: 0.89, precision: 0.85, recall: 0.92 },
            insights: ["High-value customers have 23% lower churn risk", "Support tickets correlate with churn"],
            recommendations: [
              "Implement proactive support for at-risk customers",
              "Create loyalty program for high-value segments",
            ],
          },
          model_performance: {
            auc: 0.91,
            confusion_matrix: [
              [850, 45],
              [32, 173],
            ],
          },
        },
        description: "Predict customer churn risk using machine learning",
      },
    ],
    reviews: [],
  },
  {
    id: "2",
    name: "Content Generator",
    creator: "Contentify",
    description:
      "AI-powered content creation agent for blogs, social media, and marketing materials with SEO optimization.",
    capabilities: [
      "Content Writing",
      "SEO Optimization",
      "Social Media",
      "Copywriting",
      "Blog Posts",
      "Marketing Copy",
    ],
    pricing: {
      type: "one-time",
      amount: 9999,
      currency: "usd",
    },
    sellerId: "seller2",
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/content-gen",
    ratings: {
      average: 4.6,
      count: 89,
    },
    metadata: {
      version: "1.8.2",
      lastUpdated: "2024-01-12",
      category: "Content",
      tags: ["writing", "seo", "marketing", "social-media"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    documentation: `# Content Generator

## Overview
Content Generator is an AI-powered writing assistant that creates high-quality content for various purposes including blog posts, social media, marketing copy, and more.

## Features
- **Multi-format Content**: Blog posts, social media, emails, ads
- **SEO Optimization**: Keyword integration and optimization
- **Brand Voice**: Maintains consistent tone and style
- **Bulk Generation**: Create multiple variations
- **Content Planning**: Editorial calendar suggestions

## Input Schema
\`\`\`json
{
  "topic": "string",
  "content_type": "string", // "blog", "social", "email", "ad"
  "tone": "string", // "professional", "casual", "friendly"
  "length": "number", // Word count
  "keywords": "array", // SEO keywords
  "target_audience": "string"
}
\`\`\``,
    examples: [
      {
        input: {
          topic: "Benefits of Remote Work",
          content_type: "blog",
          tone: "professional",
          length: 800,
          keywords: ["remote work", "productivity", "work-life balance"],
        },
        output: {
          content: "# The Transformative Benefits of Remote Work...",
          seo_score: 85,
          readability: "Grade 8",
          word_count: 847,
        },
        description: "Generate SEO-optimized blog post about remote work",
      },
    ],
    reviews: [
      {
        id: "1",
        user: "David Park",
        rating: 5,
        comment:
          "Amazing content quality! The SEO optimization features have improved our search rankings significantly.",
        date: "2024-01-09",
      },
    ],
  },
  {
    id: "3",
    name: "Code Review Assistant",
    creator: "DevTools Inc.",
    description: "Automated code review and quality assurance agent for multiple programming languages. Your personal code QA expert.",
    capabilities: ["Code Review", "Bug Detection", "Security Analysis", "Performance Optimization", "Best Practices"],
    pricing: {
      type: "subscription",
      amount: 2999,
      currency: "usd",
      interval: "month",
    },
    sellerId: "2",
    status: "active",
    a2aEndpoint: "https://api.example.com/agents/code-review",
    ratings: {
      average: 4.9,
      count: 203,
    },
    metadata: {
      version: "1.5.0",
      lastUpdated: "2024-02-01",
      category: "Development",
      tags: ["code", "review", "qa", "security"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    documentation: `# Code Review Assistant

## Overview
This agent performs automated code reviews to identify bugs, security vulnerabilities, and performance issues.

## Features
- **Multi-language Support**: Python, JavaScript, Java, Go
- **Security Scanning**: Detects common vulnerabilities (OWASP Top 10)
- **Performance Profiling**: Identifies bottlenecks
- **Best Practice Checks**: Enforces coding standards`,
    examples: [
      {
        input: { code: "...", language: "python" },
        output: { issues: [{ line: 15, severity: "High", message: "SQL Injection vulnerability" }] },
        description: "Review a Python script for security flaws.",
      },
    ],
    reviews: [],
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

// --- Standalone Database Functions ---
export function getAgentById(id: string): Agent | undefined {
  return agents.find((agent) => agent.id === id)
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
      const newUser: User = { id: `${users.length + 1}`, ...data }
      users.push(newUser)
      return newUser
    },
  },
  agents: {
    find: (predicate: (agent: Agent) => boolean) => agents.find(predicate),
    getAll: () => agents,
  },
  purchases: {
    findForUser: (userId: string) => purchases.filter((p) => p.userId === userId),
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