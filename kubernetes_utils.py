import subprocess
import json
import logging
from datetime import datetime, timedelta
from models import Config, NamespaceBlacklist, NamespaceLog
from app import db
from flask_login import current_user

# Configure logging
logger = logging.getLogger(__name__)

def run_kubectl_command(command):
    """Run a kubectl command and return the output."""
    try:
        logger.debug(f"Running kubectl command: {command}")
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"kubectl command failed: {e}")
        logger.error(f"Error output: {e.stderr}")
        raise Exception(f"kubectl command failed: {e}")

def get_all_namespaces():
    """Get all Kubernetes namespaces."""
    command = "kubectl get namespaces -o json"
    output = run_kubectl_command(command)
    data = json.loads(output)
    
    # Get blacklisted namespaces
    blacklisted = [entry.namespace_name for entry in NamespaceBlacklist.query.all()]
    
    namespaces = []
    for item in data["items"]:
        namespace_name = item["metadata"]["name"]
        
        # Skip blacklisted namespaces
        if namespace_name in blacklisted:
            continue
        
        created_at = item["metadata"]["creationTimestamp"]
        status = item["status"]["phase"]
        
        # Get pod count for this namespace
        pod_count_command = f"kubectl get pods -n {namespace_name} --no-headers 2>/dev/null | wc -l"
        try:
            pod_count = int(run_kubectl_command(pod_count_command))
        except:
            pod_count = 0
        
        namespaces.append({
            "name": namespace_name,
            "status": status,
            "created_at": created_at,
            "pod_count": pod_count
        })
    
    return namespaces

def get_pods_in_namespace(namespace):
    """Get all pods in a specific namespace."""
    command = f"kubectl get pods -n {namespace} -o json"
    output = run_kubectl_command(command)
    data = json.loads(output)
    
    pods = []
    for item in data["items"]:
        pod_name = item["metadata"]["name"]
        created_at = item["metadata"]["creationTimestamp"]
        
        # Calculate runtime
        created_datetime = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
        runtime = datetime.utcnow() - created_datetime
        runtime_hours = runtime.total_seconds() / 3600
        
        # Get pod status
        if "status" in item and "phase" in item["status"]:
            status = item["status"]["phase"]
        else:
            status = "Unknown"
        
        # Get container info
        containers = []
        if "spec" in item and "containers" in item["spec"]:
            for container in item["spec"]["containers"]:
                containers.append({
                    "name": container["name"],
                    "image": container["image"]
                })
        
        pods.append({
            "name": pod_name,
            "status": status,
            "created_at": created_at,
            "runtime_hours": round(runtime_hours, 2),
            "containers": containers
        })
    
    return pods

def get_all_pods():
    """Get all pods across all namespaces."""
    command = "kubectl get pods --all-namespaces -o json"
    output = run_kubectl_command(command)
    data = json.loads(output)
    
    # Get blacklisted namespaces
    blacklisted = [entry.namespace_name for entry in NamespaceBlacklist.query.all()]
    
    pods = []
    for item in data["items"]:
        namespace = item["metadata"]["namespace"]
        
        # Skip blacklisted namespaces
        if namespace in blacklisted:
            continue
        
        pod_name = item["metadata"]["name"]
        created_at = item["metadata"]["creationTimestamp"]
        
        # Calculate runtime
        created_datetime = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
        runtime = datetime.utcnow() - created_datetime
        runtime_hours = runtime.total_seconds() / 3600
        
        # Get pod status
        if "status" in item and "phase" in item["status"]:
            status = item["status"]["phase"]
        else:
            status = "Unknown"
        
        pods.append({
            "namespace": namespace,
            "name": pod_name,
            "status": status,
            "created_at": created_at,
            "runtime_hours": round(runtime_hours, 2)
        })
    
    return pods

def check_namespaces_to_shutdown():
    """Check all namespaces for pods running longer than the threshold."""
    logger.info("Checking namespaces for pods exceeding runtime threshold")
    
    # Get configuration
    config = Config.query.first()
    if not config:
        logger.warning("No configuration found, using default threshold of 14 hours")
        threshold_hours = 14
    else:
        threshold_hours = config.shutdown_threshold
    
    # Get all pods
    all_pods = get_all_pods()
    
    # Group pods by namespace
    namespaces_to_check = {}
    for pod in all_pods:
        namespace = pod["namespace"]
        runtime_hours = pod["runtime_hours"]
        
        if namespace not in namespaces_to_check:
            namespaces_to_check[namespace] = {
                "max_runtime": runtime_hours,
                "pods_exceeding_threshold": []
            }
        
        # Update maximum runtime for the namespace
        if runtime_hours > namespaces_to_check[namespace]["max_runtime"]:
            namespaces_to_check[namespace]["max_runtime"] = runtime_hours
        
        # Check if pod exceeds threshold
        if runtime_hours > threshold_hours:
            namespaces_to_check[namespace]["pods_exceeding_threshold"].append(pod["name"])
    
    # Shutdown namespaces with pods exceeding threshold
    for namespace, data in namespaces_to_check.items():
        if data["pods_exceeding_threshold"]:
            logger.info(f"Namespace {namespace} has pods running for more than {threshold_hours} hours")
            logger.info(f"Max runtime: {data['max_runtime']} hours")
            logger.info(f"Pods exceeding threshold: {', '.join(data['pods_exceeding_threshold'])}")
            
            # Log the shutdown event
            log_entry = NamespaceLog(
                namespace_name=namespace,
                action="stop",
                user_id=None,  # Automated action
                details=f"Automatic shutdown due to pods running for more than {threshold_hours} hours. Pods: {', '.join(data['pods_exceeding_threshold'])}"
            )
            db.session.add(log_entry)
            db.session.commit()
            
            # Execute the shutdown
            logger.info(f"Shutting down namespace {namespace}")
            stop_namespace(namespace, automated=True)

def start_namespace(namespace):
    """Start/activate a namespace."""
    logger.info(f"Starting namespace {namespace}")
    
    # In a real implementation, this could involve recreating deployments or scaling them up
    # For now, we'll just log the action
    print(f"Starting {namespace}")
    
    # Log the action
    if current_user:
        log_entry = NamespaceLog(
            namespace_name=namespace,
            action="start",
            user_id=current_user.id,
            details="Namespace manually started"
        )
        db.session.add(log_entry)
        db.session.commit()
    
    return True

def stop_namespace(namespace, automated=False):
    """Stop/shutdown a namespace."""
    logger.info(f"Stopping namespace {namespace}")
    
    # In a real implementation, this could involve scaling down deployments
    # For now, we'll just log the action
    print(f"Shutting down {namespace}")
    
    # Log the action if not already logged by automated process
    if not automated and current_user:
        log_entry = NamespaceLog(
            namespace_name=namespace,
            action="stop",
            user_id=current_user.id,
            details="Namespace manually stopped"
        )
        db.session.add(log_entry)
        db.session.commit()
    
    return True

def destroy_namespace(namespace):
    """Destroy a namespace."""
    logger.info(f"Destroying namespace {namespace}")
    
    # In a real implementation, this would delete the namespace
    # For now, we'll just log the action
    print(f"Destroying {namespace}")
    
    # Log the action
    if current_user:
        log_entry = NamespaceLog(
            namespace_name=namespace,
            action="destroy",
            user_id=current_user.id,
            details="Namespace manually destroyed"
        )
        db.session.add(log_entry)
        db.session.commit()
    
    return True

def reset_namespace(namespace):
    """Reset a namespace monitoring state."""
    logger.info(f"Resetting namespace {namespace}")
    
    # In a real implementation, this might involve resetting some state or counters
    # For now, we'll just log the action
    print(f"Resetting {namespace}")
    
    # Log the action
    if current_user:
        log_entry = NamespaceLog(
            namespace_name=namespace,
            action="reset",
            user_id=current_user.id,
            details="Namespace monitoring state reset"
        )
        db.session.add(log_entry)
        db.session.commit()
    
    return True
