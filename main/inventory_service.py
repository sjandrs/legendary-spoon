"""
Inventory service for Advanced Field Service Management Module.
Implements REQ-017: inventory integration and reservation management.
"""

import logging
from typing import Dict, List, Optional

from django.db import transaction

from .models import ActivityLog, InventoryReservation, WarehouseItem

logger = logging.getLogger(__name__)


class InventoryService:
    """Service for managing inventory reservations and integrations"""

    def reserve_items(
        self, scheduled_event, items_needed: List[Dict], reserved_by
    ) -> Dict[str, any]:
        """
        Reserve inventory items for a scheduled event.
        Implements REQ-017: soft reservation system.

        Args:
            scheduled_event: ScheduledEvent instance
            items_needed: List of dicts with 'sku', 'quantity', 'warehouse_id' (optional)
            reserved_by: User making the reservation

        Returns:
            Dict with reservation results and errors
        """
        results = {"success": True, "reservations": [], "errors": [], "warnings": []}

        with transaction.atomic():
            for item_request in items_needed:
                try:
                    sku = item_request.get("sku")
                    quantity_needed = item_request.get("quantity", 1)
                    warehouse_id = item_request.get("warehouse_id")

                    # Find warehouse item
                    if warehouse_id:
                        warehouse_items = WarehouseItem.objects.filter(
                            sku=sku, warehouse_id=warehouse_id
                        )
                    else:
                        warehouse_items = WarehouseItem.objects.filter(sku=sku)

                    if not warehouse_items.exists():
                        results["errors"].append(f"Item {sku} not found in inventory")
                        results["success"] = False
                        continue

                    # Find item with sufficient quantity
                    suitable_item = None
                    for item in warehouse_items:
                        available_quantity = self.get_available_quantity(item)
                        if available_quantity >= quantity_needed:
                            suitable_item = item
                            break

                    if not suitable_item:
                        max_available = max(
                            [
                                self.get_available_quantity(item)
                                for item in warehouse_items
                            ]
                        )
                        results["errors"].append(
                            f"Insufficient inventory for {sku}. Needed: {quantity_needed}, "
                            f"Available: {max_available}"
                        )
                        results["success"] = False
                        continue

                    # Create reservation
                    reservation = InventoryReservation.objects.create(
                        scheduled_event=scheduled_event,
                        warehouse_item=suitable_item,
                        quantity_reserved=quantity_needed,
                        reserved_by=reserved_by,
                        status="reserved",
                    )

                    results["reservations"].append(
                        {
                            "reservation_id": reservation.id,
                            "sku": sku,
                            "quantity": quantity_needed,
                            "warehouse": suitable_item.warehouse.name,
                            "item_name": suitable_item.name,
                        }
                    )

                    # Log the reservation
                    ActivityLog.objects.create(
                        user=reserved_by,
                        action="create",
                        content_object=reservation,
                        description=(
                            f"Reserved {quantity_needed} units of {suitable_item.name} "
                            f"for work order {scheduled_event.work_order.id}"
                        ),
                    )

                    # Check for low stock warning
                    remaining_available = (
                        self.get_available_quantity(suitable_item) - quantity_needed
                    )
                    if remaining_available <= suitable_item.minimum_stock:
                        results["warnings"].append(
                            f"Low stock warning: {suitable_item.name} will have "
                            f"{remaining_available} units remaining after reservation"
                        )

                except Exception as e:
                    results["errors"].append(f"Failed to reserve {sku}: {str(e)}")
                    results["success"] = False
                    logger.error(f"Reservation error for {sku}: {str(e)}")

        return results

    def release_reservations(
        self, scheduled_event, released_by, reason: str = "Event cancelled"
    ) -> bool:
        """
        Release all inventory reservations for a scheduled event.

        Args:
            scheduled_event: ScheduledEvent instance
            released_by: User releasing the reservations
            reason: Reason for release

        Returns:
            True if successful, False otherwise
        """
        try:
            with transaction.atomic():
                reservations = scheduled_event.inventory_reservations.filter(
                    status="reserved"
                )

                for reservation in reservations:
                    reservation.release_reservation()

                    # Log the release
                    ActivityLog.objects.create(
                        user=released_by,
                        action="update",
                        content_object=reservation,
                        description=(
                            f"Released reservation for {reservation.quantity_reserved} units "
                            f"of {reservation.warehouse_item.name}. Reason: {reason}"
                        ),
                    )

                logger.info(
                    f"Released {reservations.count()} reservations for "
                    f"scheduled event {scheduled_event.id}"
                )
                return True

        except Exception as e:
            logger.error(f"Failed to release reservations: {str(e)}")
            return False

    def consume_reserved_inventory(
        self,
        scheduled_event,
        consumed_by,
        consumption_data: Optional[List[Dict]] = None,
    ) -> Dict[str, any]:
        """
        Mark reserved inventory as consumed and update warehouse quantities.

        Args:
            scheduled_event: ScheduledEvent instance
            consumed_by: User consuming the inventory
            consumption_data: Optional list of actual consumption amounts

        Returns:
            Dict with consumption results
        """
        results = {"success": True, "consumed_items": [], "errors": []}

        try:
            with transaction.atomic():
                reservations = scheduled_event.inventory_reservations.filter(
                    status="reserved"
                )

                for reservation in reservations:
                    # Find actual consumption amount
                    actual_quantity = reservation.quantity_reserved

                    if consumption_data:
                        for item_data in consumption_data:
                            if item_data.get("reservation_id") == reservation.id:
                                actual_quantity = item_data.get(
                                    "quantity_consumed", actual_quantity
                                )
                                break

                    # Validate consumption amount
                    if actual_quantity > reservation.quantity_reserved:
                        results["errors"].append(
                            f"Cannot consume {actual_quantity} units of "
                            f"{reservation.warehouse_item.name}. "
                            f"Only {reservation.quantity_reserved} units reserved."
                        )
                        results["success"] = False
                        continue

                    # Check warehouse stock
                    warehouse_item = reservation.warehouse_item
                    if warehouse_item.quantity < actual_quantity:
                        results["errors"].append(
                            f"Insufficient warehouse stock for {warehouse_item.name}. "
                            f"Requested: {actual_quantity}, Available: {warehouse_item.quantity}"
                        )
                        results["success"] = False
                        continue

                    # Update warehouse inventory
                    warehouse_item.quantity -= actual_quantity
                    warehouse_item.save()

                    # Update reservation
                    reservation.consume_inventory(actual_quantity)

                    results["consumed_items"].append(
                        {
                            "item_name": warehouse_item.name,
                            "sku": warehouse_item.sku,
                            "quantity_consumed": actual_quantity,
                            "remaining_warehouse_stock": warehouse_item.quantity,
                        }
                    )

                    # Log the consumption
                    ActivityLog.objects.create(
                        user=consumed_by,
                        action="update",
                        content_object=warehouse_item,
                        description=(
                            f"Consumed {actual_quantity} units of {warehouse_item.name} "
                            f"for work order {scheduled_event.work_order.id}. "
                            f"Remaining stock: {warehouse_item.quantity}"
                        ),
                    )

        except Exception as e:
            results["errors"].append(f"Failed to consume inventory: {str(e)}")
            results["success"] = False
            logger.error(f"Inventory consumption error: {str(e)}")

        return results

    def get_available_quantity(self, warehouse_item: WarehouseItem) -> float:
        """
        Calculate available quantity considering existing reservations.

        Args:
            warehouse_item: WarehouseItem instance

        Returns:
            Available quantity for new reservations
        """
        # Get total reserved quantity
        reserved_quantity = sum(
            reservation.quantity_reserved
            for reservation in warehouse_item.reservations.filter(status="reserved")
        )

        return max(0, warehouse_item.quantity - reserved_quantity)

    def check_availability(self, items_needed: List[Dict]) -> Dict[str, any]:
        """
        Check inventory availability without making reservations.

        Args:
            items_needed: List of dicts with 'sku', 'quantity', 'warehouse_id' (optional)

        Returns:
            Dict with availability status for each item
        """
        availability = {"all_available": True, "items": [], "warnings": []}

        for item_request in items_needed:
            sku = item_request.get("sku")
            quantity_needed = item_request.get("quantity", 1)
            warehouse_id = item_request.get("warehouse_id")

            # Find warehouse items
            if warehouse_id:
                warehouse_items = WarehouseItem.objects.filter(
                    sku=sku, warehouse_id=warehouse_id
                )
            else:
                warehouse_items = WarehouseItem.objects.filter(sku=sku)

            if not warehouse_items.exists():
                availability["all_available"] = False
                availability["items"].append(
                    {
                        "sku": sku,
                        "available": False,
                        "reason": "Item not found in inventory",
                    }
                )
                continue

            # Check availability across all warehouses
            max_available = 0
            best_warehouse = None

            for item in warehouse_items:
                available = self.get_available_quantity(item)
                if available > max_available:
                    max_available = available
                    best_warehouse = item.warehouse.name

            item_status = {
                "sku": sku,
                "quantity_needed": quantity_needed,
                "max_available": max_available,
                "available": max_available >= quantity_needed,
                "best_warehouse": best_warehouse,
            }

            if max_available < quantity_needed:
                availability["all_available"] = False
                item_status[
                    "reason"
                ] = f"Insufficient stock. Need: {quantity_needed}, Available: {max_available}"

            availability["items"].append(item_status)

        return availability

    def get_low_stock_items(self, warehouse_id: Optional[int] = None) -> List[Dict]:
        """
        Get items that are at or below minimum stock levels.

        Args:
            warehouse_id: Optional warehouse ID to filter by

        Returns:
            List of low stock items with details
        """
        queryset = WarehouseItem.objects.all()
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        low_stock_items = []

        for item in queryset:
            available_quantity = self.get_available_quantity(item)

            if available_quantity <= item.minimum_stock:
                low_stock_items.append(
                    {
                        "id": item.id,
                        "name": item.name,
                        "sku": item.sku,
                        "warehouse": item.warehouse.name,
                        "current_stock": item.quantity,
                        "available_quantity": available_quantity,
                        "minimum_stock": item.minimum_stock,
                        "reserved_quantity": item.quantity - available_quantity,
                        "urgency": "critical" if available_quantity == 0 else "low",
                    }
                )

        # Sort by urgency (critical first, then by available quantity)
        low_stock_items.sort(
            key=lambda x: (x["urgency"] != "critical", x["available_quantity"])
        )

        return low_stock_items

    def get_reservation_summary(self, scheduled_event) -> Dict[str, any]:
        """
        Get a summary of all reservations for a scheduled event.

        Args:
            scheduled_event: ScheduledEvent instance

        Returns:
            Dict with reservation summary
        """
        reservations = scheduled_event.inventory_reservations.all()

        summary = {
            "total_reservations": reservations.count(),
            "status_breakdown": {},
            "items": [],
            "total_value": 0,
        }

        # Count by status
        for status_code, status_name in InventoryReservation.STATUS_CHOICES:
            count = reservations.filter(status=status_code).count()
            if count > 0:
                summary["status_breakdown"][status_name] = count

        # Item details
        for reservation in reservations:
            item_value = (
                reservation.quantity_reserved * reservation.warehouse_item.unit_cost
            )
            summary["total_value"] += float(item_value)

            summary["items"].append(
                {
                    "reservation_id": reservation.id,
                    "item_name": reservation.warehouse_item.name,
                    "sku": reservation.warehouse_item.sku,
                    "quantity_reserved": reservation.quantity_reserved,
                    "quantity_consumed": reservation.quantity_consumed,
                    "status": reservation.get_status_display(),
                    "unit_cost": reservation.warehouse_item.unit_cost,
                    "total_value": item_value,
                    "warehouse": reservation.warehouse_item.warehouse.name,
                }
            )

        return summary


# Singleton instance - created on first use
inventory_service = None


def get_inventory_service():
    """Get inventory service singleton, creating it if needed"""
    global inventory_service
    if inventory_service is None:
        inventory_service = InventoryService()
    return inventory_service
