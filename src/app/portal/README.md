# End User Portal

The End User Portal allows external applications to provide their users with a self-service interface for managing webhook endpoints and viewing available event types.

## Features

- **JWT-based Authentication**: Secure token-based access with configurable expiration
- **Endpoint Management**: Create, view, and delete webhook endpoints
- **Event Type Discovery**: View available event types and their schemas
- **Restricted Access**: Limit users to specific endpoint groups and event types
- **Custom Branding**: Support for application name and return URL

## API Endpoints

### Generate Portal Token

**POST** `/api/portal/token`

Generate a JWT token for portal access.

**Request Body:**
```json
{
  "endpointGroupId": "grp_a1b2_efgh5678",  // Required
  "allowedEventTypes": ["user.created", "user.updated"],  // Optional
  "applicationName": "My Application",  // Optional
  "returnUrl": "https://myapp.com/settings"  // Optional
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "portalUrl": "http://localhost:3000/portal?token=...",
  "expiresIn": 3600,
  "endpointGroup": {
    "id": "grp_a1b2_efgh5678",
    "name": "My Endpoint Group",
    "environmentId": "env_123"
  }
}
```

### Portal Endpoints

**GET** `/api/portal/endpoints?token=...`
- List endpoints in the user's endpoint group

**POST** `/api/portal/endpoints?token=...`
- Create a new endpoint in the user's endpoint group

**DELETE** `/api/portal/endpoints/{id}?token=...`
- Delete an endpoint from the user's endpoint group

### Portal Event Types

**GET** `/api/portal/event-types?token=...`
- List available event types (filtered by allowedEventTypes if specified)

## Usage Examples

### 1. Basic Integration

```javascript
// Generate portal token
const response = await fetch('/api/portal/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpointGroupId: 'grp_a1b2_efgh5678'
  })
});

const { portalUrl } = await response.json();

// Redirect user to portal
window.location.href = portalUrl;
```

### 2. Restricted Access

```javascript
// Generate token with restrictions
const response = await fetch('/api/portal/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpointGroupId: 'grp_a1b2_efgh5678',
    allowedEventTypes: ['user.created', 'user.updated'],
    applicationName: 'My SaaS App',
    returnUrl: 'https://myapp.com/settings/webhooks'
  })
});
```

### 3. Custom Portal Integration

```javascript
// Get token and embed portal in iframe
const { token } = await generatePortalToken();
const portalUrl = `https://webhooks.example.com/portal?token=${token}`;

// Embed in iframe
const iframe = document.createElement('iframe');
iframe.src = portalUrl;
iframe.style.width = '100%';
iframe.style.height = '600px';
iframe.style.border = 'none';
document.getElementById('portal-container').appendChild(iframe);
```

## Security

- **JWT Tokens**: Signed with AUTH_SECRET, expire after 1 hour
- **Environment Isolation**: Users can only access their assigned endpoint group
- **Event Type Filtering**: Optional restriction to specific event types
- **Token Validation**: All portal API endpoints validate JWT tokens

## Portal UI Features

### Endpoints Tab
- View all endpoints in the assigned endpoint group
- Create new endpoints with name, URL, and description
- Delete endpoints with confirmation
- Copy endpoint URLs to clipboard
- Visual status indicators (Active/Inactive)

### Event Types Tab
- Browse available event types
- View event schemas and descriptions
- Filtered by allowedEventTypes if specified
- Schema preview for understanding data structure

### Navigation
- Custom "Back to {Application}" button
- Return URL support or browser history fallback
- Clean, focused UI without admin features

## Configuration

### Environment Variables
- `AUTH_SECRET`: JWT signing secret (required)
- `NEXT_PUBLIC_BASE_URL`: Base URL for portal links (optional)

### Token Payload
```typescript
interface PortalTokenPayload {
  endpointGroupId: string;        // Required: Endpoint group to manage
  environmentId: string;          // Auto-populated from endpoint group
  allowedEventTypes?: string[];   // Optional: Restrict event types
  applicationName?: string;       // Optional: For back button
  returnUrl?: string;            // Optional: Return destination
  iat?: number;                  // Auto: Issued at timestamp
  exp?: number;                  // Auto: Expiration timestamp
}
```

## Error Handling

The portal handles various error scenarios:

- **Invalid Token**: Shows authentication error
- **Expired Token**: Prompts user to refresh or contact support
- **Missing Endpoint Group**: Returns 404 error
- **Network Errors**: Retry buttons and user-friendly messages

## Best Practices

1. **Token Management**: Generate tokens on-demand, don't store them
2. **User Experience**: Provide clear return paths and application branding
3. **Security**: Use HTTPS for all portal URLs
4. **Monitoring**: Log portal access and endpoint creation for audit trails
5. **Documentation**: Provide users with webhook integration guides
