import os
import logging
import threading
import time
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, jsonify, flash, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize database
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "agnoster-default-secret")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///agnoster.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database with the app
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import models and util functions after initializing db to avoid circular imports
with app.app_context():
    from models import User, Config, NamespaceBlacklist
    from kubernetes_utils import (
        get_all_namespaces, get_pods_in_namespace, 
        get_all_pods, check_namespaces_to_shutdown, 
        start_namespace, stop_namespace, 
        destroy_namespace, reset_namespace,
        DEMO_MODE
    )
    
    # Create database tables
    db.create_all()
    
    # Initialize default admin user if not exists
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        logger.info("Creating default admin user")
        admin = User(
            username="admin",
            password_hash=generate_password_hash("admin"),
            is_admin=True,
            first_login=True
        )
        db.session.add(admin)
        
        # Add default configuration
        default_config = Config(
            shutdown_threshold=14,  # Default 14 hours
            monitoring_interval=5   # Default 5 minutes
        )
        db.session.add(default_config)
        
        # Add default blacklisted namespaces
        default_blacklist = ["kube-system", "kube-public", "kube-node-lease", "default"]
        for namespace in default_blacklist:
            blacklist_entry = NamespaceBlacklist(namespace_name=namespace)
            db.session.add(blacklist_entry)
            
        db.session.commit()

# User loader callback for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Background monitoring thread
def monitoring_thread():
    with app.app_context():
        while True:
            try:
                config = Config.query.first()
                if not config:
                    logger.warning("No configuration found, using default values")
                    monitoring_interval = 5
                else:
                    monitoring_interval = config.monitoring_interval
                
                logger.debug("Checking namespaces for shutdown...")
                check_namespaces_to_shutdown()
                
                # Sleep for the configured monitoring interval (in minutes)
                time.sleep(monitoring_interval * 60)
            except Exception as e:
                logger.error(f"Error in monitoring thread: {str(e)}")
                time.sleep(300)  # Sleep for 5 minutes on error

# Routes
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # Check if it's the admin's first login
        if current_user.is_admin and current_user.first_login:
            return redirect(url_for('change_password'))
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            
            # Check if it's the admin's first login
            if user.is_admin and user.first_login:
                return redirect(url_for('change_password'))
            
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if not current_user.first_login and not current_user.is_admin:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if new_password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('change_password.html')
        
        current_user.password_hash = generate_password_hash(new_password)
        current_user.first_login = False
        db.session.commit()
        
        flash('Password changed successfully. Please login with your new password.', 'success')
        logout_user()
        return redirect(url_for('login'))
    
    return render_template('change_password.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/ui')
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', is_admin=current_user.is_admin, demo_mode=DEMO_MODE)

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('Access denied. You must be an admin to view this page.', 'error')
        return redirect(url_for('dashboard'))
    
    config = Config.query.first()
    blacklist = NamespaceBlacklist.query.all()
    users = User.query.all()
    
    return render_template('admin.html', 
                          config=config, 
                          blacklist=blacklist, 
                          users=users,
                          demo_mode=DEMO_MODE)

# API endpoints
@app.route('/api/namespaces')
@login_required
def api_namespaces():
    try:
        namespaces = get_all_namespaces()
        return jsonify({
            "data": namespaces,
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error getting namespaces: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/pods/<namespace>')
@login_required
def api_pods(namespace):
    try:
        pods = get_pods_in_namespace(namespace)
        return jsonify({
            "data": pods,
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error getting pods for namespace {namespace}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/all_pods')
@login_required
def api_all_pods():
    try:
        pods = get_all_pods()
        return jsonify({
            "data": pods,
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error getting all pods: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/namespace/<namespace>/start', methods=['POST'])
@login_required
def api_start_namespace(namespace):
    try:
        start_namespace(namespace)
        return jsonify({
            "status": "success", 
            "message": f"Started namespace {namespace}",
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error starting namespace {namespace}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/namespace/<namespace>/stop', methods=['POST'])
@login_required
def api_stop_namespace(namespace):
    try:
        stop_namespace(namespace)
        return jsonify({
            "status": "success", 
            "message": f"Stopped namespace {namespace}",
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error stopping namespace {namespace}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/namespace/<namespace>/destroy', methods=['POST'])
@login_required
def api_destroy_namespace(namespace):
    try:
        destroy_namespace(namespace)
        return jsonify({
            "status": "success", 
            "message": f"Destroying namespace {namespace}",
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error destroying namespace {namespace}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/namespace/<namespace>/reset', methods=['POST'])
@login_required
def api_reset_namespace(namespace):
    try:
        reset_namespace(namespace)
        return jsonify({
            "status": "success", 
            "message": f"Reset namespace {namespace}",
            "demo_mode": DEMO_MODE
        })
    except Exception as e:
        logger.error(f"Error resetting namespace {namespace}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/config', methods=['GET', 'PUT'])
@login_required
def api_config():
    if not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    if request.method == 'GET':
        config = Config.query.first()
        if not config:
            return jsonify({"error": "Configuration not found"}), 404
        
        return jsonify({
            "shutdown_threshold": config.shutdown_threshold,
            "monitoring_interval": config.monitoring_interval
        })
    
    elif request.method == 'PUT':
        data = request.json
        config = Config.query.first()
        
        if not config:
            config = Config()
            db.session.add(config)
        
        if 'shutdown_threshold' in data:
            config.shutdown_threshold = data['shutdown_threshold']
        
        if 'monitoring_interval' in data:
            config.monitoring_interval = data['monitoring_interval']
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Configuration updated"})

@app.route('/api/blacklist', methods=['GET', 'POST', 'DELETE'])
@login_required
def api_blacklist():
    if not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    if request.method == 'GET':
        blacklist = NamespaceBlacklist.query.all()
        return jsonify([entry.namespace_name for entry in blacklist])
    
    elif request.method == 'POST':
        data = request.json
        namespace = data.get('namespace')
        
        if not namespace:
            return jsonify({"error": "Namespace is required"}), 400
        
        existing = NamespaceBlacklist.query.filter_by(namespace_name=namespace).first()
        if existing:
            return jsonify({"error": "Namespace already in blacklist"}), 400
        
        blacklist_entry = NamespaceBlacklist(namespace_name=namespace)
        db.session.add(blacklist_entry)
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"Added {namespace} to blacklist"})
    
    elif request.method == 'DELETE':
        data = request.json
        namespace = data.get('namespace')
        
        if not namespace:
            return jsonify({"error": "Namespace is required"}), 400
        
        entry = NamespaceBlacklist.query.filter_by(namespace_name=namespace).first()
        if not entry:
            return jsonify({"error": "Namespace not found in blacklist"}), 404
        
        db.session.delete(entry)
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"Removed {namespace} from blacklist"})

@app.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
@login_required
def api_users():
    if not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin,
            "first_login": user.first_login
        } for user in users])
    
    elif request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        
        existing = User.query.filter_by(username=username).first()
        if existing:
            return jsonify({"error": "Username already exists"}), 400
        
        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            is_admin=is_admin,
            first_login=True
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"User {username} created",
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin
            }
        })
    
    elif request.method == 'PUT':
        data = request.json
        user_id = data.get('id')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if 'username' in data:
            user.username = data['username']
        
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
            user.first_login = True
        
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"User {user.username} updated"
        })
    
    elif request.method == 'DELETE':
        data = request.json
        user_id = data.get('id')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        # Don't allow deleting your own account
        if int(user_id) == current_user.id:
            return jsonify({"error": "Cannot delete your own account"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"User deleted"
        })

# Start the background monitoring thread when the application starts
monitor_thread = threading.Thread(target=monitoring_thread, daemon=True)
monitor_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
