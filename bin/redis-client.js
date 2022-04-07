const { createClient } = require("redis");

var cacheHostName = "multitenant-redis-cache.redis.cache.windows.net";
var cachePassword = "gTGv1yve3wOpTUNZmeTSAHGfcF4mVJ4ueAzCaO80MaI=";

// Connecting to redis
const client = createClient({
  url: "redis://" + cacheHostName + ":6379",
  password: cachePassword,
  lazyConnect: true,
  showFriendlyErrorStack: false,
  retry_strategy: (options) => {
    const { error, total_retry_time, attempt } = options;
    if (error?.code === "ECONNREFUSED" || error?.code === "NR_CLOSED") {
      return 5000;
    }
    if (total_retry_time > 1000 * 15) {
      return undefined;
    }
    if (attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 1000, 5000); //in ms
  },
});

client.on("error", () => {
  client.disconnect();
});
client.on("connect", () => {
  console.log("Redis Conectado");
});
client.on("end", () => {
  console.log("Conexión Cerrada con Redis");
});
client.on("reconnecting", (o) => {
  console.log("Reconectano con Redis", o.attempt, o.delay);
});

if (!client.isOpen) client.connect();

module.exports = client;
