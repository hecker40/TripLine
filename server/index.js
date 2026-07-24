import http from "node:http";
import { generateItinerary } from "./itinerary.js";

const PORT = Number(process.env.PORT || 8787);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing URL" });
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "tripline-itinerary-api" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate-itinerary") {
    try {
      const body = await readBody(req);
      const result = await generateItinerary(body.prompt || "", body.preferences || {});
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Failed to generate itinerary" });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`TripLine API listening on http://localhost:${PORT}`);
});
