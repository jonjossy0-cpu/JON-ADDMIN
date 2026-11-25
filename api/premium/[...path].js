const ALLOWED = new Set(["config", "grants", "grant"]);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const rawPath = req.query && req.query.path;
  let endpoint = Array.isArray(rawPath) ? rawPath[0] : rawPath;
  if (!endpoint && req.url) {
    try { endpoint = new URL(req.url, "https://admin-preview.invalid").pathname.split("/").filter(Boolean).pop(); } catch (_) {}
  }
  if (!endpoint || !ALLOWED.has(String(endpoint))) {
    return res.status(404).json({ error: "Premium endpoint not found" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authorization = String(req.headers.authorization || "");
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const options = {
      method: req.method,
      headers: {
        Accept: "application/json",
        Authorization: authorization
      },
      cache: "no-store"
    };

    if (req.method === "POST") {
      options.headers["Content-Type"] = "application/json";
      options.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    }

    const upstream = await fetch("https://jon-stream.vercel.app/api/subscription/" + endpoint, options);
    const raw = await upstream.text();
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (_) {
      payload = { error: "Subscription service returned an invalid response" };
    }

    return res.status(upstream.status).json(payload);
  } catch (_) {
    return res.status(502).json({ error: "Could not reach the JON Stream Premium service" });
  }
};
