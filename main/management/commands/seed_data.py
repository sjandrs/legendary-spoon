from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from main.models import Account, Contact, Deal, Project, DealStage, CustomUser
from faker import Faker
import random

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        fake = Faker()
        User = get_user_model()

        # Clear existing data to avoid duplicates
        Project.objects.all().delete()
        Deal.objects.all().delete()
        Contact.objects.all().delete()
        Account.objects.all().delete()
        DealStage.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        # --- Create Groups ---
        sales_rep_group, _ = Group.objects.get_or_create(name='Sales Rep')
        sales_manager_group, _ = Group.objects.get_or_create(name='Sales Manager')
        self.stdout.write('Ensured Sales Rep and Sales Manager groups exist.')

        # --- Create Users ---
        users = []
        # Create a predictable user 'sam'
        sam_user, created = User.objects.get_or_create(
            username='sam', 
            defaults={'email': 'sam@example.com'}
        )
        if created:
            sam_user.set_password('sam')
            sam_user.save()
        sam_user.groups.add(sales_manager_group)
        users.append(sam_user)
        self.stdout.write("Ensured user 'sam' exists and is in 'Sales Manager' group.")

        for i in range(4): # Create 4 other random users
            username = fake.user_name()
            email = fake.email()
            password = 'password123'
            user = User.objects.create_user(username=username, email=email, password=password)
            user.groups.add(sales_rep_group)
            users.append(user)
        self.stdout.write(f'Created {len(users)-1} additional random users.')

        # --- Create Accounts ---
        accounts = []
        for _ in range(10):
            account = Account.objects.create(
                name=fake.company(),
                industry=fake.bs(),
                website=fake.url(),
                notes=fake.text(max_nb_chars=200),
                owner=random.choice(users) # Assign an owner
            )
            accounts.append(account)
        self.stdout.write(f'Created {len(accounts)} accounts.')

        # --- Create Contacts ---
        contacts = []
        for _ in range(20):
            contact = Contact.objects.create(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                email=fake.email(),
                phone_number=fake.phone_number(),
                account=random.choice(accounts) if accounts else None,
                owner=random.choice(users)
            )
            contacts.append(contact)
        self.stdout.write(f'Created {len(contacts)} contacts.')

        # --- Create Deal Stages ---
        stage_names = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
        deal_stages = [DealStage.objects.create(name=name, order=i) for i, name in enumerate(stage_names)]
        self.stdout.write(f'Created {len(deal_stages)} deal stages.')

        # --- Create Deals ---
        deals = []
        # Ensure 'sam' has some 'in_progress' deals
        in_progress_stages = [s for s in deal_stages if s.name not in ['Closed Won', 'Closed Lost']]
        for i in range(5):
            deal = Deal.objects.create(
                title=f"Priority Deal for {fake.company_suffix()} {i}",
                value=random.randint(25000, 75000),
                stage=random.choice(in_progress_stages),
                account=random.choice(accounts),
                owner=sam_user, # Assign to sam
                close_date=fake.future_date(end_date="+60d"),
                status='in_progress' # Explicitly set status
            )
            deals.append(deal)
        self.stdout.write(f"Created 5 'in_progress' deals for user 'sam'.")

        # Create other random deals
        for _ in range(10):
            stage = random.choice(deal_stages)
            status = 'in_progress'
            if stage.name == 'Closed Won':
                status = 'won'
            elif stage.name == 'Closed Lost':
                status = 'lost'

            deal = Deal.objects.create(
                title=f"Deal for {fake.company_suffix()}",
                value=random.randint(1000, 50000),
                stage=stage,
                account=random.choice(accounts),
                owner=random.choice(users),
                close_date=fake.future_date(end_date="+90d"),
                status=status
            )
            deals.append(deal)
        self.stdout.write(f'Created 10 additional random deals.')

        # --- Create Tasks ---
        task_titles = [
            "Follow up call with {contact}",
            "Send proposal to {contact}",
            "Schedule demo for {deal}",
            "Review contract with {account}",
            "Onboarding for {account}"
        ]
        for _ in range(30):
            task_title_template = random.choice(task_titles)
            contact = random.choice(contacts)
            deal = random.choice(deals) if deals else None
            account = random.choice(accounts)
            
            contact_name = f"{contact.first_name} {contact.last_name}"
            title = task_title_template.format(contact=contact_name, deal=deal.title if deal else "N/A", account=account.name)

            Project.objects.create(
                title=title,
                description=fake.text(max_nb_chars=150),
                due_date=fake.future_date(end_date="+30d"),
                completed=fake.boolean(chance_of_getting_true=25),
                assigned_to=random.choice(users),
                contact=contact,
                deal=deal
            )
        self.stdout.write('Created 30 tasks.')

        self.stdout.write(self.style.SUCCESS('Database seeding complete!'))
