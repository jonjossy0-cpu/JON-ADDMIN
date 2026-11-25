module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ status: "method_not_allowed" });
  }

  const startedAt = Date.now();
  try {
    const upstream = await fetch("https://jon-stream.vercel.app/api/subscription/config", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const responseTimeMs = Date.now() - startedAt;

    if (!upstream.ok) {
      return res.status(502).json({
        status: "degraded",
        service: "JON Stream Subscription API",
        upstreamStatus: upstream.status,
        responseTimeMs,
        checkedAt: new Date().toISOString()
      });
    }

    let config;
    try {
      config = await upstream.json();
    } catch (_) {
      return res.status(502).json({
        status: "invalid_response",
        service: "JON Stream Subscription API",
        responseTimeMs,
        checkedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      status: "healthy",
      service: "JON Stream Subscription API",
      upstreamStatus: upstream.status,
      responseTimeMs,
      checkedAt: new Date().toISOString(),
      configurationAvailable: !!config && typeof config === "object"
    });
  } catch (_) {
    return res.status(502).json({
      status: "unavailable",
      service: "JON Stream Subscription API",
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    });
  }
};
