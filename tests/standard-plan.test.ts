import { test, expect } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { STANDARD_PLAN } from '../src/lib/standardPlan';

const USER = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';

async function database() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('test.role',true) $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY, credits integer);
    CREATE TABLE public.subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid UNIQUE,status text,plan_type text,started_at timestamptz,expires_at timestamptz,auto_renew boolean,payment_provider text,payment_provider_subscription_id text,amount numeric,currency text,last_credit_grant_at timestamptz,updated_at timestamptz);
    CREATE TABLE public.subscription_credits_bonus(user_id uuid PRIMARY KEY,credits integer,is_frozen boolean,updated_at timestamptz);
    CREATE TABLE public.author_registrations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL, title text NOT NULL);
    CREATE TABLE public.user_activity_logs(user_id uuid,action text,metadata jsonb);
    CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
    CREATE FUNCTION public.can_moderator_manage_user(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION public.grant_monthly_subscription_credits(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN UPDATE profiles SET credits=credits+2 WHERE id=p_user_id; RETURN '{"regular_credits_added":2}'::jsonb; END $$;
    INSERT INTO profiles VALUES('${USER}',7),('${OTHER}',11);
    SELECT set_config('test.role','service_role',false);
  `);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261028214626_9ff139ba-8514-4f38-aef4-aeac00147d4e.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/20261028214653_0f64fd1a-ec4c-4687-b897-ced5cfebe781.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/20261028215400_ed3c58e2-e2ac-4e16-8598-ae6d206b3983.sql', import.meta.url), 'utf8'));
  return db;
}

async function order(db: PGlite, payment = 'subscription_test', user = USER) {
  await db.query(`INSERT INTO subscription_launch_orders(user_id,provider,payment_id) VALUES($1,'openpix',$2)`, [user, payment]);
}
async function activate(db: PGlite, payment = 'subscription_test', amount = 97) {
  return db.query(`SELECT activate_launch_subscription('openpix',$1,$2,now()) result`, [payment, amount]);
}
async function balances(db: PGlite) {
  return (await db.query<{ credits: number; remaining: number }>(`SELECT p.credits,a.remaining FROM profiles p LEFT JOIN subscription_registration_allowances a ON a.user_id=p.id WHERE p.id=$1`, [USER])).rows[0];
}

test('commercial values are R$97 launch, R$127 normal, 50 registrations and 30 days', () => {
  expect(STANDARD_PLAN.price).toBe(97);
  expect(STANDARD_PLAN.regularPrice).toBe(127);
  expect(STANDARD_PLAN.registrations).toBe(50);
  expect(STANDARD_PLAN.cycleDays).toBe(30);
});

test('underpaid payment cannot activate the R$97 subscription', async () => {
  const db = await database();
  try { await order(db); await expect(activate(db, 'subscription_test', 29.99)).rejects.toThrow('mismatch');
    expect((await db.query(`SELECT * FROM subscription_registration_allowances`)).rows.length).toBe(0);
  } finally { await db.close(); }
});

test('paid cycle grants exactly 50 for 30 days without changing 7 standalone credits', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    expect(await balances(db)).toEqual({credits:7,remaining:50});
    const {rows} = await db.query<{days:number}>(`SELECT extract(epoch FROM cycle_end-cycle_start)/86400 AS days FROM subscription_registration_allowances`);
    expect(Number(rows[0].days)).toBe(30);
    expect((await db.query<{plan_type:string}>(`SELECT plan_type FROM subscriptions`)).rows[0].plan_type).toBe('pro');
  } finally { await db.close(); }
});

test('webhook/reconsulta duplicate does not refill a consumed allowance or add avulsos', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await db.query(`INSERT INTO author_registrations(user_id,title) VALUES($1,'Obra')`,[USER]);
    await activate(db); await db.query(`SELECT grant_monthly_subscription_credits($1)`,[USER]);
    expect(await balances(db)).toEqual({credits:7,remaining:49});
  } finally { await db.close(); }
});

test('renewal replaces 12 unused registrations with 50, never 62', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await db.exec(`UPDATE subscription_registration_allowances SET remaining=12,cycle_start=now()-interval '31 days',cycle_end=now()-interval '1 day'; UPDATE subscriptions SET status='expired';`);
    await order(db,'renewal'); await activate(db,'renewal');
    expect(await balances(db)).toEqual({credits:7,remaining:50});
  } finally { await db.close(); }
});

test('50 registrations consume only allowance; registration 51 consumes one avulso', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await db.query(`INSERT INTO author_registrations(user_id,title) SELECT $1,'Obra '||i FROM generate_series(1,50)i`,[USER]);
    expect(await balances(db)).toEqual({credits:7,remaining:0});
    await db.query(`INSERT INTO author_registrations(user_id,title) VALUES($1,'Obra 51')`,[USER]);
    expect(await balances(db)).toEqual({credits:6,remaining:0});
  } finally { await db.close(); }
});

test('expired allowance is unavailable but purchased standalone credits do not expire', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await db.exec(`UPDATE subscription_registration_allowances SET cycle_start=now()-interval '31 days',cycle_end=now()-interval '1 day';`);
    await db.query(`INSERT INTO author_registrations(user_id,title) VALUES($1,'Obra')`,[USER]);
    expect(await balances(db)).toEqual({credits:6,remaining:50});
    const balance = (await db.query<{balance:{monthly_remaining:number}}>(`SELECT get_registration_balance($1) balance`,[USER])).rows[0].balance;
    expect(balance.monthly_remaining).toBe(0);
  } finally { await db.close(); }
});

test('failed registration INSERT rolls back consumption', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await expect(db.query(`INSERT INTO author_registrations(user_id,title) VALUES($1,NULL)`,[USER])).rejects.toThrow();
    expect(await balances(db)).toEqual({credits:7,remaining:50});
  } finally { await db.close(); }
});

test('old active subscriber is not migrated by a new payment', async () => {
  const db = await database();
  try { await db.query(`INSERT INTO subscriptions(user_id,status,plan_type,amount,expires_at) VALUES($1,'active','pro',29.99,now()+interval '10 days')`,[USER]);
    await order(db); await expect(activate(db)).rejects.toThrow('explicit migration');
    expect((await db.query<{amount:number}>(`SELECT amount FROM subscriptions`)).rows[0].amount).toBe('29.99');
    expect((await balances(db)).credits).toBe(7);
  } finally { await db.close(); }
});

test('unrelated old subscription and pending payment stay intact', async () => {
  const db = await database();
  try { await db.query(`INSERT INTO subscriptions(user_id,status,plan_type,amount,payment_provider_subscription_id) VALUES($1,'pending','pro',29.99,'old_payment')`,[OTHER]);
    await order(db); await activate(db);
    const legacy=(await db.query(`SELECT status,amount,payment_provider_subscription_id FROM subscriptions WHERE user_id=$1`,[OTHER])).rows[0];
    expect(legacy).toEqual({status:'pending',amount:'29.99',payment_provider_subscription_id:'old_payment'});
  } finally { await db.close(); }
});

test('caller cannot grant cycles or consume another user credits', async () => {
  const db = await database();
  try { await order(db); await db.exec(`SELECT set_config('test.role','authenticated',false);SELECT set_config('test.uid','${OTHER}',false);`);
    await expect(activate(db)).rejects.toThrow('Service role required');
    await expect(db.query(`SELECT use_credits_for_registration($1,1)`,[USER])).rejects.toThrow('Access denied');
    await expect(db.query(`SELECT use_credits_for_registration($1,-1)`,[OTHER])).rejects.toThrow('Invalid credit quantity');
  } finally { await db.close(); }
});

test('allowance cannot exceed 50 and a second payment cannot reset an active cycle', async () => {
  const db = await database();
  try { await order(db); await activate(db);
    await expect(db.exec(`UPDATE subscription_registration_allowances SET remaining=51`)).rejects.toThrow('Invalid monthly allowance');
    await order(db,'another_payment'); await expect(activate(db,'another_payment')).rejects.toThrow('has not ended');
    expect(await balances(db)).toEqual({credits:7,remaining:50});
  } finally { await db.close(); }
});

test('pending legacy payment cannot be replaced by new launch activation', async () => {
  const db = await database();
  try {
    await db.query(`INSERT INTO subscriptions(user_id,status,plan_type,amount,payment_provider_subscription_id) VALUES($1,'pending','pro',29.99,'old_payment')`,[USER]);
    await order(db); await expect(activate(db)).rejects.toThrow('reconciliation required');
    expect((await db.query(`SELECT payment_provider_subscription_id FROM subscriptions WHERE user_id=$1`,[USER])).rows[0].payment_provider_subscription_id).toBe('old_payment');
    expect((await db.query(`SELECT status FROM subscription_launch_orders`)).rows[0].status).toBe('pending');
  } finally { await db.close(); }
});

test('customers can read only their own allowance and cannot write allowance or activate cycles', async () => {
  const db = await database();
  try {
    await order(db); await activate(db);
    await db.exec(`GRANT USAGE ON SCHEMA auth TO authenticated; SELECT set_config('test.uid','${OTHER}',false); SET ROLE authenticated;`);
    expect((await db.query(`SELECT * FROM subscription_registration_allowances`)).rows.length).toBe(0);
    expect((await db.query(`SELECT * FROM subscription_launch_orders`)).rows.length).toBe(0);
    await expect(db.exec(`UPDATE subscription_registration_allowances SET remaining=50`)).rejects.toThrow('permission denied');
    await expect(activate(db)).rejects.toThrow('permission denied');
    await db.exec(`SELECT set_config('test.uid','${USER}',false);`);
    expect((await db.query(`SELECT remaining FROM subscription_registration_allowances`)).rows[0].remaining).toBe(50);
  } finally { await db.close(); }
});