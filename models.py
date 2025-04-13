from app import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    first_login = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shutdown_threshold = db.Column(db.Integer, default=14)  # Hours
    monitoring_interval = db.Column(db.Integer, default=5)  # Minutes
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NamespaceBlacklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    namespace_name = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NamespaceLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    namespace_name = db.Column(db.String(128), nullable=False)
    action = db.Column(db.String(64), nullable=False)  # start, stop, destroy, reset
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)
    
    user = db.relationship('User', backref=db.backref('logs', lazy=True))
