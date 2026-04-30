import react from "@vitejs/plugin-react";
import crypto from "node:crypto";
import { defineConfig, loadEnv } from "vite";

const readJsonBody = (req) =>
  new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });

const createToken = (username, secret) => {
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${username}.${issuedAt}`)
    .digest("hex");

  return Buffer.from(`${username}.${issuedAt}.${signature}`).toString("base64url");
};

const workoutAuthDevApi = () => ({
  name: "workout-auth-dev-api",
  configureServer(server) {
    server.middlewares.use("/api/login", async (req, res) => {
      res.setHeader("Content-Type", "application/json");

      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end(JSON.stringify({ message: "Method not allowed" }));
        return;
      }

      const env = loadEnv(server.config.mode, process.cwd(), "");
      const expectedUsername = env.WORKOUT_AUTH_USERNAME;
      const expectedPassword = env.WORKOUT_AUTH_PASSWORD;
      const sessionSecret = env.WORKOUT_SESSION_SECRET || expectedPassword;

      if (!expectedUsername || !expectedPassword) {
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Authentication is not configured" }));
        return;
      }

      const { username, password } = await readJsonBody(req);
      const matches = username === expectedUsername && password === expectedPassword;

      if (!matches) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "Invalid username or password" }));
        return;
      }

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          token: createToken(expectedUsername, sessionSecret),
          user: {
            email: expectedUsername,
            name: "Mohideen Salam",
          },
        }),
      );
    });
  },
});

export default defineConfig({
  plugins: [react(), workoutAuthDevApi()],
});
