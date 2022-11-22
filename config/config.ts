import "https://deno.land/x/dotenv@v3.2.0/load.ts";

export default {
  env: Deno.env.get("NODE_ENV") || "development",
  port: Deno.env.get("PORT") || 8000,
  jwtSecret: Deno.env.get("JWT_SECRET"),
  jwtExpirationInterval: Deno.env.get("JWT_EXPIRATION_MINUTES") || 30,
  mongo: {
    uri: Deno.env.get("MONGO_URI") || "mongodb://localhost:27017",
  },
  logs: Deno.env.get("NODE_ENV") === 'production' ? 'combined' : 'dev',
  emailConfig: {
    host: Deno.env.get("EMAIL_HOST"),
    port: Deno.env.get("EMAIL_PORT"),
    username: Deno.env.get("EMAIL_USERNAME"),
    password: Deno.env.get("EMAIL_PASSWORD"),
  },
}