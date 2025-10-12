"""
Management command to check MySQL connection settings and health.
Usage: python manage.py check_mysql_connection
"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Check MySQL connection settings and health'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== MySQL Connection Check ===\n'))
        
        # Display current settings
        db_settings = settings.DATABASES['default']
        self.stdout.write(f"Engine: {db_settings['ENGINE']}")
        self.stdout.write(f"Host: {db_settings['HOST']}")
        self.stdout.write(f"Port: {db_settings['PORT']}")
        self.stdout.write(f"Database: {db_settings['NAME']}")
        self.stdout.write(f"User: {db_settings['USER']}")
        self.stdout.write(f"CONN_MAX_AGE: {db_settings.get('CONN_MAX_AGE', 0)} seconds")
        self.stdout.write(f"CONN_HEALTH_CHECKS: {db_settings.get('CONN_HEALTH_CHECKS', False)}")
        
        # Test connection
        self.stdout.write('\n=== Testing Connection ===')
        try:
            with connection.cursor() as cursor:
                # Get MySQL version
                cursor.execute("SELECT VERSION()")
                version = cursor.fetchone()[0]
                self.stdout.write(self.style.SUCCESS(f"✓ Connected! MySQL Version: {version}"))
                
                # Get wait_timeout
                cursor.execute("SHOW VARIABLES LIKE 'wait_timeout'")
                wait_timeout = cursor.fetchone()[1]
                self.stdout.write(f"MySQL wait_timeout: {wait_timeout} seconds")
                
                # Get interactive_timeout
                cursor.execute("SHOW VARIABLES LIKE 'interactive_timeout'")
                interactive_timeout = cursor.fetchone()[1]
                self.stdout.write(f"MySQL interactive_timeout: {interactive_timeout} seconds")
                
                # Get max_allowed_packet
                cursor.execute("SHOW VARIABLES LIKE 'max_allowed_packet'")
                max_packet = cursor.fetchone()[1]
                self.stdout.write(f"MySQL max_allowed_packet: {int(max_packet) / 1024 / 1024:.2f} MB")
                
                # Connection recommendations
                self.stdout.write('\n=== Recommendations ===')
                conn_max_age = db_settings.get('CONN_MAX_AGE', 0)
                wait_timeout_int = int(wait_timeout)
                
                if conn_max_age == 0:
                    self.stdout.write(self.style.WARNING(
                        '⚠ CONN_MAX_AGE is 0 (no connection pooling). '
                        'Consider setting it to 300 (5 minutes) to avoid reconnection overhead.'
                    ))
                elif conn_max_age >= wait_timeout_int:
                    self.stdout.write(self.style.WARNING(
                        f'⚠ CONN_MAX_AGE ({conn_max_age}s) is >= wait_timeout ({wait_timeout}s). '
                        f'This may cause "Server has gone away" errors. '
                        f'Set CONN_MAX_AGE to less than {wait_timeout_int} seconds.'
                    ))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ CONN_MAX_AGE ({conn_max_age}s) is appropriately less than wait_timeout ({wait_timeout}s)'
                    ))
                
                if not db_settings.get('CONN_HEALTH_CHECKS'):
                    self.stdout.write(self.style.WARNING(
                        '⚠ CONN_HEALTH_CHECKS is disabled. Enable it to automatically test connections before reuse.'
                    ))
                else:
                    self.stdout.write(self.style.SUCCESS('✓ CONN_HEALTH_CHECKS is enabled'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Connection failed: {e}'))
