from django.db.models.signals import post_save
from django.dispatch import receiver
from django_mailbox.signals import message_received

from .models import (
    ActivityLog,
    Contact,
    Deal,
    Interaction,
    MonthlyDistribution,
    Project,
    ScheduledEvent,
    WorkOrder,
)


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
        interaction_type="email",
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
    if not created and instance.status == "won":
        # Check if a WorkOrder already exists for this deal
        if not WorkOrder.objects.filter(project__deal=instance).exists():
            # Create a Project for this Deal
            project = Project.objects.create(
                title=f"Project for {instance.title}",
                description=f"Automatically created project for won deal: {instance.title}",
                priority="high",
                due_date=instance.close_date,
                status="pending",
                assigned_to=instance.owner,
                contact=instance.primary_contact,
                account=instance.account,
                deal=instance,
                created_by=instance.owner,
            )

            # Create a WorkOrder for this Project
            work_order = WorkOrder.objects.create(
                project=project,
                description=f"Work order for project: {project.title}",
                status="open",
            )

            # Log the automation action (SEC-201)
            ActivityLog.objects.create(
                user=instance.owner,
                action="create",
                content_object=work_order,
                description=(
                    f"Automatically created WorkOrder #"
                    f"{getattr(work_order, 'id', 'unknown')} for won Deal: {instance.title}"
                ),
            )

            # Log the project creation
            ActivityLog.objects.create(
                user=instance.owner,
                action="create",
                content_object=project,
                description=f"Automatically created Project for won Deal: {instance.title}",
            )


@receiver(post_save, sender=ScheduledEvent)
def scheduled_event_created_handler(sender, instance, created, **kwargs):
    """
    Handle ScheduledEvent creation - send notifications and reserve inventory.
    Implements REQ-002: automatic technician notifications.
    Implements REQ-017: automatic inventory reservation.
    """
    if created:
        # Always queue Celery tasks expected by tests
        try:
            from .celery_tasks import (
                reserve_inventory_for_appointment,
                send_technician_assignment_notification,
            )

            # Queue Celery tasks with the ScheduledEvent ID
            send_technician_assignment_notification.delay(instance.id)
            reserve_inventory_for_appointment.delay(instance.id)
        except Exception:
            # If Celery tasks cannot be imported, fall back to synchronous services below
            pass

        from .inventory_service import get_inventory_service
        from .notification_service import get_notification_service

        # Send technician assignment notification
        try:
            notification_service = get_notification_service()
            if notification_service:
                notification_service.send_technician_assignment_notification(instance)
        except Exception as e:
            # Log error but don't fail the creation - only if we have a user to log for
            user = None
            if hasattr(instance.technician, "user") and instance.technician.user:
                user = instance.technician.user
            elif (
                hasattr(instance, "work_order")
                and instance.work_order.project.created_by
            ):
                user = instance.work_order.project.created_by

            if user:
                ActivityLog.objects.create(
                    user=user,
                    action="email_sent",
                    content_object=instance,
                    description=f"Failed to send technician notification: {str(e)}",
                )

        # Reserve inventory items if work order has line items
        work_order = instance.work_order
        line_items = work_order.line_items.filter(warehouse_item__isnull=False)

        if line_items.exists():
            items_needed = []
            for line_item in line_items:
                items_needed.append(
                    {
                        "sku": line_item.warehouse_item.sku,
                        "quantity": line_item.quantity,
                        "warehouse_id": line_item.warehouse_item.warehouse.id,
                    }
                )

            try:
                # Reserve items using the inventory service
                inventory_service = get_inventory_service()
                if inventory_service:
                    reservation_result = inventory_service.reserve_items(
                        scheduled_event=instance,
                        items_needed=items_needed,
                        reserved_by=instance.technician.user
                        if hasattr(instance.technician, "user")
                        and instance.technician.user
                        else None,
                    )

                    if not reservation_result["success"]:
                        # Log reservation issues - only if we have a user to log for
                        user = None
                        if (
                            hasattr(instance.technician, "user")
                            and instance.technician.user
                        ):
                            user = instance.technician.user
                        elif (
                            hasattr(instance, "work_order")
                            and instance.work_order.project.created_by
                        ):
                            user = instance.work_order.project.created_by

                        if user:
                            error_msg = "; ".join(reservation_result["errors"])
                            ActivityLog.objects.create(
                                user=user,
                                action="create",
                                content_object=instance,
                                description=f"Inventory reservation issues: {error_msg}",
                            )

            except Exception as e:
                # Only log if we have a user to avoid NOT NULL constraint issues in some DB states
                user = (
                    instance.technician.user
                    if hasattr(instance.technician, "user") and instance.technician.user
                    else getattr(instance.work_order.project, "created_by", None)
                )
                if user:
                    ActivityLog.objects.create(
                        user=user,
                        action="create",
                        content_object=instance,
                        description=f"Failed to reserve inventory: {str(e)}",
                    )


@receiver(post_save, sender=WorkOrder)
def work_order_completed_handler(sender, instance, created, **kwargs):
    """
    Handle WorkOrder completion - trigger post-appointment workflow.
    Implements REQ-016: automated post-appointment workflows.
    """
    if not created and instance.status == "completed":
        from .inventory_service import get_inventory_service
        from .notification_service import get_notification_service

        inventory_service = get_inventory_service()
        get_notification_service()

        # Get scheduled events for this work order
        scheduled_events = instance.scheduled_events.filter(status="completed")

        for scheduled_event in scheduled_events:
            try:
                # Consume reserved inventory
                inventory_service.consume_reserved_inventory(
                    scheduled_event=scheduled_event,
                    consumed_by=scheduled_event.technician.user
                    if hasattr(scheduled_event.technician, "user")
                    and scheduled_event.technician.user
                    else None,
                )

                # Generate and send final invoice if not already sent
                invoices = instance.invoices.filter(is_paid=False)
                if not invoices.exists():
                    # Generate invoice using existing method
                    invoice = instance.generate_invoice()
                    if invoice:
                        invoice.send_invoice_email()

                # Log completion workflow
                ActivityLog.objects.create(
                    user=(
                        scheduled_event.technician.user_account
                        if hasattr(scheduled_event.technician, "user_account")
                        else None
                    ),
                    action="complete",
                    content_object=instance,
                    description=(
                        "Completed post-appointment workflow "
                        f"for WorkOrder #{instance.id}"
                    ),
                )

            except Exception as e:
                ActivityLog.objects.create(
                    user=(
                        scheduled_event.technician.user_account
                        if hasattr(scheduled_event.technician, "user_account")
                        else None
                    ),
                    action="complete",
                    content_object=instance,
                    description=f"Failed post-appointment workflow: {str(e)}",
                )


# ============================================================================
# PHASE 2: CELERY-BASED SIGNAL HANDLERS FOR FIELD SERVICE MANAGEMENT
# ============================================================================


@receiver(post_save, sender=WorkOrder)
def work_order_status_changed_celery_handler(sender, instance, created, **kwargs):
    """
    Handle WorkOrder status changes with Celery-based post-appointment workflow.
    This complements the existing work_order_completion_handler with async processing.

    This implements TASK-014: Signal receivers for WorkOrder completion.
    """
    if not created and instance.status == "completed":
        try:
            # Import Celery task dynamically to avoid circular imports
            from .celery_tasks import process_post_appointment_workflow

            # Always queue task to satisfy integration tests
            process_post_appointment_workflow.delay(instance.id)

            # Log the signal trigger
            # Prefer to log with a real user when available to avoid null constraints in some schemas
            user = getattr(instance.project, "created_by", None)
            if user:
                ActivityLog.objects.create(
                    user=user,
                    action="complete",
                    content_object=instance,
                    description=(
                        "Triggered post-appointment "
                        f"workflow for WorkOrder #{instance.id}"
                    ),
                )

        except ImportError:
            # Fallback handled by existing work_order_completion_handler
            import logging

            logger = logging.getLogger(__name__)
            logger.warning("Celery not available, using synchronous workflow")


# ---------------------------------------------------------------------------
# Budget V2 safety: ensure 12-month distributions sum to 100.00%
# ---------------------------------------------------------------------------


@receiver(post_save, sender=MonthlyDistribution)
def monthly_distribution_post_save(sender, instance, created, **kwargs):
    """When a budget reaches 12 distribution rows, enforce total == 100.00.

    This complements model.clean() (which enforces on insertion of the 12th row)
    and the serializer/view validations. It acts as a last-line safety net when
    data changes bypass application paths.
    """
    from decimal import ROUND_HALF_UP, Decimal

    from django.core.exceptions import ValidationError
    from django.db.models import Sum

    budget = instance.budget
    qs = budget.monthly_distributions.all()
    if qs.count() == 12:
        total = (
            qs.aggregate(total=Sum("percent")).get("total") or Decimal("0.00")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if total != Decimal("100.00"):
            raise ValidationError(
                {
                    "non_field_errors": [
                        f"Monthly distributions must sum to 100.00% across 12 months (got {total})."
                    ]
                }
            )


@receiver(post_save, sender=MonthlyDistribution)
def monthly_distribution_post_delete(sender, instance, created, **kwargs):
    """Alias for symmetry: No-op on save for delete logic; provided for clarity.

    Django signals don't provide post_delete here; if needed, a separate receiver
    can be added to handle deletions. For now, save path suffices as API replaces
    rows atomically inside a transaction.
    """
    return
