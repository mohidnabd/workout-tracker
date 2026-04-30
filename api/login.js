import crypto from "node:crypto";

const parseBody = async (req) => {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

const createToken = (username, secret) => {
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${username}.${issuedAt}`)
    .digest("hex");

  return Buffer.from(`${username}.${issuedAt}.${signature}`).toString("base64url");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const expectedUsername = process.env.WORKOUT_AUTH_USERNAME;
  const expectedPassword = process.env.WORKOUT_AUTH_PASSWORD;
  const sessionSecret = process.env.WORKOUT_SESSION_SECRET || expectedPassword;

  if (!expectedUsername || !expectedPassword) {
    res.status(500).json({ message: "Authentication is not configured" });
    return;
  }

  const { username, password } = await parseBody(req);

  if (username !== expectedUsername || password !== expectedPassword) {
    res.status(401).json({ message: "Invalid username or password" });
    return;
  }

  res.status(200).json({
    token: createToken(expectedUsername, sessionSecret),
    user: {
      email: expectedUsername,
      name: "Mohideen Salam",
    },
  });
}
