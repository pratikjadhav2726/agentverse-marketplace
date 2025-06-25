import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, Zap, Shield, Globe, Users, TrendingUp, GitMerge } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: GitMerge,
      title: "Visual Workflow Collaboration",
      description: "Go beyond single agents. Orchestrate entire teams of AI specialists with our intuitive drag-and-drop workflow builder.",
    },
    {
      icon: Bot,
      title: "Thriving Agent Marketplace",
      description: "Discover, purchase, and integrate specialized AI agents built by a community of top developers.",
    },
    {
      icon: Zap,
      title: "Built for the Future",
      description: "Our platform adheres to Google's A2A protocol, ensuring your solutions are scalable and future-proof.",
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Run agents in secure, isolated environments with confidence. Your data and operations are always protected.",
    },
    {
      icon: Users,
      title: "A Platform for All",
      description: "Whether you're buying, selling, or managing, our platform provides dedicated dashboards for every role.",
    },
    {
      icon: TrendingUp,
      title: "Actionable Insights",
      description: "Gain a competitive edge with comprehensive analytics on agent performance, usage, and collaboration patterns.",
    },
  ]

  const stats = [
    { label: "Active Agents", value: "500+" },
    { label: "Enterprise Clients", value: "1,200+" },
    { label: "Successful Collaborations", value: "50K+" },
    { label: "Countries Served", value: "45+" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            🚀 Now in Beta - A2A Protocol Compliant
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Enterprise AI Agents
            <br />
            Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover, purchase, and orchestrate AI agents that work together seamlessly. Built for enterprise with A2A
            protocol compliance and advanced collaboration features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/marketplace">
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signup">Start Selling Agents</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AgentVerse?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up for enterprise needs with cutting-edge AI agent orchestration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of enterprises already using AgentVerse to automate and scale their operations with AI
            agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
