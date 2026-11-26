module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ status: "method_not_allowed" });
  }

  const memory = process.memoryUsage();
  const mb = value => Math.round((value / 1024 / 1024) * 10) / 10;

  return res.status(200).json({
    status: "healthy",
    runtime: "Vercel Serverless Function",
    environment: process.env.VERCEL_ENV || "unknown",
    region: process.env.VERCEL_REGION || null,
    deploymentHost: process.env.VERCEL_URL || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    instanceUptimeSeconds: Math.max(0, Math.round(process.uptime())),
    memory: {
      rssMB: mb(memory.rss),
      heapUsedMB: mb(memory.heapUsed),
      heapTotalMB: mb(memory.heapTotal)
    },
    checkedAt: new Date().toISOString()
  });
};
