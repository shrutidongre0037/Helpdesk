import { auth } from './src/auth';

async function run() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: "test2@example.com",
        password: "password123",
        name: "Test"
      }
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
