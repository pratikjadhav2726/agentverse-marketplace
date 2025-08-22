import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/database";

const COMMISSION_RATE = 0.1; // 10%

async function callPythonMicroservice(agentId: string, input: string) {
	const serviceUrl = process.env.AGENT_RUNTIME_URL;
	if (!serviceUrl) return null;
	try {
		const res = await fetch(`${serviceUrl}/run`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ agent_id: agentId, input })
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data?.output ?? null;
	} catch {
		return null;
	}
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	const { id: agentId } = params;
	const { input, user_id } = await request.json();

	try {
		const agent = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
		if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

		// Minimal per-use debit if user provided
		if (user_id) {
			const buyerWallet = sqlite.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user_id) as any;
			if (!buyerWallet || buyerWallet.balance < agent.price_per_use_credits) {
				return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
			}
			const price = agent.price_per_use_credits as number;
			const commission = Math.floor(price * COMMISSION_RATE);
			const sellerAmount = price - commission;

			sqlite.prepare('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(price, user_id);
			sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(sellerAmount, agent.owner_id);

			// Credit commission to admin
			const admin = sqlite.prepare('SELECT id FROM users WHERE role = ?').get('admin') as any;
			if (admin) {
				sqlite.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(commission, admin.id);
			}

			// Log a minimal credit transaction
			const txId = 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
			sqlite.prepare(`
			  INSERT INTO credit_transactions (id, from_user_id, to_user_id, agent_id, amount, type, metadata)
			  VALUES (?, ?, ?, ?, ?, ?, ?)
			`).run(
				txId,
				user_id,
				agent.owner_id,
				agentId,
				price,
				'purchase',
				JSON.stringify({ source: 'playground' })
			);
		}

		// Attempt to call Python microservice; fallback to mock
		const serviceOutput = await callPythonMicroservice(agentId, input);
		const output: string = serviceOutput ?? `Echo: ${input}`;
		return NextResponse.json({ output });
	} catch (error) {
		console.error('Error in playground:', error);
		return NextResponse.json({ error: "Failed to run playground" }, { status: 500 });
	}
}