export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-muted-foreground mb-8">Last updated: January 2024</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using AgentVerse, you accept and agree to be bound by the terms and provision of this
            agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of AgentVerse per device for personal, non-commercial
            transitory viewing only.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Agent Marketplace</h2>
          <p>
            AgentVerse provides a platform for buying and selling AI agents. We do not guarantee the performance or
            quality of third-party agents.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibent mb-4">4. Payment Terms</h2>
          <p>
            All payments are processed securely through our payment partners. Refunds are subject to our refund policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at legal@agentverse.com.</p>
        </section>
      </div>
    </div>
  )
}
