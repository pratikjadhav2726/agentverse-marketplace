# 🚀 Supabase Onboarding Tutorial for AgentVerse Marketplace

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/) and sign in.
2. Click **New Project**.
3. Enter a **Project Name**, **Password**, and select a region.
4. Click **Create new project**.

---

## 2. Get Your Supabase Credentials

- In your project dashboard, go to **Project Settings > API**.
- Copy your **Project URL** and **anon/public API key**.
- Add these to your `.env.local` or environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## 3. Set Up the Database Schema

Go to the **SQL Editor** in Supabase and run the following SQL to create the tables:

```sql
-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  role text check (role in ('admin', 'seller', 'buyer')) not null default 'buyer',
  created_at timestamp with time zone default now()
);

-- AGENTS
create table agents (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id),
  name text not null,
  description text,
  price_per_use_credits integer not null,
  price_subscription_credits integer,
  price_one_time_credits integer,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- WALLETS
create table wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) unique,
  balance integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- CREDIT TRANSACTIONS
create table credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references users(id),
  to_user_id uuid references users(id),
  agent_id uuid references agents(id),
  amount integer not null,
  type text check (type in ('purchase', 'use', 'commission', 'payout', 'promo')),
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- PURCHASES
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  agent_id uuid references agents(id),
  created_at timestamp with time zone default now()
);

-- REVIEWS
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  agent_id uuid references agents(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

-- PAYOUT REQUESTS
create table payout_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  amount integer not null,
  status text check (status in ('pending', 'approved', 'rejected', 'paid')) default 'pending',
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);
```

---

## 4. Seed Initial Data (Optional)

You can insert an admin user and wallet for testing:

```sql
insert into users (id, email, name, role) values
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin', 'admin');

insert into wallets (user_id, balance) values
  ('00000000-0000-0000-0000-000000000001', 10000);
```

---

## 5. Connect Supabase to Your App

In your codebase, use the credentials from step 2 to initialize the Supabase client:

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 6. Useful Supabase CLI Commands

- **Install CLI:**  
  `npm install -g supabase`
- **Login:**  
  `supabase login`
- **Start local dev:**  
  `supabase start`
- **Push schema changes:**  
  `supabase db push`

---

## 7. Best Practices

- Always use **UUIDs** for user and agent IDs.
- Use **row-level security (RLS)** for production (see Supabase docs).
- Keep your anon/public key safe (never expose service role key to frontend).
- Use Supabase’s **auth** for user sign-up/sign-in if you want built-in authentication.

---

## 📦 Summary Table Structure

| Table               | Purpose                                 |
|---------------------|-----------------------------------------|
| users               | All users (admin, seller, buyer)        |
| agents              | AI agents listed in the marketplace     |
| wallets             | Credit balances for each user           |
| credit_transactions | All credit movements (use, commission)  |
| purchases           | Agent purchases by users                |
| reviews             | User reviews for agents                 |
| payout_requests     | Seller payout requests                  |

---

## 📝 Next Steps

- Run the SQL in your Supabase SQL editor.
- Add your Supabase credentials to your environment.
- Use the provided client in your backend/frontend code.
- Start building features using the API and database! 