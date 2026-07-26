from django.contrib import admin

from apps.bookings.models import ServiceRequest, Booking, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ["sender", "body", "sent_at"]


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "provider", "category", "status", "preferred_date", "created_at"]
    list_filter = ["status", "category"]
    search_fields = ["client__email", "provider__user__email", "description"]
    inlines = [MessageInline]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "provider", "agreed_price_kes", "status", "payment_status", "scheduled_date"]
    list_filter = ["status", "payment_status"]
    search_fields = ["client__email", "provider__user__email"]
    readonly_fields = ["created_at", "confirmed_at", "completed_at", "cancelled_at"]
