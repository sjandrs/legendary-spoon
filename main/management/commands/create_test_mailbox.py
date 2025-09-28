from django.core.management.base import BaseCommand
from django_mailbox.models import Mailbox

class Command(BaseCommand):
    help = 'Creates a default mailbox for testing.'

    def handle(self, *args, **options):
        if not Mailbox.objects.filter(name='Local Test Mailbox').exists():
            Mailbox.objects.create(
                name='Local Test Mailbox',
                uri='maildir:c:/Users/sjand/ws/maildir',  # This will be a folder
                from_email='test@example.com',
            )
            self.stdout.write(self.style.SUCCESS('Successfully created test mailbox.'))
        else:
            self.stdout.write(self.style.WARNING('Test mailbox already exists.'))
