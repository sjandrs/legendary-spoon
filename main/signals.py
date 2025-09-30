from django.dispatch import receiver
from django_mailbox.signals import message_received
from django.db.models.signals import post_save
from .models import Interaction, Contact, Deal, WorkOrder, Project, ActivityLog

@receiver(message_received)
def email_received_handler(sender, message, **kwargs):
    """
    Handles incoming email messages and creates an Interaction object.
    """
    # Try to find a contact with the sender's email
    try:
        contact = Contact.objects.get(email=message.from_address[0])
    except Contact.DoesNotExist:
        # Optionally, create a new contact or handle as needed
        contact = None

    Interaction.objects.create(
        contact=contact,
        interaction_type='email',
        subject=message.subject,
        body=message.text or message.html,
        interaction_date=message.processed,
    )

@receiver(post_save, sender=Deal)
def deal_status_changed_handler(sender, instance, created, **kwargs):
    """
    Automatically create a WorkOrder when a Deal is won (closed).
    This implements REQ-201: automatic WorkOrder creation upon Deal closure.
    """
    if not created and instance.status == 'won':
        # Check if a WorkOrder already exists for this deal
        if not WorkOrder.objects.filter(project__deal=instance).exists():
            # Create a Project for this Deal
            project = Project.objects.create(
                title=f"Project for {instance.title}",
                description=f"Automatically created project for won deal: {instance.title}",
                priority='high',
                due_date=instance.close_date,
                status='pending',
                assigned_to=instance.owner,
                contact=instance.primary_contact,
                account=instance.account,
                deal=instance,
                created_by=instance.owner
            )

            # Create a WorkOrder for this Project
            work_order = WorkOrder.objects.create(
                project=project,
                description=f"Work order for project: {project.title}",
                status='open'
            )

            # Log the automation action (SEC-201)
            ActivityLog.objects.create(
                user=instance.owner,
                action='create',
                content_object=work_order,
                description=f'Automatically created WorkOrder #{work_order.id} for won Deal: {instance.title}'
            )

            # Log the project creation
            ActivityLog.objects.create(
                user=instance.owner,
                action='create',
                content_object=project,
                description=f'Automatically created Project for won Deal: {instance.title}'
            )
