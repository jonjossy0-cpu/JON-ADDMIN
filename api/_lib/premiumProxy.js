module.exports = function premiumProxy(endpoint) {
  const allowed = new Set(["config", "grants", "grant"]);
  if (!allowed.has(endpoint)) throw new Error("Unsupported Premium endpoint");

  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

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
        headers: { Accept: "application/json", Authorization: authorization },
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
};
