import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from .base import BaseSearchProvider

logger = logging.getLogger(__name__)


class SearchProviderFactory:
    """
    Factory for creating instances of search providers based on Django settings.
    This factory is responsible for dynamically loading and instantiating the
    search provider class specified in the `SEARCH_PROVIDER` setting.
    """

    _provider_class = None

    def __init__(self):
        if SearchProviderFactory._provider_class is None:
            provider_path = getattr(
                settings,
                "SEARCH_PROVIDER",
                "main.search.db_provider.DatabaseSearchProvider",
            )
            try:
                logger.info(f"Loading search provider from: {provider_path}")
                provider_class = import_string(provider_path)

                if not issubclass(provider_class, BaseSearchProvider):
                    raise ImproperlyConfigured(
                        f"Search provider '{provider_path}' is not a subclass of "
                        f"BaseSearchProvider."
                    )

                SearchProviderFactory._provider_class = provider_class
            except (ImportError, AttributeError) as e:
                raise ImproperlyConfigured(
                    f"Could not import search provider '{provider_path}': {e}"
                )

    def get_provider(self, user):
        """
        Get an instance of the configured search provider.

        :param user: The user for whom the provider is being instantiated.
        :return: An instance of the configured search provider.
        """
        if self._provider_class is None:
            # This should not happen if the constructor is called correctly.
            raise ImproperlyConfigured("Search provider class not loaded.")
        return self._provider_class(user=user)
