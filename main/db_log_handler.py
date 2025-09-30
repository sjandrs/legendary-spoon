import logging


class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        from .models import LogEntry

        try:
            LogEntry.objects.create(
                level=record.levelname,
                message=self.format(record),
                module=record.module,
            )
        except Exception:
            # If logging to the DB fails, we can't do much.
            # You might want to add a fallback file logger here for critical errors.
            pass
