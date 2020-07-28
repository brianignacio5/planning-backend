export default {
  jwtSecret: process.env.JWT_SECRET || "someSecreToken",
  DB: {
    URI:
      process.env.MONGO_DB_URI || "mongodb://localhost:17569/planning",
    USER: process.env.MONGODB_USER,
    PASSWORD: process.env.MONGODB_PASSWORD,
  },
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:8080/",
  GITHUB: {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID || "clientId",
    CLIENT_SECRET: process.env.GITHUB_SECRET || "someGithubSecret",
  },
  LINKEDIN: {
    CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || "clientId",
    CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || "someLinkedInSecret",
  },
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "clientId",
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "someGoogleSecret",
  },
  PORT: process.env.PORT,
};
