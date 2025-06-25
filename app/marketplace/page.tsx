"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgentCard } from "@/components/marketplace/agent-card"
import { Search } from "lucide-react"
import type { Agent } from "@/lib/types"
import { db } from "@/lib/mock-db"

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceFilter, setPriceFilter] = useState<string>("all")

  useEffect(() => {
    // In a real app, this would be an API call.
    // For now, we fetch directly from the mock DB.
    const allAgents = db.agents.getAll()
    setAgents(allAgents)
    setFilteredAgents(allAgents)
  }, [])

  const categories = ["all", "Data Analysis", "Content Writing", "Code Review", "Machine Learning", "Analytics", "Content", "Development"]

  useEffect(() => {
    let filtered = agents

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.capabilities.some((cap) => cap.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((agent) => agent.capabilities.includes(selectedCategory))
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((agent) => {
        if (priceFilter === "free") return agent.pricing.amount === 0
        if (priceFilter === "under-50") return agent.pricing.amount < 5000
        if (priceFilter === "50-100") return agent.pricing.amount >= 5000 && agent.pricing.amount <= 10000
        if (priceFilter === "over-100") return agent.pricing.amount > 10000
        return true
      })
    }

    setFilteredAgents(filtered)
  }, [searchQuery, selectedCategory, priceFilter, agents])

  const handlePurchase = (agentId: string) => {
    // Implement purchase logic
    console.log("Purchasing agent:", agentId)
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
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="over-100">Over $100</SelectItem>
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
          <AgentCard key={agent.id} agent={agent} onPurchase={handlePurchase} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
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
