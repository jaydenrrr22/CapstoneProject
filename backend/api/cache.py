import threading

CACHE = {}
CACHE_TTL = 60
CACHE_LOCK = threading.Lock()


def clear_prediction_cache():
    global CACHE
    with CACHE_LOCK:
        CACHE.clear()
