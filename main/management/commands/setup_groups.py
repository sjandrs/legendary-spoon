from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from main.models import Account, Contact, Deal, Task, Quote, Invoice

class Command(BaseCommand):
    help = 'Creates default user groups with appropriate permissions'

    def handle(self, *args, **options):
        # Create Sales Rep group
        sales_rep, created = Group.objects.get_or_create(name='Sales Rep')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Sales Rep group'))
        
        # Create Sales Manager group
        sales_manager, created = Group.objects.get_or_create(name='Sales Manager')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Sales Manager group'))

        # Get content types
        account_ct = ContentType.objects.get_for_model(Account)
        contact_ct = ContentType.objects.get_for_model(Contact)
        deal_ct = ContentType.objects.get_for_model(Deal)
        task_ct = ContentType.objects.get_for_model(Task)
        quote_ct = ContentType.objects.get_for_model(Quote)
        invoice_ct = ContentType.objects.get_for_model(Invoice)

        # Sales Rep permissions (can view/edit own records)
        sales_rep_perms = [
            Permission.objects.get(content_type=account_ct, codename='view_account'),
            Permission.objects.get(content_type=account_ct, codename='add_account'),
            Permission.objects.get(content_type=account_ct, codename='change_account'),
            Permission.objects.get(content_type=contact_ct, codename='view_contact'),
            Permission.objects.get(content_type=contact_ct, codename='add_contact'),
            Permission.objects.get(content_type=contact_ct, codename='change_contact'),
            Permission.objects.get(content_type=deal_ct, codename='view_deal'),
            Permission.objects.get(content_type=deal_ct, codename='add_deal'),
            Permission.objects.get(content_type=deal_ct, codename='change_deal'),
            Permission.objects.get(content_type=task_ct, codename='view_task'),
            Permission.objects.get(content_type=task_ct, codename='add_task'),
            Permission.objects.get(content_type=task_ct, codename='change_task'),
            Permission.objects.get(content_type=quote_ct, codename='view_quote'),
            Permission.objects.get(content_type=quote_ct, codename='add_quote'),
            Permission.objects.get(content_type=quote_ct, codename='change_quote'),
            Permission.objects.get(content_type=invoice_ct, codename='view_invoice'),
            Permission.objects.get(content_type=invoice_ct, codename='add_invoice'),
            Permission.objects.get(content_type=invoice_ct, codename='change_invoice'),
        ]

        # Sales Manager permissions (can view/edit all records + delete)
        sales_manager_perms = sales_rep_perms + [
            Permission.objects.get(content_type=account_ct, codename='delete_account'),
            Permission.objects.get(content_type=contact_ct, codename='delete_contact'),
            Permission.objects.get(content_type=deal_ct, codename='delete_deal'),
            Permission.objects.get(content_type=task_ct, codename='delete_task'),
            Permission.objects.get(content_type=quote_ct, codename='delete_quote'),
            Permission.objects.get(content_type=invoice_ct, codename='delete_invoice'),
        ]

        # Assign permissions to groups
        sales_rep.permissions.set(sales_rep_perms)
        sales_manager.permissions.set(sales_manager_perms)

        self.stdout.write(self.style.SUCCESS('Successfully set up user groups and permissions'))