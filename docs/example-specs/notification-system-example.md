# Example Specification: In-App Notification System

This example shows how to specify a supporting feature with simpler requirements.

## Feature Overview

**Feature Name**: In-App Notification System
**Epic**: User Experience Enhancement
**User Story**: "As a user, I want to receive in-app notifications for important events so that I can stay informed without checking email."

## Backend Specification

### Notification Model
```python
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('deal_won', 'Deal Won'),
        ('deal_lost', 'Deal Lost'),
        ('task_due', 'Task Due'),
        ('account_updated', 'Account Updated'),
        ('system_alert', 'System Alert'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True)  # Where to navigate when clicked
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Generic foreign key for linking to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
```

### Notification Service
```python
# File: main/notification_service.py (enhancement)
class NotificationService:
    @staticmethod
    def create_notification(recipient, title, message, notification_type,
                          sender=None, priority='medium', action_url='',
                          related_object=None):
        """Create a new notification"""
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            action_url=action_url,
            content_object=related_object
        )

        # Send real-time notification via WebSocket (if implemented)
        # channel_layer = get_channel_layer()
        # async_to_sync(channel_layer.group_send)(
        #     f"user_{recipient.id}",
        #     {
        #         "type": "notification_message",
        #         "notification": NotificationSerializer(notification).data
        #     }
        # )

        return notification

    @staticmethod
    def notify_deal_won(deal):
        """Notify when a deal is won"""
        NotificationService.create_notification(
            recipient=deal.owner,
            title=f"🎉 Deal Won: {deal.title}",
            message=f"Congratulations! Your deal with {deal.account.name} worth ${deal.value:,.2f} has been won.",
            notification_type='deal_won',
            priority='high',
            action_url=f'/deals/{deal.id}',
            related_object=deal
        )

        # Also notify the sales manager
        if deal.owner.groups.filter(name='Sales Rep').exists():
            managers = CustomUser.objects.filter(groups__name='Sales Manager')
            for manager in managers:
                NotificationService.create_notification(
                    recipient=manager,
                    title=f"Team Win: {deal.title}",
                    message=f"{deal.owner.get_full_name()} won a deal with {deal.account.name} worth ${deal.value:,.2f}.",
                    notification_type='deal_won',
                    priority='medium',
                    action_url=f'/deals/{deal.id}',
                    related_object=deal
                )

    @staticmethod
    def notify_task_due(task):
        """Notify when a task is due soon"""
        NotificationService.create_notification(
            recipient=task.assigned_to,
            title=f"⏰ Task Due: {task.title}",
            message=f"Your task '{task.title}' is due on {task.due_date.strftime('%B %d, %Y')}.",
            notification_type='task_due',
            priority='medium',
            action_url=f'/tasks/{task.id}',
            related_object=task
        )
```

### API ViewSet
```python
class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the user"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'status': f'{count} notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})
```

### Serializer
```python
class NotificationSerializer(ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'is_read', 'action_url', 'created_at', 'read_at',
            'sender', 'sender_name', 'time_ago'
        ]
        read_only_fields = ['created_at', 'read_at']

    def get_time_ago(self, obj):
        """Get human-readable time since notification was created"""
        now = timezone.now()
        diff = now - obj.created_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
```

## Frontend Specification

### NotificationDropdown Component
```jsx
// File: frontend/src/components/NotificationDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from 'lucide-react';
import api from '../api';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications({ page_size: 10 });
      setNotifications(response.data.results);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await api.markNotificationAsRead(notification.id);
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deal_won': return '🎉';
      case 'deal_lost': return '😞';
      case 'task_due': return '⏰';
      case 'account_updated': return '📋';
      case 'system_alert': return '⚠️';
      default: return '📄';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={handleDropdownToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary hover:text-primary-dark"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.notification_type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {notification.time_ago}
                          </span>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={() => {
                window.location.href = '/notifications';
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-primary hover:text-primary-dark"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
```

### NotificationPage Component
```jsx
// File: frontend/src/components/NotificationPage.jsx
const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filterType, filterRead]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications({
        page: currentPage,
        page_size: 20,
        notification_type: filterType,
        is_read: filterRead
      });
      setNotifications(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.markNotificationAsRead(notification.id);
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">All Notifications</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="deal_won">Deal Won</option>
            <option value="deal_lost">Deal Lost</option>
            <option value="task_due">Task Due</option>
            <option value="account_updated">Account Updated</option>
            <option value="system_alert">System Alert</option>
          </select>

          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="form-input"
          >
            <option value="">All Notifications</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingSkeleton />
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications found
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.is_read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-lg font-semibold ${
                    !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.priority}
                    </span>
                    {!notification.is_read && (
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{notification.message}</p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{notification.time_ago}</span>
                  {notification.sender_name && (
                    <span>From: {notification.sender_name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / 20)}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default NotificationPage;
```

## Integration with Existing System

### Signal Integration
```python
# File: main/signals.py (add to existing signals)
from .notification_service import NotificationService

@receiver(post_save, sender=Deal)
def deal_status_changed_handler(sender, instance, created, **kwargs):
    if not created and instance.status == 'won':
        # Existing WorkOrder creation logic...

        # Add notification
        NotificationService.notify_deal_won(instance)

@receiver(post_save, sender=Project)  # formerly Task
def task_due_reminder_handler(sender, instance, created, **kwargs):
    if instance.due_date and instance.due_date <= timezone.now().date() + timedelta(days=1):
        NotificationService.notify_task_due(instance)
```

### API Client Enhancement
```javascript
// File: frontend/src/api.js (add to existing API methods)
const notificationEndpoints = {
  getNotifications: (params = {}) => axiosInstance.get('/api/notifications/', { params }),
  getUnreadNotificationCount: () => axiosInstance.get('/api/notifications/unread_count/'),
  markNotificationAsRead: (id) => axiosInstance.post(`/api/notifications/${id}/mark_as_read/`),
  markAllNotificationsAsRead: () => axiosInstance.post('/api/notifications/mark_all_read/'),
};

// Export with existing API methods
export const {
  // ... existing methods
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = { ...existingEndpoints, ...notificationEndpoints };
```

## Testing Specification

### Backend Tests
```python
class NotificationAPITestCase(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='This is a test notification',
            notification_type='system_alert'
        )

    def test_get_notifications(self):
        """Test retrieving user's notifications"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/notifications/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Notification')

    def test_mark_as_read(self):
        """Test marking notification as read"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/notifications/{self.notification.id}/mark_as_read/')

        self.assertEqual(response.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
        self.assertIsNotNone(self.notification.read_at)

    def test_unread_count(self):
        """Test getting unread notification count"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/notifications/unread_count/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 1)
```

### Frontend Tests
```jsx
// File: frontend/src/__tests__/components/NotificationDropdown.test.jsx
describe('NotificationDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getUnreadNotificationCount.mockResolvedValue({
      data: { unread_count: 2 }
    });
  });

  test('displays correct unread count', async () => {
    render(<NotificationDropdown />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  test('opens dropdown and fetches notifications', async () => {
    mockedApi.getNotifications.mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            title: 'Test Notification',
            message: 'Test message',
            is_read: false,
            time_ago: '5 minutes ago'
          }
        ]
      }
    });

    render(<NotificationDropdown />);

    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });
  });
});
```

## Acceptance Criteria

### Functional Requirements
- ✅ Users receive notifications for important system events
- ✅ Notifications show in dropdown with unread count badge
- ✅ Users can mark individual notifications as read
- ✅ Users can mark all notifications as read
- ✅ Notifications link to relevant pages when clicked
- ✅ Different notification types have appropriate icons and colors
- ✅ Priority levels affect visual display
- ✅ Full notification page shows paginated history

### Technical Requirements
- ✅ Notifications persist in database
- ✅ Real-time updates via polling (WebSocket optional)
- ✅ Generic foreign key supports linking to any model
- ✅ Efficient database queries with proper indexing
- ✅ RESTful API with filtering and pagination
- ✅ Responsive design for mobile and desktop

### Performance Requirements
- ✅ Unread count loads in <500ms
- ✅ Dropdown notifications load in <1 second
- ✅ Mark as read operations complete in <300ms
- ✅ Notification page loads 20 items in <2 seconds

---

**This example shows how to specify a supporting feature with clear integration points to the existing system.**
