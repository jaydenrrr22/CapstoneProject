CACHE = {}
CACHE_TTL = 60


def clear_prediction_cache():
    global CACHE
    CACHE.clear()
