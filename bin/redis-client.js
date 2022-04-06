const { createClient } = require("redis");

var cacheHostName = "multitenant-redis-cache.redis.cache.windows.net";
var cachePassword = "gTGv1yve3wOpTUNZmeTSAHGfcF4mVJ4ueAzCaO80MaI=";

// Connecting to redis
/*
var client = createClient({
    url: "redis://" + cacheHostName + ":6379",
    password: cachePassword,
});
*/
const client = createClient({
    url: "redis://" + cacheHostName + ":6379",
    password: cachePassword,
    lazyConnect: true,
    showFriendlyErrorStack: true,
    retry_strategy: (options) => {
        const { error, total_retry_time, attempt } = options;
        if (error?.code === 'ECONNREFUSED' || error?.code === 'NR_CLOSED') {
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

client.on('error', (err) => console.log('Error en el cliente de Redis', err));

if (!client.isOpen) client.connect();

module.exports =  client;