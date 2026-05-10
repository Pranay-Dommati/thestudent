from django.core.management.base import BaseCommand

from scrib.models import PreviewNote

PREVIEWS = [
    {
        'title': 'Cloud Computing',
        'subject': 'Cloud Computing',
        'image_url': 'https://easylearnova-scrib.s3.ap-south-1.amazonaws.com/previews/cloud-computing.png',
    },
    {
        'title': 'Workload Distribution Architecture',
        'subject': 'Cloud Computing Architectures',
        'image_url': 'https://easylearnova-scrib.s3.ap-south-1.amazonaws.com/previews/workload-distribution-architecture.png',
    },
    {
        'title': 'Elastic Resource Capacity Architecture',
        'subject': 'Cloud Computing Architectures',
        'image_url': 'https://easylearnova-scrib.s3.ap-south-1.amazonaws.com/previews/elastic-resource-capacity-architecture.png',
    },
    {
        'title': 'Multi Cloud Architecture',
        'subject': 'Cloud Computing Architectures',
        'image_url': 'https://easylearnova-scrib.s3.ap-south-1.amazonaws.com/previews/multi-cloud-architecture.png',
    },
    {
        'title': 'Edge Computing Architecture',
        'subject': 'Specialized Cloud Architectures',
        'image_url': 'https://easylearnova-scrib.s3.ap-south-1.amazonaws.com/previews/edge-computing-architecture.png',
    },
]


class Command(BaseCommand):
    help = 'Seed Scrib preview notes.'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for entry in PREVIEWS:
            preview, created = PreviewNote.objects.update_or_create(
                title=entry['title'],
                defaults={
                    'tags': [entry['subject']],
                    'image_url': entry['image_url'],
                    'page_count': 1,
                    'is_active': True,
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded Scrib previews. Created: {created_count}, Updated: {updated_count}.'
            )
        )
