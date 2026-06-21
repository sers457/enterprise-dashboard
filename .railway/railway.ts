import { defineRailway, project, service } from "railway/iac";

export default defineRailway(() => {
  const backend = service("backend", {
    source: {
      repo: "sers457/enterprise-dashboard",
      branch: "main",
    },
    rootDirectory: "backend/",
    build: "pip install -r requirements.txt",
    start: "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    env: {
      ENVIRONMENT: "production",
      DATABASE_URL: "sqlite:///./data/app.db",
      CORS_ORIGINS: '["https://sers457.github.io"]',
      SECRET_KEY: process.env.SECRET_KEY || "change-me-in-production",
      APP_NAME: "Enterprise Dashboard API",
    },
  });

  return project("enterprise-dashboard", {
    resources: [backend],
  });
});
