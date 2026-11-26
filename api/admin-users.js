const forward = require("./_lib/adminApiProxy");
module.exports = (req, res) => forward(req, res, "users", req.method === "POST" ? "POST" : "GET");
