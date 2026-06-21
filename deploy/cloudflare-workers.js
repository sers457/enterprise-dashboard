// =============================================================================
// Enterprise Admin Dashboard - Cloudflare Worker API Gateway
// =============================================================================
// This worker serves as an API gateway, handling routing, caching, 
// authentication, rate limiting, and security for the dashboard.
//
// Deploy:
//   wrangler deploy deploy/cloudflare-workers.js
//   wrangler secret put API_BACKEND_URL
//   wrangler secret put API_KEY
// =============================================================================

// Configuration - set via wrangler secrets or env vars
const CONFIG = {
  BACKEND_URL: API_BACKEND_URL || "https://api.yourdomain.com",
  API_KEY: API_KEY || "",
  ENVIRONMENT: ENVIRONMENT || "production",
  ALLOWED_ORIGINS: [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://staging.yourdomain.com",
  ],
  RATE_LIMIT: {
    enabled: true,
    requestsPerMinute: 100,
    burstSize: 20,
  },
  CACHE: {
    ttl: {
      ok: 60,
      redirects: 10,
      clientError: 5,
      serverError: 0,
    },
    staticExtensions: [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot"],
  },
};

// Rate limiting store
const rateLimitStore = {};

async function handleRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  const origin = request.headers.get("Origin") || "";
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "";
  const contentType = request.headers.get("Content-Type") || "";

  // ===========================================================================
  // CORS Handling
  // ===========================================================================
  const corsHeaders = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, X-CSRF-Token",
    "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-Request-ID",
    "Access-Control-Max-Age": "86400",
  };

  if (CONFIG.ALLOWED_ORIGINS.includes(origin) || CONFIG.ENVIRONMENT === "development") {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Vary"] = "Origin";
  } else if (!origin) {
    corsHeaders["Access-Control-Allow-Origin"] = "*";
  }

  // Handle preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // ===========================================================================
  // Generate Request ID
  // ===========================================================================
  const requestId = crypto.randomUUID();

  // ===========================================================================
  // Rate Limiting
  // ===========================================================================
  if (CONFIG.RATE_LIMIT.enabled) {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / 60) * 60;

    if (!rateLimitStore[clientIp]) {
      rateLimitStore[clientIp] = { count: 0, window: windowStart };
    }

    const clientLimit = rateLimitStore[clientIp];
    if (clientLimit.window < windowStart) {
      clientLimit.count = 0;
      clientLimit.window = windowStart;
    }

    clientLimit.count++;
    const remaining = Math.max(0, CONFIG.RATE_LIMIT.requestsPerMinute - clientLimit.count);

    corsHeaders["X-RateLimit-Limit"] = CONFIG.RATE_LIMIT.requestsPerMinute.toString();
    corsHeaders["X-RateLimit-Remaining"] = remaining.toString();

    if (clientLimit.count > CONFIG.RATE_LIMIT.requestsPerMinute) {
      return new Response(JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: 60,
        requestId,
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-Request-ID": requestId,
        },
      });
    }
  }

  // ===========================================================================
  // Security Headers
  // ===========================================================================
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Request-ID": requestId,
    "X-Powered-By": "",
    "X-DNS-Prefetch-Control": "on",
    "Expect-CT": "max-age=86400, enforce",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };

  // ===========================================================================
  // API Routing
  // ===========================================================================
  if (path.startsWith("/api/") || path.startsWith("/ws")) {
    const targetUrl = `${CONFIG.BACKEND_URL}${path}${url.search}`;

    // WebSocket upgrade
    if (path.startsWith("/ws")) {
      return handleWebSocket(request, targetUrl);
    }

    // Modify request headers for backend
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("X-Forwarded-For", clientIp);
    modifiedHeaders.set("X-Real-IP", clientIp);
    modifiedHeaders.set("X-Request-ID", requestId);
    modifiedHeaders.set("X-Cloudflare-Worker", "true");
    modifiedHeaders.set("CF-IPCountry", request.cf?.country || "");

    if (CONFIG.API_KEY) {
      modifiedHeaders.set("X-Internal-API-Key", CONFIG.API_KEY);
    }

    // Forward to backend
    const response = await fetch(targetUrl, {
      method,
      headers: modifiedHeaders,
      body: method !== "GET" && method !== "HEAD" ? request.body : undefined,
    });

    // Cache successful GET responses
    const isStatic = CONFIG.CACHE.staticExtensions.some((ext) => path.endsWith(ext));
    const cacheControl = isStatic
      ? "public, max-age=31536000, immutable"
      : `public, max-age=${CONFIG.CACHE.ttl[response.ok ? "ok" : response.status >= 500 ? "serverError" : response.status >= 400 ? "clientError" : "redirects"]}`;

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Cache-Control", cacheControl);

    // Add security and CORS headers
    Object.entries({ ...corsHeaders, ...securityHeaders }).forEach(([key, value]) => {
      if (value) responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  // ===========================================================================
  // Static Asset Caching
  // ===========================================================================
  const isAsset = CONFIG.CACHE.staticExtensions.some((ext) => path.endsWith(ext));
  if (isAsset) {
    const response = await fetch(request);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    responseHeaders.set("X-Request-ID", requestId);
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  // ===========================================================================
  // Health Check
  // ===========================================================================
  if (path === "/health" || path === "/api/health") {
    const backendHealth = await fetch(`${CONFIG.BACKEND_URL}/api/health`, {
      headers: { "X-Request-ID": requestId },
    }).then((r) => r.ok).catch(() => false);

    return new Response(JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "enterprise-dashboard-worker",
      requestId,
      backend: backendHealth ? "healthy" : "unhealthy",
      version: "1.0.0",
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  // ===========================================================================
  // SPA Fallback - serve index.html
  // ===========================================================================
  const response = await fetch(request);
  if (response.status === 404) {
    const indexResponse = await fetch(`${new URL(request.url).origin}/index.html`);
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        "Content-Type": "text/html",
      },
    });
  }

  return response;
}

// =============================================================================
// WebSocket Proxy
// =============================================================================
async function handleWebSocket(request, targetUrl) {
  const webSocketUrl = targetUrl.replace(/^http/, "ws");

  const [client, server] = Object.values(new WebSocketPair());

  server.accept();

  const backendUrl = new URL(webSocketUrl);
  backendUrl.protocol = backendUrl.protocol === "wss:" ? "https:" : "http:";

  const response = await fetch(backendUrl.toString(), {
    headers: {
      ...request.headers,
      Upgrade: "websocket",
      "X-Cloudflare-Worker": "true",
    },
  });

  if (response.status !== 101) {
    server.close(1011, "WebSocket handshake failed");
    return new Response(null, { status: 502 });
  }

  // Relay messages between client and server
  server.addEventListener("message", (event) => {
    client.send(event.data);
  });

  server.addEventListener("close", (event) => {
    client.close(event.code, event.reason);
  });

  client.addEventListener("message", (event) => {
    server.send(event.data);
  });

  client.addEventListener("close", (event) => {
    server.close(event.code, event.reason);
  });

  return new Response(null, { status: 101, webSocket: client });
}

// =============================================================================
// Scheduled Tasks (Cron Triggers)
// =============================================================================
async function handleScheduled(event) {
  switch (event.cron) {
    case "*/5 * * * *":
      // Health check every 5 minutes
      await fetch(`${CONFIG.BACKEND_URL}/api/health`);
      break;
    case "0 */6 * * *":
      // Cache warmup every 6 hours
      await warmCache();
      break;
    case "0 0 * * *":
      // Daily report
      await fetch(`${CONFIG.BACKEND_URL}/api/admin/daily-report`, {
        headers: { "X-Internal-API-Key": CONFIG.API_KEY },
      });
      break;
  }
}

async function warmCache() {
  const endpoints = [
    "/api/v1/analytics/summary",
    "/api/v1/dashboard/metrics",
    "/api/v1/users/stats",
  ];

  for (const endpoint of endpoints) {
    await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
      headers: { "X-Internal-API-Key": CONFIG.API_KEY },
    }).catch(() => {});
  }
}

export default {
  async fetch(request, env, ctx) {
    Object.assign(CONFIG, {
      BACKEND_URL: env.API_BACKEND_URL || CONFIG.BACKEND_URL,
      API_KEY: env.API_KEY || CONFIG.API_KEY,
      ENVIRONMENT: env.ENVIRONMENT || CONFIG.ENVIRONMENT,
    });

    return handleRequest(request);
  },

  async scheduled(event, env, ctx) {
    Object.assign(CONFIG, {
      BACKEND_URL: env.API_BACKEND_URL || CONFIG.BACKEND_URL,
      API_KEY: env.API_KEY || CONFIG.API_KEY,
    });

    return handleScheduled(event);
  },
};
