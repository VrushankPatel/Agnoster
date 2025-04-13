from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, IntegerField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo, NumberRange

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class ChangePasswordForm(FlaskForm):
    new_password = PasswordField('New Password', validators=[
        DataRequired(),
        Length(min=8, message='Password must be at least 8 characters long')
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('new_password', message='Passwords must match')
    ])
    submit = SubmitField('Change Password')

class UserForm(FlaskForm):
    username = StringField('Username', validators=[
        DataRequired(),
        Length(min=3, max=64, message='Username must be between 3 and 64 characters')
    ])
    password = PasswordField('Password', validators=[
        Length(min=8, message='Password must be at least 8 characters long')
    ])
    is_admin = BooleanField('Admin User')
    submit = SubmitField('Save User')

class ConfigForm(FlaskForm):
    shutdown_threshold = IntegerField('Shutdown Threshold (hours)', validators=[
        DataRequired(),
        NumberRange(min=1, max=336, message='Threshold must be between 1 and 336 hours')
    ])
    monitoring_interval = IntegerField('Monitoring Interval (minutes)', validators=[
        DataRequired(),
        NumberRange(min=1, max=60, message='Interval must be between 1 and 60 minutes')
    ])
    submit = SubmitField('Save Configuration')

class BlacklistForm(FlaskForm):
    namespace_name = StringField('Namespace Name', validators=[
        DataRequired(),
        Length(min=1, max=128, message='Namespace name must be between 1 and 128 characters')
    ])
    submit = SubmitField('Add to Blacklist')
