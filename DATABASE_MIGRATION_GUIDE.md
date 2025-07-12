# Database Migration Guide: SQLite to Supabase

This guide will help you migrate your AgentVerse marketplace from SQLite (development) to Supabase (production) while maintaining the ability to use SQLite for local development.

## 🎯 Overview

The project now supports dual database configurations:
- **Development**: SQLite (local file-based database)
- **Production**: Supabase (PostgreSQL cloud database)

The system automatically switches based on the `NODE_ENV` environment variable.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project in your Supabase dashboard
3. **Environment Variables**: Set up your Supabase credentials

## 🚀 Step-by-Step Migration

### 1. Set Up Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/) and sign in
2. Click **New Project**
3. Enter a **Project Name**, **Password**, and select a region
4. Click **Create new project**
5. Wait for the project to be created (this may take a few minutes)

### 2. Get Your Supabase Credentials

1. In your project dashboard, go to **Project Settings > API**
2. Copy your **Project URL** and **anon/public API key**
3. Also note your **Database Password** (you'll need this for the connection string)

### 3. Set Up Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database Connection (for production)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Optional: Alternative Supabase DB URL format
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Encryption key for credentials (use a strong key in production)
CREDENTIAL_ENCRYPTION_KEY=your-32-char-secret-key-here!!
```

**Important**: Replace the placeholders with your actual values:
- `your-project-url`: Your Supabase project URL
- `your-anon-key`: Your Supabase anon/public key
- `[YOUR-PASSWORD]`: Your database password
- `[YOUR-PROJECT-REF]`: Your project reference ID

### 4. Create Database Schema in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/migrate-to-supabase.sql`
4. Click **Run** to execute the schema creation

This will create all the necessary tables with proper indexes and constraints.

### 5. Migrate Your Data (Optional)

If you have existing data in your SQLite database that you want to migrate:

1. Run the migration script:
   ```bash
   node scripts/migrate-data.js
   ```

2. This will generate a file `scripts/supabase-import.sql`

3. Copy the contents of this file and run it in your Supabase SQL Editor

4. Verify the migration by checking your data:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM agents;
   ```

### 6. Update Your Application

The application has been updated to automatically use:
- **SQLite** when `NODE_ENV` is not set to `production`
- **Supabase** when `NODE_ENV` is set to `production`

To test the production setup locally:

```bash
# Set production mode
export NODE_ENV=production

# Start the application
npm run dev
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes (production) |
| `SUPABASE_DB_URL` | Alternative DB URL | No |
| `CREDENTIAL_ENCRYPTION_KEY` | Key for encrypting credentials | Yes |
| `NODE_ENV` | Environment mode | Yes (production) |

### Database Switching Logic

The system automatically switches databases based on `NODE_ENV`:

```typescript
if (process.env.NODE_ENV === 'production') {
  // Use Supabase (PostgreSQL)
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  // ... PostgreSQL connection
} else {
  // Use SQLite
  const sqlite = new Database('agentverse.db');
  // ... SQLite connection
}
```

## 🧪 Testing the Migration

### Test Development Mode (SQLite)
```bash
# Ensure NODE_ENV is not set to production
unset NODE_ENV
npm run dev
```

### Test Production Mode (Supabase)
```bash
# Set production mode
export NODE_ENV=production
npm run dev
```

### Verify Database Connection

You can test the database connection by visiting:
- Development: `http://localhost:3000/api/test-db`
- Production: The same endpoint will now use Supabase

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Database Passwords**: Use strong, unique passwords for your Supabase database
3. **Encryption Key**: Use a strong 32-character key for credential encryption
4. **Row Level Security**: Consider enabling RLS in Supabase for production

## 📊 Database Schema Differences

| Feature | SQLite | Supabase (PostgreSQL) |
|---------|--------|----------------------|
| ID Type | TEXT | UUID |
| Timestamps | DATETIME | TIMESTAMP WITH TIME ZONE |
| JSON Fields | TEXT | JSONB |
| Indexes | Basic | Advanced (GIN, etc.) |
| Constraints | Basic | Advanced |

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your `DATABASE_URL` format
   - Check your Supabase database password
   - Ensure your IP is not blocked by Supabase

2. **Schema Errors**
   - Run the migration script again
   - Check for conflicting table names
   - Verify all required extensions are enabled

3. **Data Migration Issues**
   - Check for data type mismatches
   - Verify foreign key relationships
   - Ensure UUIDs are properly formatted

### Getting Help

1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the migration logs in your terminal
3. Check the Supabase dashboard for connection issues

## 🎉 Migration Complete!

Once you've completed these steps:

1. ✅ Your application will use SQLite for development
2. ✅ Your application will use Supabase for production
3. ✅ Your data will be safely migrated (if you chose to migrate)
4. ✅ Your application will automatically switch based on environment

You can now deploy your application to production with confidence that it will use your Supabase database!

## 📝 Next Steps

1. **Deploy to Production**: Set `NODE_ENV=production` in your production environment
2. **Monitor Performance**: Use Supabase's built-in monitoring tools
3. **Backup Strategy**: Set up automated backups in Supabase
4. **Scaling**: Consider upgrading your Supabase plan as needed