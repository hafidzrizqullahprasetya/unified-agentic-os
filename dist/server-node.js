/**
 * Node.js HTTP Server Entry Point
 * Used for local development and Node.js deployments
 * Wraps the Hono app with an HTTP server
 */
import "dotenv/config";
import { createServer } from "http";
import { getEnv } from "@/env";
import app from "@/main";
const env = getEnv();
const PORT = env.PORT;
// Create HTTP server
const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const chunks = [];
        if (req.method !== "GET" && req.method !== "HEAD") {
            await new Promise((resolve, reject) => {
                req.on("data", (chunk) => chunks.push(chunk));
                req.on("end", () => resolve());
                req.on("error", reject);
            });
        }
        const request = new Request(url, {
            method: req.method,
            headers: req.headers,
            body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
        });
        const response = await app.fetch(request);
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        res.writeHead(response.status, headers);
        res.end(await response.text());
    }
    catch (error) {
        console.error("Request error:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
    }
});
server.listen(PORT, () => {
    console.log(`🚀 Server starting on port ${PORT} in ${env.NODE_ENV} environment`);
});
server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=server-node.js.map