"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgentCard } from "@/components/marketplace/agent-card"
import { Search } from "lucide-react"

// Updated interface to match our SQLite schema
interface AgentWithOwner {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  price_per_use_credits: number;
  price_subscription_credits?: number;
  price_one_time_credits?: number;
  status: string;
  created_at: string;
  category?: string;
  tags?: string;
  demo_url?: string;
  documentation?: string;
  owner?: {
    name: string;
    email: string;
  };
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<AgentWithOwner[]>([])
  const [filteredAgents, setFilteredAgents] = useState<AgentWithOwner[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch agents from the new API endpoint
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/agents")
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      const data = await response.json()
      setAgents(data.agents || [])
      setFilteredAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from agents
  const categories = ["all", ...Array.from(new Set(agents.map(agent => agent.category).filter(Boolean)))]

  useEffect(() => {
    let filtered = agents

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (agent.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (agent.tags || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(agent => agent.category === selectedCategory)
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter(agent => {
        const price = agent.price_per_use_credits
        switch (priceFilter) {
          case "free":
            return price === 0
          case "under-50":
            return price > 0 && price < 50
          case "50-100":
            return price >= 50 && price <= 100
          case "over-100":
            return price > 100
          default:
            return true
        }
      })
    }

    setFilteredAgents(filtered)
  }, [searchQuery, selectedCategory, priceFilter, agents])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Agents Marketplace</h1>
        <p className="text-muted-foreground">Discover and purchase AI agents for your business needs</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="under-50">Under 50 Credits</SelectItem>
                <SelectItem value="50-100">50 - 100 Credits</SelectItem>
                <SelectItem value="over-100">Over 100 Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filteredAgents.length} agents found</span>
            {(searchQuery || selectedCategory !== "all" || priceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceFilter("all")
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={{
              ...agent,
              creator: agent.owner?.name || 'Unknown',
              description: agent.description || ''
            }} 
          />
        ))}
      </div>

      {filteredAgents.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No agents found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("all")
              setPriceFilter("all")
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
