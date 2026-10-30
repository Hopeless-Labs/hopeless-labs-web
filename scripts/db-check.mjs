// Connectivity smoke test for the hosted Supabase project.
//   npm run db:check        (loads .env.local, then runs this file)
//
// Checks in order: REST reachable with the publishable key, auth service alive,
// secret key accepted, and finally lists the tables currently exposed in `public`.
// Exits non-zero on the first failure, so it is safe to use in CI.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishable) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

const results = [];

async function probe(label, path, key, expect) {
  const res = await fetch(`${url}${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const ok = expect.includes(res.status);
  results.push({ label, status: res.status, ok });
  console.log(`${ok ? "ok  " : "FAIL"}  ${label.padEnd(34)} HTTP ${res.status}`);
  return res;
}

console.log(`project  ${url}`);

// A publishable key on `/rest/v1/` answers 401 ("Secret API key required") by
// design — it only opens the swagger doc to secret keys. Hitting a table path
// instead proves the key is accepted: 404 PGRST205 means "table missing", not
// "unauthorised".
await probe("rest + publishable key", "/rest/v1/hopeless_labs_probe", publishable, [404]);
await probe("auth service", "/auth/v1/health", publishable, [200]);
const openapi = await probe("rest + secret key", "/rest/v1/", secret ?? "", [200]);

if (openapi.ok) {
  const schema = await openapi.json();
  const tables = Object.keys(schema.definitions ?? {});
  console.log(`\npublic tables: ${tables.length ? tables.join(", ") : "(none yet)"}`);
}

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
