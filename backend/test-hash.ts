import { auth } from './src/auth';

async function run() {
  const ctx = await auth.$context;
  console.log(Object.keys(ctx));
  console.log(Object.keys(ctx.password));
}
run();
