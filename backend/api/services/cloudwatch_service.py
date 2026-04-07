import boto3
import logging
import threading

logger = logging.getLogger(__name__)

_cloudwatch_unavailable_logged = False

try:
    cloudwatch = boto3.client("cloudwatch", region_name="us-east-2")
except Exception as e:
    cloudwatch = None
    logger.warning(f"CloudWatch init failed: {e}")


def safe_put_metric(namespace, metric_name, value, unit="Count"):
    global _cloudwatch_unavailable_logged
    if not cloudwatch:
        if not _cloudwatch_unavailable_logged:
            logger.debug("CloudWatch not available. Metrics will be skipped.")
            _cloudwatch_unavailable_logged = True
        return

    def _emit():
        try:
            cloudwatch.put_metric_data(
                Namespace=namespace,
                MetricData=[
                    {
                        "MetricName": metric_name,
                        "Value": value,
                        "Unit": unit,
                    }
                ],
            )
        except Exception as e:
            logger.error(f"CloudWatch metric failed: {e}")

    thread = threading.Thread(target=_emit, daemon=True)
    thread.start()
