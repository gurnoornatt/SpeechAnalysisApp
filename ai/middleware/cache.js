const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const cache = async (req, res, next) => {
    try {
        const { audio_url } = req.body;
        const cacheKey = `speech-analysis:${audio_url}`;

        // Try to get cached result
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
            return res.json(JSON.parse(cachedResult));
        }

        // Add caching to response
        const originalJson = res.json;
        res.json = function (data) {
            // Cache the result for 1 hour
            redis.setex(cacheKey, 3600, JSON.stringify(data));
            originalJson.call(this, data);
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = cache;
