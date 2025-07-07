import { NextRequest, NextResponse } from 'next/server';
import { sqlite, encryptCredential, decryptCredential } from '../../../lib/database';
import { UserCredential } from '../../../lib/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');
    const tool_id = searchParams.get('tool_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        uc.id, uc.user_id, uc.tool_id, uc.credential_name, 
        uc.credential_type, uc.expires_at, uc.created_at, uc.updated_at,
        mt.name as tool_name, mt.category as tool_category, mt.auth_type
      FROM user_credentials uc
      JOIN mcp_tools mt ON uc.tool_id = mt.id
      WHERE uc.user_id = ?
    `;
    const params: any[] = [user_id];

    if (tool_id) {
      query += ' AND uc.tool_id = ?';
      params.push(tool_id);
    }

    query += ' ORDER BY uc.created_at DESC';

    const credentials = sqlite.prepare(query).all(...params);

    // Return credentials without encrypted values for security
    const safeCredentials = credentials.map((cred: any) => ({
      id: cred.id,
      user_id: cred.user_id,
      tool_id: cred.tool_id,
      credential_name: cred.credential_name,
      credential_type: cred.credential_type,
      expires_at: cred.expires_at,
      created_at: cred.created_at,
      updated_at: cred.updated_at,
      tool_name: cred.tool_name,
      tool_category: cred.tool_category,
      auth_type: cred.auth_type,
      has_value: true // Indicates credential exists
    }));

    return NextResponse.json({ credentials: safeCredentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      tool_id,
      credential_name,
      credential_value,
      credential_type = 'api_key',
      expires_at
    } = body;

    // Validate required fields
    if (!user_id || !tool_id || !credential_name || !credential_value) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, tool_id, credential_name, credential_value' },
        { status: 400 }
      );
    }

    // Validate credential_type
    if (!['api_key', 'oauth_token', 'oauth_refresh_token', 'username_password'].includes(credential_type)) {
      return NextResponse.json(
        { error: 'Invalid credential_type' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = sqlite.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify tool exists
    const tool = sqlite.prepare('SELECT id FROM mcp_tools WHERE id = ?').get(tool_id);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Encrypt the credential value
    const encryptedValue = encryptCredential(credential_value);

    // Generate unique ID
    const credentialId = 'cred-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert or update credential (upsert logic)
    const existingCred = sqlite.prepare(`
      SELECT id FROM user_credentials 
      WHERE user_id = ? AND tool_id = ? AND credential_name = ?
    `).get(user_id, tool_id, credential_name);

    if (existingCred) {
      // Update existing credential
      sqlite.prepare(`
        UPDATE user_credentials 
        SET encrypted_value = ?, credential_type = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(encryptedValue, credential_type, expires_at, (existingCred as any).id);

      const updatedCred = sqlite.prepare(`
        SELECT id, user_id, tool_id, credential_name, credential_type, expires_at, created_at, updated_at
        FROM user_credentials WHERE id = ?
      `).get((existingCred as any).id) as UserCredential;

      return NextResponse.json({ 
        credential: { ...updatedCred, has_value: true },
        message: 'Credential updated successfully'
      });
    } else {
      // Insert new credential
      sqlite.prepare(`
        INSERT INTO user_credentials (
          id, user_id, tool_id, credential_name, encrypted_value, credential_type, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        credentialId,
        user_id,
        tool_id,
        credential_name,
        encryptedValue,
        credential_type,
        expires_at
      );

      const newCred = sqlite.prepare(`
        SELECT id, user_id, tool_id, credential_name, credential_type, expires_at, created_at, updated_at
        FROM user_credentials WHERE id = ?
      `).get(credentialId) as UserCredential;

      return NextResponse.json({ 
        credential: { ...newCred, has_value: true },
        message: 'Credential created successfully'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error managing credential:', error);
    return NextResponse.json({ error: 'Failed to manage credential' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const credential_id = searchParams.get('credential_id');
    const user_id = searchParams.get('user_id');

    if (!credential_id || !user_id) {
      return NextResponse.json(
        { error: 'credential_id and user_id parameters are required' },
        { status: 400 }
      );
    }

    // Verify credential belongs to user
    const credential = sqlite.prepare(`
      SELECT id FROM user_credentials 
      WHERE id = ? AND user_id = ?
    `).get(credential_id, user_id);

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found or access denied' }, { status: 404 });
    }

    // Delete credential
    sqlite.prepare('DELETE FROM user_credentials WHERE id = ?').run(credential_id);

    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}