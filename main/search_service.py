from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from .models import Account, Contact, Project, Deal, Quote, Invoice, ActivityLog
from .search_models import GlobalSearchIndex, SavedSearch
import re
from typing import List, Dict, Any, Optional, Tuple


class SearchService:
    """Service class for advanced search functionality"""
    
    SEARCHABLE_MODELS = {
        'accounts': Account,
        'contacts': Contact,
        'projects': Project,
        'deals': Deal,
        'quotes': Quote,
        'invoices': Invoice,
    }
    
    def __init__(self, user=None):
        self.user = user
    
    def global_search(self, query: str, filters: Dict[str, Any] = None, limit: int = 50) -> Dict[str, List]:
        """Perform global search across all entities"""
        results = {}
        
        if not query or len(query.strip()) < 2:
            return results
        
        # Normalize query
        query = query.strip().lower()
        search_terms = self._extract_search_terms(query)
        
        for entity_type, model in self.SEARCHABLE_MODELS.items():
            # Apply user-based filtering
            queryset = self._get_user_queryset(model)
            
            # Apply search
            search_results = self._search_in_model(queryset, search_terms, model)
            
            # Apply additional filters if provided
            if filters and entity_type in filters:
                search_results = self._apply_filters(search_results, filters[entity_type], model)
            
            # Limit results
            search_results = search_results[:limit]
            
            if search_results:
                results[entity_type] = [self._serialize_search_result(obj) for obj in search_results]
        
        return results
    
    def advanced_search(self, entity_type: str, query: str = "", filters: Dict[str, Any] = None, 
                       sort_by: str = None, sort_order: str = 'desc', 
                       offset: int = 0, limit: int = 50) -> Tuple[List, int]:
        """Perform advanced search on a specific entity type"""
        
        if entity_type not in self.SEARCHABLE_MODELS:
            raise ValueError(f"Entity type '{entity_type}' not supported")
        
        model = self.SEARCHABLE_MODELS[entity_type]
        queryset = self._get_user_queryset(model)
        
        # Apply text search if query provided
        if query and len(query.strip()) >= 2:
            search_terms = self._extract_search_terms(query)
            queryset = self._search_in_model(queryset, search_terms, model)
        
        # Apply filters
        if filters:
            queryset = self._apply_filters(queryset, filters, model)
        
        # Get total count before pagination
        total_count = queryset.count()
        
        # Apply sorting
        if sort_by:
            order_prefix = '-' if sort_order == 'desc' else ''
            try:
                queryset = queryset.order_by(f'{order_prefix}{sort_by}')
            except:
                # Fallback to default ordering if sort field is invalid
                pass
        
        # Apply pagination
        results = queryset[offset:offset + limit]
        
        return list(results), total_count
    
    def save_search(self, name: str, description: str, search_type: str, 
                   query: str = "", filters: Dict[str, Any] = None, 
                   sort_by: str = None, sort_order: str = 'desc', 
                   is_public: bool = False) -> SavedSearch:
        """Save a search for later use"""
        
        if not self.user:
            raise ValueError("User required to save searches")
        
        saved_search = SavedSearch.objects.create(
            name=name,
            description=description,
            user=self.user,
            search_type=search_type,
            search_query=query,
            filters=filters or {},
            sort_by=sort_by or '',
            sort_order=sort_order,
            is_public=is_public
        )
        
        return saved_search
    
    def execute_saved_search(self, saved_search_id: int, offset: int = 0, limit: int = 50) -> Tuple[List, int]:
        """Execute a saved search"""
        
        saved_search = SavedSearch.objects.get(
            id=saved_search_id,
            user=self.user if not SavedSearch.objects.get(id=saved_search_id).is_public else saved_search.user
        )
        
        # Increment usage
        saved_search.increment_usage()
        
        # Execute the search
        if saved_search.search_type == 'global':
            results = self.global_search(
                saved_search.search_query,
                saved_search.get_filters_dict()
            )
            return results, sum(len(v) for v in results.values())
        else:
            return self.advanced_search(
                saved_search.search_type,
                saved_search.search_query,
                saved_search.get_filters_dict(),
                saved_search.sort_by,
                saved_search.sort_order,
                offset,
                limit
            )
    
    def get_search_suggestions(self, query: str, entity_type: str = None, limit: int = 10) -> List[str]:
        """Get search suggestions based on indexed content"""
        
        if len(query.strip()) < 2:
            return []
        
        query = query.strip().lower()
        
        # Query the search index for suggestions
        index_query = GlobalSearchIndex.objects.filter(
            search_vector__icontains=query
        )
        
        if entity_type and entity_type in self.SEARCHABLE_MODELS:
            index_query = index_query.filter(entity_type=entity_type)
        
        if self.user:
            index_query = index_query.filter(owner=self.user)
        
        suggestions = []
        for index_entry in index_query[:limit * 2]:  # Get more to filter duplicates
            title = index_entry.title
            if title.lower().startswith(query) and title not in suggestions:
                suggestions.append(title)
                if len(suggestions) >= limit:
                    break
        
        return suggestions
    
    def _get_user_queryset(self, model):
        """Get queryset filtered by user permissions"""
        if not self.user or not self.user.is_authenticated:
            return model.objects.none()

        # Managers and Admins can see everything
        if self.user.groups.filter(name__in=['Sales Manager', 'Admin']).exists():
            return model.objects.all()

        # Default behavior for other users (e.g., Sales Reps)
        queryset = model.objects.all()
        if hasattr(model, 'owner'):
            queryset = queryset.filter(owner=self.user)
        elif hasattr(model, 'user'):
            queryset = queryset.filter(user=self.user)
        elif hasattr(model, 'assigned_to'):
            # For projects, show projects assigned to or created by the user
            queryset = queryset.filter(Q(assigned_to=self.user) | Q(created_by=self.user))
        
        return queryset
    
    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract search terms from query string"""
        # Remove special characters and split by spaces
        clean_query = re.sub(r'[^\w\s]', ' ', query)
        terms = [term.strip() for term in clean_query.split() if len(term.strip()) >= 2]
        return terms
    
    def _search_in_model(self, queryset, search_terms: List[str], model):
        """Apply search terms to a model queryset"""
        if not search_terms:
            return queryset
        
        search_fields = self._get_search_fields(model)
        query = Q()
        
        for term in search_terms:
            term_query = Q()
            for field in search_fields:
                term_query |= Q(**{f'{field}__icontains': term})
            query &= term_query
        
        return queryset.filter(query).distinct()
    
    def _get_search_fields(self, model) -> List[str]:
        """Get searchable fields for a model"""
        search_fields_map = {
            'Account': ['name', 'website', 'description', 'phone', 'email'],
            'Contact': ['first_name', 'last_name', 'email', 'phone', 'title', 'company'],
            'Project': ['title', 'description'],
            'Deal': ['name', 'description'],
            'Quote': ['quote_number', 'notes'],
            'Invoice': ['invoice_number', 'notes'],
        }
        
        model_name = model.__name__
        return search_fields_map.get(model_name, ['name'])
    
    def _apply_filters(self, queryset, filters: Dict[str, Any], model):
        """Apply filters to queryset"""
        filter_kwargs = {}
        
        for field, value in filters.items():
            if value is None or value == '':
                continue
            
            # Handle different filter types
            if isinstance(value, dict):
                # Range filters (e.g., {'gte': 100, 'lte': 1000})
                for operator, filter_value in value.items():
                    if operator in ['gte', 'lte', 'gt', 'lt']:
                        filter_kwargs[f'{field}__{operator}'] = filter_value
            elif isinstance(value, list):
                # Multiple choice filters
                filter_kwargs[f'{field}__in'] = value
            elif field.endswith('_date') or field == 'due_date' or field == 'created_at':
                # Date filters - handle date range
                if isinstance(value, str) and 'to' in value:
                    date_parts = value.split(' to ')
                    if len(date_parts) == 2:
                        filter_kwargs[f'{field}__gte'] = date_parts[0]
                        filter_kwargs[f'{field}__lte'] = date_parts[1]
                    else:
                        filter_kwargs[field] = value
                else:
                    filter_kwargs[field] = value
            elif field.endswith('_contains'):
                # Text contains filters
                actual_field = field.replace('_contains', '')
                filter_kwargs[f'{actual_field}__icontains'] = value
            elif model._meta.get_field(field).get_internal_type() in ['CharField', 'TextField']:
                # Text contains filters for CharField and TextField
                filter_kwargs[f'{field}__icontains'] = value
            else:
                # Exact match filters (case-insensitive for strings)
                if isinstance(value, str):
                    filter_kwargs[f'{field}__iexact'] = value
                else:
                    filter_kwargs[field] = value
        
        if filter_kwargs:
            queryset = queryset.filter(**filter_kwargs)
        
        return queryset
    
    def _serialize_search_result(self, obj) -> Dict[str, Any]:
        """Serialize a search result object"""
        result = {
            'id': obj.pk,
            'type': obj.__class__.__name__.lower(),
            'title': str(obj),
            'url': f'/{obj.__class__.__name__.lower()}s/{obj.pk}/',
        }
        
        # Add model-specific fields
        if hasattr(obj, 'email'):
            result['email'] = obj.email
        if hasattr(obj, 'phone'):
            result['phone'] = obj.phone
        if hasattr(obj, 'status'):
            result['status'] = obj.status
        if hasattr(obj, 'priority'):
            result['priority'] = obj.priority
        if hasattr(obj, 'value') and hasattr(obj.value, '__float__'):
            result['value'] = float(obj.value)
        if hasattr(obj, 'due_date'):
            result['due_date'] = obj.due_date.isoformat() if obj.due_date else None
        if hasattr(obj, 'created_at'):
            result['created_at'] = obj.created_at.isoformat()
        
        return result


class BulkOperationService:
    """Service for handling bulk operations"""
    
    def __init__(self, user):
        self.user = user
    
    def bulk_update(self, entity_type: str, filters: Dict[str, Any], 
                   update_data: Dict[str, Any], batch_size: int = 100):
        """Perform bulk update operation"""
        from .search_models import BulkOperation
        from django.utils import timezone
        
        if entity_type not in SearchService.SEARCHABLE_MODELS:
            raise ValueError(f"Entity type '{entity_type}' not supported")
        
        model = SearchService.SEARCHABLE_MODELS[entity_type]
        
        # Create bulk operation record
        bulk_op = BulkOperation.objects.create(
            operation_type='update',
            user=self.user,
            entity_type=entity_type,
            filters=filters,
            operation_data=update_data
        )
        
        try:
            # Get search service
            search_service = SearchService(self.user)
            
            # Get queryset to update
            queryset = search_service._get_user_queryset(model)
            queryset = search_service._apply_filters(queryset, filters, model)
            
            bulk_op.total_records = queryset.count()
            bulk_op.status = 'running'
            bulk_op.started_at = timezone.now()
            bulk_op.save()
            
            # Process in batches
            processed = 0
            successful = 0
            
            for batch in self._batch_queryset(queryset, batch_size):
                for obj in batch:
                    try:
                        # Update object
                        for field, value in update_data.items():
                            if hasattr(obj, field):
                                setattr(obj, field, value)
                        obj.save()
                        
                        successful += 1
                        
                        # Update search index
                        GlobalSearchIndex.update_or_create_for_object(obj)
                        
                    except Exception as e:
                        bulk_op.failed_records += 1
                    
                    processed += 1
                
                # Update progress
                bulk_op.processed_records = processed
                bulk_op.successful_records = successful
                bulk_op.save()
            
            # Mark as completed
            bulk_op.status = 'completed'
            bulk_op.completed_at = timezone.now()
            bulk_op.save()
            
        except Exception as e:
            bulk_op.status = 'failed'
            bulk_op.error_message = str(e)
            bulk_op.completed_at = timezone.now()
            bulk_op.save()
            raise
        
        return bulk_op
    
    def bulk_delete(self, entity_type: str, filters: Dict[str, Any], batch_size: int = 100):
        """Perform bulk delete operation"""
        # Similar implementation to bulk_update but for deletion
        # Implementation would be similar to bulk_update
        pass
    
    def _batch_queryset(self, queryset, batch_size):
        """Yield batches of queryset"""
        start = 0
        while True:
            batch = list(queryset[start:start + batch_size])
            if not batch:
                break
            yield batch
            start += batch_size