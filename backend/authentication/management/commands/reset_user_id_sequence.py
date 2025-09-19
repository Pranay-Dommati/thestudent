from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Reset the PostgreSQL sequence for authentication_user.id to MAX(id)"

    def handle(self, *args, **options):
        sql = (
            "SELECT setval("
            "  pg_get_serial_sequence('authentication_user','id'),"
            "  GREATEST((SELECT COALESCE(MAX(id), 1) FROM authentication_user), 1),"
            "  true"
            ");"
        )
        with connection.cursor() as cursor:
            cursor.execute(sql)
        self.stdout.write(self.style.SUCCESS('Reset sequence for authentication_user.id'))
