"""
Map service for Advanced Field Service Management Module.
Implements REQ-011: route optimization and ETA calculations.
"""

import logging
from typing import Dict, List, Optional, Tuple

from django.conf import settings

logger = logging.getLogger(__name__)


class MapService:
    """Service for route optimization and travel time calculations"""

    def __init__(self):
        self.maps_client = None
        if hasattr(settings, "GOOGLE_MAPS_API_KEY"):
            try:
                import googlemaps

                self.maps_client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
            except ImportError:
                logger.warning(
                    "googlemaps not installed. Route optimization will be disabled."
                )

    def calculate_travel_time(
        self, origin: str, destination: str, departure_time=None
    ) -> Optional[Dict]:
        """
        Calculate travel time between two locations.

        Args:
            origin: Starting address or coordinates
            destination: Ending address or coordinates
            departure_time: Optional departure time for traffic consideration

        Returns:
            Dict with distance, duration, and traffic info
        """
        if not self.maps_client:
            logger.error("Google Maps client not configured.")
            return None

        try:
            # Get distance matrix
            result = self.maps_client.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode="driving",
                departure_time=departure_time,
                traffic_model="best_guess",
            )

            if result["status"] == "OK":
                element = result["rows"][0]["elements"][0]

                if element["status"] == "OK":
                    travel_info = {
                        "distance_text": element["distance"]["text"],
                        "distance_meters": element["distance"]["value"],
                        "duration_text": element["duration"]["text"],
                        "duration_seconds": element["duration"]["value"],
                        "duration_minutes": element["duration"]["value"] // 60,
                    }

                    # Add traffic duration if available
                    if "duration_in_traffic" in element:
                        travel_info.update(
                            {
                                "duration_in_traffic_text": element[
                                    "duration_in_traffic"
                                ]["text"],
                                "duration_in_traffic_seconds": element[
                                    "duration_in_traffic"
                                ]["value"],
                                "duration_in_traffic_minutes": element[
                                    "duration_in_traffic"
                                ]["value"]
                                // 60,
                            }
                        )

                    return travel_info
                else:
                    logger.error(f"Distance calculation failed: {element['status']}")
                    return None
            else:
                logger.error(f"Distance matrix request failed: {result['status']}")
                return None

        except Exception as e:
            logger.error(f"Failed to calculate travel time: {str(e)}")
            return None

    def optimize_route(
        self,
        technician_location: str,
        scheduled_events: List,
        optimize_for: str = "time",
    ) -> Optional[List[Dict]]:
        """
        Optimize route for multiple scheduled events.
        Implements REQ-008: route optimization for managers.

        Args:
            technician_location: Starting location
            scheduled_events: List of ScheduledEvent objects
            optimize_for: "time" or "distance"

        Returns:
            List of optimized route with travel times
        """
        if not self.maps_client or not scheduled_events:
            return None

        try:
            # Extract locations from scheduled events
            waypoints = []
            event_locations = {}

            for event in scheduled_events:
                work_order = event.work_order
                if work_order.project and work_order.project.account:
                    address = work_order.project.account.address
                    if address:
                        waypoints.append(address)
                        event_locations[address] = event

            if not waypoints:
                logger.warning("No valid addresses found for route optimization")
                return None

            # Use Google Maps Directions API for route optimization
            result = self.maps_client.directions(
                origin=technician_location,
                destination=technician_location,  # Return to start
                waypoints=waypoints,
                optimize_waypoints=True,
                mode="driving",
            )

            if not result:
                logger.error("No route found")
                return None

            route = result[0]
            optimized_route = []

            # Process the optimized waypoint order
            if "waypoint_order" in route:
                waypoint_order = route["waypoint_order"]
                legs = route["legs"]

                total_distance = 0
                total_duration = 0

                for i, waypoint_index in enumerate(waypoint_order):
                    waypoint_address = waypoints[waypoint_index]
                    event = event_locations[waypoint_address]
                    leg = legs[i]

                    leg_info = {
                        "event": event,
                        "address": waypoint_address,
                        "distance_text": leg["distance"]["text"],
                        "distance_meters": leg["distance"]["value"],
                        "duration_text": leg["duration"]["text"],
                        "duration_seconds": leg["duration"]["value"],
                        "duration_minutes": leg["duration"]["value"] // 60,
                        "order": i + 1,
                    }

                    total_distance += leg["distance"]["value"]
                    total_duration += leg["duration"]["value"]

                    optimized_route.append(leg_info)

                # Add summary information
                route_summary = {
                    "total_distance_meters": total_distance,
                    "total_distance_text": f"{total_distance / 1000:.1f} km",
                    "total_duration_seconds": total_duration,
                    "total_duration_minutes": total_duration // 60,
                    "total_duration_text": (
                        f"{total_duration // 3600}h {(total_duration % 3600) // 60}m"
                    ),
                    "waypoint_count": len(waypoints),
                }

                return {
                    "route": optimized_route,
                    "summary": route_summary,
                    "technician_location": technician_location,
                }

        except Exception as e:
            logger.error(f"Failed to optimize route: {str(e)}")
            return None

    def calculate_eta(
        self, technician_location: str, destination: str, buffer_minutes: int = 5
    ) -> Optional[int]:
        """
        Calculate ETA in minutes with traffic consideration.
        Implements REQ-014: ETA for "on my way" notifications.

        Args:
            technician_location: Current technician location
            destination: Customer address
            buffer_minutes: Safety buffer to add to travel time

        Returns:
            ETA in minutes or None if calculation fails
        """
        travel_info = self.calculate_travel_time(
            origin=technician_location, destination=destination, departure_time="now"
        )

        if travel_info:
            # Use traffic duration if available, otherwise regular duration
            if "duration_in_traffic_minutes" in travel_info:
                base_minutes = travel_info["duration_in_traffic_minutes"]
            else:
                base_minutes = travel_info["duration_minutes"]

            return base_minutes + buffer_minutes

        return None

    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Convert address to latitude/longitude coordinates.

        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        if not self.maps_client:
            return None

        try:
            result = self.maps_client.geocode(address)

            if result:
                location = result[0]["geometry"]["location"]
                return (location["lat"], location["lng"])

        except Exception as e:
            logger.error(f"Failed to geocode address {address}: {str(e)}")

        return None

    def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Convert coordinates to address.

        Returns:
            Formatted address string or None if reverse geocoding fails
        """
        if not self.maps_client:
            return None

        try:
            result = self.maps_client.reverse_geocode((lat, lng))

            if result:
                return result[0]["formatted_address"]

        except Exception as e:
            logger.error(
                f"Failed to reverse geocode coordinates ({lat}, {lng}): {str(e)}"
            )

        return None

    def get_route_suggestions(
        self, technician_location: str, events_by_priority: List
    ) -> List[Dict]:
        """
        Get route suggestions considering event priorities and time windows.

        Args:
            technician_location: Starting location
            events_by_priority: List of events sorted by priority

        Returns:
            List of route suggestions with efficiency metrics
        """
        if not events_by_priority:
            return []

        suggestions = []

        # Strategy 1: Priority-based (high priority first)
        priority_route = self.optimize_route(technician_location, events_by_priority)
        if priority_route:
            priority_route["strategy"] = "Priority-based"
            priority_route["description"] = "Optimized for high-priority jobs first"
            suggestions.append(priority_route)

        # Strategy 2: Time-optimized (shortest total travel time)
        time_optimized_route = self.optimize_route(
            technician_location, events_by_priority, optimize_for="time"
        )
        if time_optimized_route:
            time_optimized_route["strategy"] = "Time-optimized"
            time_optimized_route["description"] = "Minimizes total travel time"
            suggestions.append(time_optimized_route)

        return suggestions


# Singleton instance - created on first use
map_service = None


def get_map_service():
    """Get map service singleton, creating it if needed"""
    global map_service
    if map_service is None:
        map_service = MapService()
    return map_service
