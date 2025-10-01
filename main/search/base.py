from abc import ABC, abstractmethod


class BaseSearchProvider(ABC):
    """
    Abstract base class for a search provider. Defines the interface
    that all search providers must implement.
    """

    def __init__(self, user):
        """
        Initializes the provider with the user context.

        :param user: The user performing the search.
        """
        self.user = user

    @abstractmethod
    def advanced_search(
        self, entity_type, query, filters, sort_by, sort_order, offset, limit
    ):
        """
        Perform a detailed search within a specific entity type.

        :param entity_type: The type of entity to search (e.g., 'contacts').
        :param query: The search query string.
        :param filters: A dictionary of filters to apply.
        :param sort_by: The field to sort the results by.
        :param sort_order: The sort order ('asc' or 'desc').
        :param offset: The starting offset for pagination.
        :param limit: The maximum number of results to return.
        :return: A tuple of (list of serialized results, total count).
        """
        pass

    @abstractmethod
    def get_search_suggestions(self, query, entity_type, limit):
        """
        Get search suggestions for a given query.

        :param query: The partial query string.
        :param entity_type: The entity type to source suggestions from.
        :param limit: The maximum number of suggestions to return.
        :return: A list of suggestion dictionaries.
        """
        pass
