async function forward(req, res, endpoint, method) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== method) {
    res.setHeader("Allow", method);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authorization = String(req.headers.authorization || "");
  if (!/^Bearer\\s+\\S+$/i.test(authorization)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  const shareToken = process.env.JON_STREAM_PREVIEW_SHARE_TOKEN;
  if (!shareToken) return res.status(503).json({ error: "JON Stream Preview access is not configured" });

  try {
    const url = new URL("https://jon-stream-jrwt581jr-jonjossy0-5772.vercel.app/api/admin");
    url.searchParams.set("_vercel_share", shareToken);
    url.searchParams.set("mode", endpoint);
    if (method === "GET" && req.query && req.query.email) url.searchParams.set("email", String(req.query.email));
    if (method === "GET" && req.query && req.query.refresh === "1") url.searchParams.set("refresh", "1");

    const options = { method, headers: { Accept: "application/json", Authorization: authorization }, cache: "no-store" };
    if (method === "POST") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(req.body && typeof req.body === "object" ? req.body : {});
    }
    const upstream = await fetch(url, options);
    const raw = await upstream.text();
    let payload;
    try { payload = raw ? JSON.parse(raw) : {}; }
    catch (_) { payload = { error: "JON Stream Admin API returned invalid JSON" }; }
    return res.status(upstream.status).json(payload);
  } catch (_) {
    return res.status(502).json({ error: "Could not reach the JON Stream Preview admin API" });
  }
}

module.exports = forward;
