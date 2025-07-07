import { NextRequest, NextResponse } from 'next/server';
import { sqlite, decryptCredential } from '../../../../../lib/database';
import { MCPTool, UserCredential } from '../../../../../lib/schema';

export async function POST(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  const { toolId } = params;
  let body: any = {};
  
  try {
    body = await request.json();
    const { user_id, agent_id, action, parameters } = body;

    // Validate required fields
    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, action' },
        { status: 400 }
      );
    }

    // Get tool information
    const tool = sqlite.prepare('SELECT * FROM mcp_tools WHERE id = ?').get(toolId) as MCPTool;
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Get user credentials for this tool
    const credential = sqlite.prepare(`
      SELECT * FROM user_credentials 
      WHERE user_id = ? AND tool_id = ? AND credential_type = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(user_id, toolId, 'api_key') as UserCredential;

    if (!credential) {
      return NextResponse.json({ 
        error: 'No credentials found for this tool',
        requires_auth: true,
        auth_type: tool.auth_type,
        setup_url: `/credentials/setup?tool_id=${toolId}`
      }, { status: 401 });
    }

    // Check if agent is authorized to use this tool (if agent_id provided)
    if (agent_id) {
      const agentTool = sqlite.prepare(`
        SELECT * FROM agent_tools WHERE agent_id = ? AND tool_id = ?
      `).get(agent_id, toolId);

      if (!agentTool) {
        return NextResponse.json({ 
          error: 'Agent is not authorized to use this tool' 
        }, { status: 403 });
      }
    }

    // Check if user has enough credits for tool usage
    const wallet = sqlite.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(user_id) as { balance: number };
    if (!wallet || wallet.balance < 1) {
      return NextResponse.json({ 
        error: 'Insufficient credits for tool usage',
        required_credits: 1
      }, { status: 402 });
    }

    // Decrypt credential
    let decryptedCredential: string;
    try {
      decryptedCredential = decryptCredential(credential.encrypted_value);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to decrypt credentials. Please re-add your credentials.' 
      }, { status: 500 });
    }

    // Simulate tool invocation (in a real implementation, this would call the actual API)
    const mockResponse = await simulateToolInvocation(tool, action, parameters, decryptedCredential);

    // Log the tool usage
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sqlite.prepare(`
      INSERT INTO tool_usage_logs (
        id, user_id, agent_id, tool_id, usage_type, request_data, 
        response_status, response_data, credits_consumed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      user_id,
      agent_id,
      toolId,
      'api_call',
      JSON.stringify({ action, parameters }),
      mockResponse.status,
      JSON.stringify(mockResponse.data),
      1 // Tool usage costs 1 credit
    );

    // Deduct credits from user's wallet
    sqlite.prepare('UPDATE wallets SET balance = balance - 1 WHERE user_id = ?').run(user_id);

    // Create credit transaction record
    const transactionId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sqlite.prepare(`
      INSERT INTO credit_transactions (
        id, from_user_id, tool_id, amount, type, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      transactionId,
      user_id,
      toolId,
      1,
      'tool_usage',
      JSON.stringify({
        action,
        agent_id,
        tool_name: tool.name,
        usage_log_id: logId
      })
    );

    return NextResponse.json({
      success: true,
      tool_response: mockResponse.data,
      credits_consumed: 1,
      transaction_id: transactionId,
      usage_log_id: logId
    });

  } catch (error) {
    console.error('Error invoking tool:', error);
    
    // Log the error
    const errorLogId = 'log-error-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    if (body?.user_id && body?.toolId) {
      sqlite.prepare(`
        INSERT INTO tool_usage_logs (
          id, user_id, agent_id, tool_id, usage_type, request_data, 
          response_status, response_data, credits_consumed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        errorLogId,
        body.user_id,
        body.agent_id,
        toolId,
        'error',
        JSON.stringify(body),
        500,
        JSON.stringify({ error: (error as Error).message }),
        0
      );
    }

    return NextResponse.json({ error: 'Failed to invoke tool' }, { status: 500 });
  }
}

// Mock tool invocation - replace with real API calls in production
async function simulateToolInvocation(
  tool: MCPTool, 
  action: string, 
  parameters: any, 
  credential: string
): Promise<{ status: number; data: any }> {
  
  // Simulate different responses based on tool type
  switch (tool.name) {
    case 'Google Sheets API':
      return {
        status: 200,
        data: {
          action: action,
          result: action === 'read' 
            ? { data: [['Name', 'Email'], ['John Doe', 'john@example.com']] }
            : { message: 'Data written successfully', cells_updated: 2 }
        }
      };
      
    case 'Slack Messaging API':
      return {
        status: 200,
        data: {
          action: action,
          result: action === 'send_message'
            ? { message_id: 'msg_' + Date.now(), channel: parameters?.channel || '#general' }
            : { channels: ['#general', '#dev', '#marketing'] }
        }
      };
      
    case 'Email Sender API':
      return {
        status: 200,
        data: {
          action: action,
          result: {
            message_id: 'email_' + Date.now(),
            to: parameters?.to || 'recipient@example.com',
            status: 'sent'
          }
        }
      };
      
    default:
      return {
        status: 200,
        data: {
          action: action,
          result: { message: 'Tool invocation successful', parameters }
        }
      };
  }
}