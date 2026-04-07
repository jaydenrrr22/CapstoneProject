import boto3
import logging

logger = logging.getLogger(__name__)

try:
    cloudwatch = boto3.client("cloudwatch", region_name="us-east-2")
except Exception as e:
    cloudwatch = None
    logger.warning(f"CloudWatch init failed: {e}")


def safe_put_metric(namespace, metric_name, value, unit="Count"):
    if not cloudwatch:
        logger.warning("CloudWatch not available. Skipping metric.")
        return

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
