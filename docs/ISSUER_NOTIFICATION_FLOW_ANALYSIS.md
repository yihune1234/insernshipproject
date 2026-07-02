# Issuer Notification Flow — Full Analysis

## 1. Overview

The Issuer notification system enables organizations (issuers) to receive real-time updates about credential requests, sync completions, and other events. This document maps the complete flow from backend to frontend.

---

## 2. Backend Structure

### 2.1 URL Routing

**`backend/config/urls.py`** — Root URL configuration:
```python
path("api/v1/notifications/", include("apps.notifications.urls")),  # General notifications
path("api/v1/integration/", include("apps.issuer.urls")),           # Issuer-specific
```

**`backend/apps/notifications/urls.py`** — Notification endpoints:
```python
urlpatterns = [
    path("", NotificationListView.as_view()),                                    # GET /notifications/
    path("unread-count/", UnreadCountView.as_view()),                             # GET /notifications/unread-count/
    path("mark-read/", MarkReadView.as_view()),                                   # POST /notifications/mark-read/
    path("mark-all-read/", MarkAllReadView.as_view()),                            # POST /notifications/mark-all-read/
    path("preferences/", NotificationPreferencesView.as_view()),                  # GET/PUT /notifications/preferences/
    path("issuer/unread-count/", IssuerUnreadCountView.as_view()),                # GET /notifications/issuer/unread-count/
    path("issuer/stream/", IssuerNotificationStreamView.as_view()),               # GET /notifications/issuer/stream/
]
```

**`backend/apps/issuer/urls.py`** — Issuer-specific endpoints (notification-related):
```python
path("notifications/unread-count/", IssuerUnreadCountView.as_view()),    # GET /integration/notifications/unread-count/
path("notifications/stream/", IssuerNotificationStreamView.as_view()),    # GET /integration/notifications/stream/
```

### 2.2 View Layer

**`backend/apps/notifications/views/notifications.py`** — General notification views:

| Class | Method | Endpoint | Description |
|-------|--------|----------|-------------|
| `NotificationListView` | GET | `/notifications/` | List all notifications for authenticated user |
| `NotificationListView` | DELETE | `/notifications/` | Clear all notifications |
| `MarkReadView` | POST | `/notifications/mark-read/` | Mark specific notifications as read |
| `MarkAllReadView` | POST | `/notifications/mark-all-read/` | Mark all notifications as read |
| `NotificationPreferencesView` | GET | `/notifications/preferences/` | Get notification preferences |
| `NotificationPreferencesView` | PUT | `/notifications/preferences/` | Update notification preferences |
| `UnreadCountView` | GET | `/notifications/unread-count/` | Get unread count (generic) |

**`backend/apps/notifications/views/issuer.py`** — Issuer-specific views:

| Class | Method | Endpoint | Description |
|-------|--------|----------|-------------|
| `IssuerUnreadCountView` | GET | `/notifications/issuer/unread-count/` and `/integration/notifications/unread-count/` | Get issuer unread notification count |
| `IssuerNotificationStreamView` | GET | `/notifications/issuer/stream/` and `/integration/notifications/stream/` | Get top 10 unread notifications for issuer |

**`IssuerUnreadCountView`** implementation:
```python
class IssuerUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return success_response(data={"unread_count": count})
```

**`IssuerNotificationStreamView`** implementation:
```python
class IssuerNotificationStreamView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).order_by('-created_at')[:10]

        return success_response(data=NotificationSerializer(notifications, many=True).data)
```

### 2.3 Service Layer

**`backend/apps/notifications/services/notification_service.py`** — `NotificationService` class:

| Method | Trigger | Description |
|--------|---------|-------------|
| `send(recipient, title, message, notification_type)` | Any notification | Creates Notification record + optionally queues email via Celery |
| `notify_credential_received(user, credential)` | Holder receives credential | Creates "New Credential Received" notification |
| `notify_credential_revoked(user, credential, reason)` | Credential revoked | Creates "Credential Revoked" notification |
| `notify_sync_complete(user, sync_result)` | Sync finished | Creates "Sync Complete" notification with created/updated counts |

**Flow diagram** for `send()`:
```
NotificationService.send()
    │
    ├── Creates Notification object in DB
    │
    ├── Checks NotificationPreference.email_notifications
    │
    └── If enabled → queues Celery task: send_notification_email_task.delay()
```

### 2.4 Model Layer

**`backend/apps/notifications/models/notification.py`** — `Notification` model:

| Field | Type | Description |
|-------|------|-------------|
| `recipient` | ForeignKey(User) | The user who receives the notification |
| `title` | CharField(200) | Notification title |
| `message` | TextField | Notification body |
| `notification_type` | CharField(20) | Type: credential_received, credential_revoked, sync_complete, etc. |
| `is_read` | BooleanField(default=False) | Read status |
| `read_at` | DateTimeField(nullable) | When it was read |
| `created_at` | DateTimeField(auto_now_add) | Creation timestamp |

**`backend/apps/notifications/models/preference.py`** — `NotificationPreference` model:

| Field | Type | Description |
|-------|------|-------------|
| `user` | OneToOneField(User) | The user |
| `email_notifications` | BooleanField(default=True) | Whether to send email |
| `push_notifications` | BooleanField(default=True) | Whether to send push |
| `in_app_notifications` | BooleanField(default=True) | Whether to show in-app |

### 2.5 Serializer Layer

**`backend/apps/notifications/serializers/notification.py`**:

| Serializer | Purpose |
|------------|---------|
| `NotificationSerializer` | Serializes Notification model to JSON |
| `NotificationPreferenceSerializer` | Serializes NotificationPreference model |
| `MarkReadSerializer` | Validates `{ "ids": [uuid, ...] }` payload |

### 2.6 API Response Format

All views use the `success_response()` helper from `common/api_response.py`:

```json
{
    "success": true,
    "data": { ... }  // The actual payload
}
```

---

## 3. Frontend Structure

### 3.1 API Client Configuration

**`frontend/.env`**:
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**`frontend/src/utils/constants.js`**:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
```

**`frontend/src/api/axios.js`** — Axios instance with response interceptor that **auto-unwraps** Django's `success_response`:

```javascript
api.interceptors.response.use(
  (response) => {
    // Unwraps { success: true, data: ... } → returns data directly
    if (response.data && response.data.success === true && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  // ... 401 refresh logic
);
```

### 3.2 Issuer API Module

**`frontend/src/api/issuer.js`** — Issuer-specific API calls:

| Function | Method | Path (after base URL) | Purpose |
|----------|--------|----------------------|---------|
| `getIssuerUnreadCount()` | GET | `/integration/notifications/unread-count/` | Get unread notification count |
| `getIssuerNotificationStream(params)` | GET | `/integration/notifications/stream/` | Get notification stream |
| `markNotificationsRead(data)` | POST | `/notifications/mark-read/` | Mark notifications as read |
| `getIssuerNotifications()` | GET | (alias for stream) | Backward compat |

### 3.3 Notification Hook

**`frontend/src/hooks/useNotifications.js`** — Central notification hook:

```javascript
const useNotifications = () => {
  const { role, isAuthenticated } = useAuthStore();

  // Polls for unread count every NOTIFICATION_POLL_INTERVAL ms
  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || !role || role === 'admin') return;
    const res = await getUnreadCount(role);          // → GET /notifications/unread-count/
    storeModule.getState().setUnreadCount(res.data?.unread_count || 0);
  }, [role, isAuthenticated]);

  // Fetches full notification list
  const fetchNotifications = useCallback(async (params) => {
    res = await getNotifications(params);             // → GET /notifications/?params
    storeModule.getState().setNotifications(data);
  }, [role, isAuthenticated]);

  // Starts polling on mount
  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, NOTIFICATION_POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchCount]);

  return { fetchCount, fetchNotifications, markRead, markAllRead, deleteNotification };
};
```

### 3.4 SSE (Server-Sent Events) Hook

**`frontend/src/hooks/useSSENotifications.js`** — Real-time notification via SSE:

```javascript
export function useSSENotifications({ onNotification, onConnect, enabled = true }) {
  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/integration/notifications/stream/?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);       // Opens SSE connection to issuer endpoint

    es.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'connected') {
        onConnect?.(payload);              // Initial connection established
      } else if (payload.type === 'notification') {
        onNotification?.(payload);         // New notification received
      }
    };

    es.onerror = () => {
      // Auto-reconnect with exponential backoff (5s → 60s max)
      reconnectTimer = setTimeout(connect, delay);
    };
  }, [enabled]);
}
```

### 3.5 NotificationBell Component

**`frontend/src/components/common/NotificationBell.jsx`** — UI component:

```javascript
const { fetchNotifications, markRead, markAllRead, deleteNotification, fetchCount } = useNotifications();
// Renders bell icon with unread badge
// Opens dropdown with notification list on click
```

### 3.6 Issuer Portal Layout

**`IssuerPortal.jsx`** (compiled in frontend bundle):

```javascript
function IssuerPortal() {
  useSSENotifications({                // Opens SSE connection for real-time updates
    onNotification: (payload) => {
      setUnreadCount(prev => prev + (payload.delta || 0));
      // Shows toast notification
    },
    onConnect: (payload) => {
      setUnreadCount(0);               // Reset on reconnect
    },
    enabled: isAuthenticated,
  });

  // Renders sidebar with notification badge + main content
}
```

---

## 4. Complete Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Event      │     │  Backend Service │     │  Django REST API    │     │  Frontend        │
│  Trigger    │     │  (Python)        │     │                     │     │  (React/Vite)    │
├─────────────┤     ├──────────────────┤     ├──────────────────────┤     ├─────────────────┤
│             │     │                  │     │                      │     │                 │
│ Sync        │────→│ Notification     │────→│ GET /integration/    │←────│ useSSE           │
│ Complete    │     │ Service.send()   │     │ notifications/stream │     │ Notifications()  │
│             │     │                  │     │   ?token=JWT...      │     │ (EventSource)    │
│ Credential  │────→│ Creates          │     │                      │     │                 │
│ Received    │     │ Notification     │     │ GET /integration/    │←────│ useNotifications │
│             │     │ record in DB     │     │ notifications/       │     │ hook (polls      │
│ Credential  │────→│                  │     │ unread-count/        │     │ every 5s)        │
│ Revoked     │     │ Optionally       │     │                      │     │                 │
│             │     │ queues email     │     │ POST /notifications/ │←────│ NotificationBell │
│             │     │ via Celery       │     │ mark-read/           │     │ (mark as read)   │
│             │     │                  │     │                      │     │                 │
└─────────────┘     └──────────────────┘     └──────────────────────┘     └─────────────────┘
                                                      │
                                                      │ Response: { success: true, data: {...} }
                                                      │
                                                      ▼
                                            ┌──────────────────────┐
                                            │  Axios Interceptor   │
                                            │  auto-unwraps:       │
                                            │  response.data =     │
                                            │    response.data.data│
                                            └──────────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────────┐
                                            │  Zustand Store       │
                                            │  (role-specific)     │
                                            │  e.g. issuerStore.js │
                                            └──────────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────────┐
                                            │  React Component     │
                                            │  re-renders with     │
                                            │  new data            │
                                            └──────────────────────┘
```

---

## 5. Key URLs Summary (Issuer Only)

### Backend Endpoints

| URL Pattern | HTTP Method | Backend View | Purpose |
|-------------|-------------|--------------|---------|
| `/api/v1/notifications/` | GET | `NotificationListView` | List all notifications for user |
| `/api/v1/notifications/unread-count/` | GET | `UnreadCountView` | Get unread count (generic) |
| `/api/v1/notifications/mark-read/` | POST | `MarkReadView` | Mark notifications as read |
| `/api/v1/notifications/mark-all-read/` | POST | `MarkAllReadView` | Mark all as read |
| `/api/v1/notifications/preferences/` | GET/PUT | `NotificationPreferencesView` | Manage notification prefs |
| `/api/v1/notifications/issuer/unread-count/` | GET | `IssuerUnreadCountView` | Issuer unread count |
| `/api/v1/notifications/issuer/stream/` | GET | `IssuerNotificationStreamView` | Issuer notification stream |
| `/api/v1/integration/notifications/unread-count/` | GET | `IssuerUnreadCountView` | Issuer unread count (alias) |
| `/api/v1/integration/notifications/stream/` | GET | `IssuerNotificationStreamView` | Issuer notif. stream (alias) |

### Frontend API Calls (base: `/api/v1`)

| Function | Actual HTTP Call | Used By |
|----------|-----------------|---------|
| `getIssuerUnreadCount()` | GET `/integration/notifications/unread-count/` | Issuer portal polling |
| `getIssuerNotificationStream()` | GET `/integration/notifications/stream/` | SSE connection |
| `markNotificationsRead(data)` | POST `/notifications/mark-read/` | Mark-read button |
| `getUnreadCount(role)` | GET `/notifications/unread-count/` | `useNotifications` hook |

---

## 6. Common Issues & Fixes

### Issue 1: 404 on `/api/auth/login/`
- **Root Cause**: Frontend `.env` had `http://localhost:8000/api` instead of `http://localhost:8000/api/v1`
- **Fix**: Updated `VITE_API_URL` and `VITE_API_BASE_URL` to include `/v1` suffix

### Issue 2: 404 on `/notifications/unread-count/`
- **Root Cause**: Backend had no generic `UnreadCountView` — only issuer-specific
- **Fix**: Created `UnreadCountView` class and added `/notifications/unread-count/` route

### Issue 3: 404 on `/${role}/notifications/unread-count/`
- **Root Cause**: Frontend `notifications.js` used role-templated paths that didn't exist
- **Fix**: Changed all role-specific notification paths to use generic `/notifications/...` endpoints

### Issue 4: `credentials.filter is not a function`
- **Root Cause**: Axios response interceptor was not unwrapping Django's `{ success: true, data: ... }` wrapper, so `response.data` was the wrapper object instead of the array
- **Fix**: Added auto-unwrapping in axios response interceptor

---

## 7. Architecture Decisions

1. **Polling vs SSE**: The system uses both — SSE for real-time updates in the Issuer portal (via `useSSENotifications`), and periodic polling (via `useNotifications` with `setInterval`) for unread counts across all roles.

2. **Response Wrapper Pattern**: All Django views use `success_response()` which wraps data in `{ success: true, data: ... }`. The frontend axios interceptor auto-unwraps this so individual API modules don't need to handle it.

3. **Role-based routing**: The notification system is role-agnostic at the backend (using `request.user`), but the frontend provides role-specific hooks and UI components.

4. **Duplicate URL patterns**: Issuer notification endpoints exist in two URL namespaces:
   - `/notifications/issuer/...` (general notifications app)
   - `/integration/notifications/...` (issuer-specific integration app)
   Both point to the same view classes for backward compatibility.