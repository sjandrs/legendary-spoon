from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import api_views, search_views
from .api_auth_views import LoginView, LogoutView, UserDetailView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"posts", api_views.PostViewSet, basename="post")
router.register(r"tags", api_views.TagViewSet, basename="tag")
router.register(r"accounts", api_views.AccountViewSet, basename="account")
router.register(r"contacts", api_views.ContactViewSet, basename="contact")
router.register(r"projects", api_views.ProjectViewSet, basename="project")
router.register(r"deals", api_views.DealViewSet, basename="deal")
router.register(r"deal-stages", api_views.DealStageViewSet, basename="dealstage")
router.register(r"interactions", api_views.InteractionViewSet, basename="interaction")
router.register(r"quotes", api_views.QuoteViewSet, basename="quote")
router.register(r"quote-items", api_views.QuoteItemViewSet, basename="quoteitem")
router.register(r"invoices", api_views.InvoiceViewSet, basename="invoice")
router.register(r"invoice-items", api_views.InvoiceItemViewSet, basename="invoiceitem")
router.register(r"custom-fields", api_views.CustomFieldViewSet, basename="customfield")
router.register(
    r"custom-field-values",
    api_views.CustomFieldValueViewSet,
    basename="customfieldvalue",
)
router.register(r"activity-logs", api_views.ActivityLogViewSet, basename="activitylog")
router.register(
    r"project-templates", api_views.ProjectTemplateViewSet, basename="projecttemplate"
)
router.register(
    r"default-work-order-items",
    api_views.DefaultWorkOrderItemViewSet,
    basename="defaultworkorderitem",
)
router.register(r"project-types", api_views.ProjectTypeViewSet, basename="projecttype")
router.register(
    r"ledger-accounts", api_views.LedgerAccountViewSet, basename="ledgeraccount"
)
router.register(
    r"journal-entries", api_views.JournalEntryViewSet, basename="journalentry"
)
router.register(r"work-orders", api_views.WorkOrderViewSet, basename="workorder")
router.register(r"line-items", api_views.LineItemViewSet, basename="lineitem")
router.register(r"payments", api_views.PaymentViewSet, basename="payment")
router.register(r"expenses", api_views.ExpenseViewSet, basename="expense")
router.register(r"budgets", api_views.BudgetViewSet, basename="budget")
router.register(r"time-entries", api_views.TimeEntryViewSet, basename="timeentry")
router.register(r"warehouses", api_views.WarehouseViewSet, basename="warehouse")
router.register(
    r"warehouse-items", api_views.WarehouseItemViewSet, basename="warehouseitem"
)
# Phase 3: Analytics APIs
router.register(
    r"analytics-snapshots",
    api_views.AnalyticsSnapshotViewSet,
    basename="analyticssnapshot",
)

# Phase 4: Technician & User Management APIs
router.register(
    r"certifications", api_views.CertificationViewSet, basename="certification"
)
router.register(r"technicians", api_views.TechnicianViewSet, basename="technician")
router.register(
    r"technician-certifications",
    api_views.TechnicianCertificationViewSet,
    basename="techniciancertification",
)
router.register(
    r"coverage-areas", api_views.CoverageAreaViewSet, basename="coveragearea"
)
router.register(
    r"technician-availability",
    api_views.TechnicianAvailabilityViewSet,
    basename="technicianavailability",
)
router.register(
    r"enhanced-users", api_views.EnhancedUserViewSet, basename="enhanceduser"
)
router.register(
    r"work-order-cert-requirements",
    api_views.WorkOrderCertificationRequirementViewSet,
    basename="workordercertrequirement",
)

# Phase 5: Field Service Management APIs
router.register(
    r"scheduled-events", api_views.ScheduledEventViewSet, basename="scheduledevent"
)
router.register(
    r"notification-logs", api_views.NotificationLogViewSet, basename="notificationlog"
)
router.register(
    r"paperwork-templates",
    api_views.PaperworkTemplateViewSet,
    basename="paperworktemplate",
)
router.register(
    r"appointment-requests",
    api_views.AppointmentRequestViewSet,
    basename="appointmentrequest",
)
router.register(
    r"digital-signatures",
    api_views.DigitalSignatureViewSet,
    basename="digitalsignature",
)
router.register(
    r"inventory-reservations",
    api_views.InventoryReservationViewSet,
    basename="inventoryreservation",
)
router.register(
    r"scheduling-analytics",
    api_views.SchedulingAnalyticsViewSet,
    basename="schedulinganalytics",
)

# Infrastructure APIs
router.register(
    r"notifications", api_views.NotificationViewSet, basename="notification"
)
router.register(
    r"rich-text-content", api_views.RichTextContentViewSet, basename="richtextcontent"
)
router.register(r"log-entries", api_views.LogEntryViewSet, basename="logentry")
router.register(r"pages", api_views.PageViewSet, basename="page")
router.register(r"comments", api_views.CommentViewSet, basename="comment")

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path("", include(router.urls)),
    path(
        "dashboard-stats/",
        api_views.DashboardStatsView.as_view(),
        name="dashboard-stats",
    ),
    # ... existing url patterns
    path("kb/", api_views.KnowledgeBaseView.as_view(), name="kb-list"),
    path("kb/<str:file_name>/", api_views.MarkdownFileView.as_view(), name="kb-file"),
    # Search
    path("search/", search_views.SearchAPIView.as_view(), name="api_search"),
    path(
        "search/filters/",
        search_views.SearchFiltersAPIView.as_view(),
        name="api_search_filters",
    ),
    path("my-contacts/", api_views.MyContactsView.as_view(), name="my-contacts"),
    # Auth
    path("auth/login/", LoginView.as_view(), name="api_login"),
    path("auth/logout/", LogoutView.as_view(), name="api_logout"),
    path("auth/user/", UserDetailView.as_view(), name="api_user_detail"),
    # User Roles
    path("user-roles/", api_views.UserRoleManagementView.as_view(), name="user-roles"),
    # Financial Reports
    path(
        "reports/balance-sheet/", api_views.balance_sheet_report, name="balance-sheet"
    ),
    path("reports/pnl/", api_views.profit_loss_report, name="profit-loss"),
    path("reports/cash-flow/", api_views.cash_flow_report, name="cash-flow"),
    # Invoice Management
    path(
        "workorders/<int:workorder_id>/generate-invoice/",
        api_views.generate_workorder_invoice,
        name="generate-workorder-invoice",
    ),
    path("invoices/overdue/", api_views.overdue_invoices, name="overdue-invoices"),
    # Tax Reporting
    path("tax-report/", api_views.tax_report, name="tax-report"),
    # Email Communication
    path(
        "invoices/<int:invoice_id>/send-email/",
        api_views.send_invoice_email,
        name="send-invoice-email",
    ),
    path(
        "invoices/send-overdue-reminders/",
        api_views.send_overdue_reminders,
        name="send-overdue-reminders",
    ),
    # Analytics
    path(
        "analytics/dashboard/",
        api_views.dashboard_analytics,
        name="dashboard-analytics",
    ),
    # Phase 3: Advanced Analytics
    path(
        "analytics/dashboard-v2/",
        api_views.analytics_dashboard,
        name="analytics-dashboard-v2",
    ),
    path(
        "analytics/clv/<int:contact_id>/",
        api_views.calculate_clv,
        name="calculate-clv",
    ),
    path(
        "analytics/predict/<int:deal_id>/",
        api_views.predict_deal_outcome,
        name="predict-deal-outcome",
    ),
    path(
        "analytics/forecast/",
        api_views.generate_revenue_forecast,
        name="generate-revenue-forecast",
    ),
    # Phase 4: Technician Assignment & Matching APIs
    path(
        "work-orders/<int:work_order_id>/find-technicians/",
        api_views.find_available_technicians,
        name="find-available-technicians",
    ),
    path(
        "work-orders/<int:work_order_id>/assign-technician/",
        api_views.assign_technician_to_work_order,
        name="assign-technician-to-work-order",
    ),
    path(
        "technicians/available/",
        api_views.get_available_technicians,
        name="get-available-technicians",
    ),
    path(
        "technicians/<int:technician_id>/payroll/",
        api_views.technician_payroll_report,
        name="technician-payroll-report",
    ),
    # Phase 5: Field Service Management endpoints
    path(
        "scheduling/route-optimization/",
        api_views.optimize_technician_routes,
        name="optimize-technician-routes",
    ),
    path(
        "scheduling/availability-check/",
        api_views.check_technician_availability,
        name="check-technician-availability",
    ),
    path(
        "notifications/send-reminder/",
        api_views.send_appointment_reminder,
        name="send-appointment-reminder",
    ),
    path(
        "notifications/send-on-way/",
        api_views.send_on_way_notification,
        name="send-on-way-notification",
    ),
]
