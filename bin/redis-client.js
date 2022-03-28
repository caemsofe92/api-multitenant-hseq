const { createClient } = require("redis");

var cacheHostName = "multitenant-redis-cache.redis.cache.windows.net";
var cachePassword = "gTGv1yve3wOpTUNZmeTSAHGfcF4mVJ4ueAzCaO80MaI=";

// Connecting to redis
var client = createClient({
    url: "redis://" + cacheHostName + ":6379",
    password: cachePassword,
});

client.connect();

module.exports =  client;