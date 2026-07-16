from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return jsonify(success=False, message="Not found"), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify(success=False, message="Unauthorized"), 403

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return jsonify(success=False, message="Internal server error"), 500
