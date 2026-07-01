import { Client } from "pg";

async function check() {
  const client = new Client({ connectionString: "postgresql://postgres:password@localhost:5432/helpdesk?schema=public" });
  await client.connect();
  const res = await client.query("SELECT id, name, data, state, output FROM pgboss.job WHERE data->>'ticketId' = '212'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

check();
