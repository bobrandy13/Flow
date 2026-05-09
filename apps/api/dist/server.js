var _a, _b, _c;
/**
 * Process bootstrap. `app.ts` builds a configured Fastify instance; this
 * file just listens on the configured port and wires graceful shutdown.
 */
import { buildApp } from "./app";
const PORT = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4000);
const HOST = (_b = process.env.HOST) !== null && _b !== void 0 ? _b : "0.0.0.0";
const CORS_ORIGINS = ((_c = process.env.CORS_ORIGINS) !== null && _c !== void 0 ? _c : "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
async function main() {
    const app = await buildApp({ corsOrigins: CORS_ORIGINS });
    const shutdown = async (signal) => {
        app.log.info({ signal }, "shutting down");
        try {
            await app.close();
            process.exit(0);
        }
        catch (err) {
            app.log.error(err, "error during shutdown");
            process.exit(1);
        }
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    try {
        await app.listen({ port: PORT, host: HOST });
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
