export default {
  jwtSecret: process.env.JWT_SECRET || "someSecreToken",
  DB: {
    URI: process.env.MONGO_DB_URI || "mongodb://localhost:17569/planning",
    USER: process.env.MONGODB_USER,
    PASSWORD: process.env.MONGODB_PASSWORD,
  },
  GITHUB: {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    CLIENT_SECRET: process.env.GITHUB_SECRET || "someGithubSecret"
  },
  PORT: process.env.PORT
};
