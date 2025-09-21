from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from authentication.models import User, EmailOTP


class Command(BaseCommand):
    help = "Delete unverified users whose OTPs have expired and prune old OTP records"

    def add_arguments(self, parser):
        parser.add_argument('--user-age-hours', type=int, default=24,
                            help='Delete users inactive for more than this many hours with expired OTPs (default: 24)')
        parser.add_argument('--prune-otp-days', type=int, default=7,
                            help='Delete OTP records older than this many days (default: 7)')

    def handle(self, *args, **options):
        now = timezone.now()

        # Prune old OTPs
        otp_cutoff = now - timedelta(days=options['prune_otp_days'])
        pruned, _ = EmailOTP.objects.filter(created_at__lt=otp_cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Pruned {pruned} old OTP records"))

        # Delete users who are inactive and have their latest OTP expired, older than threshold
        user_cutoff = now - timedelta(hours=options['user_age_hours'])
        candidates = User.objects.filter(is_active=False, date_joined__lt=user_cutoff)
        deleted_users = 0
        for user in candidates:
            latest_otp = EmailOTP.objects.filter(user=user).order_by('-created_at').first()
            if latest_otp and latest_otp.expires_at < now and latest_otp.is_used:
                user.delete()
                deleted_users += 1
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_users} unverified users"))
