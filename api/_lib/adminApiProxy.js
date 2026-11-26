async function forward(req, res, endpoint, method) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== method) {
    res.setHeader("Allow", method);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authorization = String(req.headers.authorization || "");
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  const shareToken = process.env.JON_STREAM_PREVIEW_SHARE_TOKEN;
  if (!shareToken) return res.status(503).json({ error: "JON Stream Preview access is not configured" });

  try {
    const url = new URL("https://jon-stream-3fctdcyh2-jonjossy0-5772.vercel.app/api/admin");
    url.searchParams.set("_vercel_share", shareToken);
    url.searchParams.set("mode", endpoint);
    if (method === "GET" && req.query) {
      for (const key of ["email", "limit", "pageToken", "refresh"]) {
        const value = req.query[key];
        if (value !== undefined && value !== null && String(value) !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const options = { method, headers: { Accept: "application/json", Authorization: authorization }, cache: "no-store", redirect: "manual" };
    if (method === "POST") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(req.body && typeof req.body === "object" ? req.body : {});
    }
    let currentUrl = url;
    let upstream;
    let cookie = "";
    for (let hop = 0; hop < 5; hop += 1) {
      const headers = { ...options.headers };
      if (cookie) headers.Cookie = cookie;
      upstream = await fetch(currentUrl, { ...options, headers });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get("location");
      if (!location) break;
      const setCookies = typeof upstream.headers.getSetCookie === "function"
        ? upstream.headers.getSetCookie()
        : [upstream.headers.get("set-cookie") || ""];
      const parts = setCookies.map(value => String(value).split(";")[0]).filter(Boolean);
      if (parts.length) cookie = parts.join("; ");
      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.origin !== url.origin) {
        return res.status(502).json({ error: "JON Stream Preview access redirect could not be completed safely" });
      }
      currentUrl = nextUrl;
      if (upstream.status === 303) options.method = "GET";
    }
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
