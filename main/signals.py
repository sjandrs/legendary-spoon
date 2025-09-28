from django.dispatch import receiver
from django_mailbox.signals import message_received
from .models import Interaction, Contact

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
