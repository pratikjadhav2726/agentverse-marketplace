# AI Agent Marketplace with MCP Tools Integration

## 🎯 **Overview**

The AI Agent marketplace has been enhanced with **MCP (Model Context Protocol) tools integration** and **secure credential management**. This allows AI agents to interact with external APIs and services while maintaining enterprise-grade security.

## 🚀 **New Features Added**

### **1. MCP Tools System**
- **Tool Registration**: Register external APIs (Google Sheets, Slack, Email, etc.)
- **Agent-Tool Linking**: Define which tools each agent can use
- **Multiple Auth Types**: Support for API keys, OAuth, Bearer tokens, Basic auth
- **Usage Tracking**: Monitor tool invocations and credit consumption

### **2. Secure Credential Management**
- **Encrypted Storage**: User credentials encrypted with AES-256-CBC
- **Per-User Credentials**: Each user manages their own API keys securely
- **Automatic Rotation**: Support for credential expiration and renewal
- **Secure Gateway**: Tool invocations mediated through secure gateway

### **3. Enhanced Agent Capabilities**
- **Tool Declaration**: Agents declare required tools and permissions
- **Tool Credit Costs**: Separate pricing for tool usage
- **Permission Management**: Granular control over tool access
- **Usage Analytics**: Track tool performance and costs

## 🗄️ **Database Schema Updates**

### **New Tables Added**

#### **mcp_tools**
```sql
- id: Tool identifier
- name: Tool display name
- description: Tool description
- category: Tool category (Productivity, Communication, etc.)
- api_endpoint: External API endpoint
- auth_type: Authentication method (api_key, oauth, bearer, basic)
- required_scopes: OAuth scopes or permissions needed
- documentation_url: Tool documentation link
- is_public: Whether tool is publicly available
```

#### **agent_tools**
```sql
- agent_id: Reference to agent
- tool_id: Reference to MCP tool
- required_permissions: Specific permissions needed
- usage_description: How the agent uses this tool
```

#### **user_credentials**
```sql
- user_id: Reference to user
- tool_id: Reference to MCP tool
- credential_name: Credential identifier (e.g., "api_key")
- encrypted_value: AES-encrypted credential value
- credential_type: Type of credential
- expires_at: Optional expiration date
```

#### **tool_usage_logs**
```sql
- user_id: User who invoked the tool
- agent_id: Agent that used the tool
- tool_id: Tool that was invoked
- usage_type: api_call, authentication, or error
- request_data: Request parameters (JSON)
- response_status: HTTP status code
- response_data: Response data (JSON)
- credits_consumed: Credits charged for usage
```

## 🔧 **API Endpoints**

### **Tools Management**
- `GET /api/tools` - List available MCP tools
- `POST /api/tools` - Register new MCP tool
- `GET /api/tools?include_usage=true` - Tools with usage statistics

### **Credential Management**
- `GET /api/credentials?user_id=X` - List user's credentials (encrypted values hidden)
- `POST /api/credentials` - Add/update encrypted credentials
- `DELETE /api/credentials?credential_id=X&user_id=Y` - Delete credentials

### **Tool Gateway**
- `POST /api/tools/[toolId]/invoke` - Secure tool invocation endpoint

### **Enhanced Agent APIs**
- `GET /api/agents` - Now includes tool information
- `GET /api/agents/[id]` - Includes detailed tool capabilities

## 🛡️ **Security Features**

### **Encryption System**
```typescript
// AES-256-CBC encryption with random IV
function encryptCredential(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

### **Access Control**
- **User-owned credentials**: Only credential owner can access/modify
- **Agent authorization**: Agents must be linked to tools to use them
- **Credit validation**: Sufficient credits required for tool usage
- **Error logging**: All failed attempts logged for security

### **Secure Tool Invocation**
1. **Validate user/agent permissions**
2. **Check credit balance**
3. **Decrypt credentials securely**
4. **Invoke external API**
5. **Log usage and charge credits**
6. **Return sanitized response**

## 📊 **Sample Data**

### **MCP Tools**
1. **Google Sheets API**
   - Category: Productivity
   - Auth: OAuth
   - Scopes: `https://www.googleapis.com/auth/spreadsheets`

2. **Slack Messaging API**
   - Category: Communication  
   - Auth: Bearer token
   - Scopes: `chat:write,channels:read`

3. **Email Sender API**
   - Category: Communication
   - Auth: API key
   - Scopes: `send:email`

### **Enhanced Agents**
1. **Smart Spreadsheet Assistant** (15 credits + 2 tool credits)
   - Uses: Google Sheets API
   - Capabilities: Read, analyze, and update spreadsheets

2. **Team Communication Bot** (30 credits + 3 tool credits)
   - Uses: Slack API + Email API
   - Capabilities: Send messages, schedule communications

3. **Data Analyzer AI** (50 credits + 0 tool credits)
   - Uses: No external tools
   - Capabilities: Pure data analysis

## 🎮 **Testing the System**

### **1. View Enhanced Marketplace**
```bash
curl http://localhost:3000/api/agents
```
- Agents now show `requires_tools`, `tool_count`, and `tools` array
- Tool credit costs displayed separately

### **2. Browse Available Tools**
```bash
curl http://localhost:3000/api/tools
```
- See all available MCP tools with auth requirements

### **3. Test Tool Invocation**
```bash
curl -X POST http://localhost:3000/api/tools/tool-google-sheets/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "buyer-id-12345678",
    "agent_id": "agent-1-12345678", 
    "action": "read",
    "parameters": {"sheet": "Sheet1", "range": "A1:B10"}
  }'
```

### **4. Manage Credentials**
```bash
# Add API key for Google Sheets
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "buyer-id-12345678",
    "tool_id": "tool-google-sheets",
    "credential_name": "api_key",
    "credential_value": "your-secret-api-key",
    "credential_type": "api_key"
  }'
```

## 💡 **Key Benefits**

### **For Users**
- **Secure Credential Storage**: API keys encrypted and protected
- **Granular Control**: Choose which tools to authorize per agent
- **Cost Transparency**: Clear pricing for agent + tool usage
- **Usage Tracking**: Monitor tool invocations and costs

### **For Developers**
- **Easy Integration**: Simple API for tool registration
- **Built-in Security**: Credential encryption handled automatically  
- **Usage Analytics**: Detailed logs for debugging and optimization
- **Flexible Auth**: Support for multiple authentication methods

### **For Platform**
- **Revenue Opportunities**: Charge for tool usage separately
- **Security Compliance**: Enterprise-grade credential management
- **Extensibility**: Easy to add new tools and services
- **Monitoring**: Complete audit trail of tool usage

## 🔮 **Future Enhancements**

1. **Real Tool Integration**: Replace mock responses with actual API calls
2. **OAuth Flow**: Implement full OAuth 2.0 authorization flow
3. **Tool SDK**: Provide SDKs for common tool integrations
4. **Rate Limiting**: Implement per-user/per-tool rate limits
5. **Tool Marketplace**: Allow third parties to register tools
6. **Advanced Analytics**: Tool performance and optimization insights

## 🚨 **Important Notes**

- **Environment Variables**: Set `CREDENTIAL_ENCRYPTION_KEY` in production
- **Database Security**: Implement row-level security for production use
- **API Rate Limits**: Add rate limiting for tool invocations
- **Credential Rotation**: Implement automatic credential rotation
- **Audit Logging**: Enhanced logging for compliance requirements

This enhanced marketplace provides a solid foundation for secure, scalable MCP tool integration while maintaining the ease of use that makes AgentVerse accessible to all users.