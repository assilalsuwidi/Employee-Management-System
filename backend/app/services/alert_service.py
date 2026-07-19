import smtplib
from email.message import EmailMessage
import threading
from flask import current_app
import logging

class AlertService:
    @staticmethod
    def send_security_alert_async(action, details, config):
        try:
            msg = EmailMessage()
            msg.set_content(f"A critical security event has been detected:\n\nAction: {action}\nDetails: {details}")
            msg['Subject'] = f"SECURITY ALERT: {action}"
            msg['From'] = config.get('MAIL_USERNAME') or "noreply@ems.local"
            
            admin_email = config.get('ADMIN_ALERT_EMAIL')
            if not admin_email:
                logging.warning("ADMIN_ALERT_EMAIL is not set. Cannot send security alert.")
                return

            msg['To'] = admin_email

            # Connect to SMTP server
            mail_server = config.get('MAIL_SERVER')
            mail_port = config.get('MAIL_PORT', 587)
            
            server = smtplib.SMTP(mail_server, mail_port)
            server.starttls()
            
            if config.get('MAIL_USERNAME') and config.get('MAIL_PASSWORD'):
                server.login(config.get('MAIL_USERNAME'), config.get('MAIL_PASSWORD'))
            
            server.send_message(msg)
            server.quit()
        except Exception:
            # Catch all exceptions so the background thread doesn't crash the app
            logging.exception(f"Failed to send security alert for '{action}'")

    @staticmethod
    def send_security_alert(action, details):
        """
        Initiates a background thread to send an email alert.
        Extracts the necessary configuration from `current_app` before 
        starting the thread to avoid working outside of application context.
        """
        try:
            config = {
                'MAIL_SERVER': current_app.config.get('MAIL_SERVER'),
                'MAIL_PORT': current_app.config.get('MAIL_PORT'),
                'MAIL_USERNAME': current_app.config.get('MAIL_USERNAME'),
                'MAIL_PASSWORD': current_app.config.get('MAIL_PASSWORD'),
                'ADMIN_ALERT_EMAIL': current_app.config.get('ADMIN_ALERT_EMAIL')
            }
            
            if not config['MAIL_SERVER'] or not config['ADMIN_ALERT_EMAIL']:
                logging.debug("AlertService: Missing MAIL_SERVER or ADMIN_ALERT_EMAIL. Alert skipped.")
                return

            thread = threading.Thread(
                target=AlertService.send_security_alert_async,
                args=(action, details, config)
            )
            # Daemon threads will shut down immediately when the main program exits
            thread.daemon = True
            thread.start()
        except Exception:
            logging.exception("AlertService: Failed to start alert thread")
