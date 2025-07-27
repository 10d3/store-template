# Stripe Integration & Order Management

This document outlines the comprehensive Stripe Payment Intents integration and order management system implemented in the e-commerce template.

## 🚀 Features Implemented

### 1. Real-time Order Data from Stripe
- **Payment Intents API Integration**: Fetches real order data from Stripe Payment Intents
- **Live Order Status**: Real-time order status updates from Stripe
- **Customer Information**: Retrieves customer email, shipping details, and payment information
- **Order Search & Filtering**: Search by order ID, customer email, or description with status filtering

### 2. Order Management Operations
- **Capture Payments**: Capture authorized payments for manual review orders
- **Process Refunds**: Full or partial refunds with automatic Stripe processing
- **Cancel Orders**: Cancel pending or authorized payments
- **Status Updates**: Update internal order status with email notifications

### 3. Webhook Integration
- **Real-time Updates**: Stripe webhooks for automatic order status synchronization
- **Event Handling**: Processes payment success, failures, cancellations, and disputes
- **Database Sync**: Updates local order records based on Stripe events

### 4. Email Notifications
- **Order Confirmations**: Automated email confirmations using Resend
- **Status Updates**: Email notifications for order status changes
- **Refund Notifications**: Automatic refund confirmation emails
- **Payment Failures**: Alert customers about payment issues

## 📁 File Structure

```
app/
├── api/
│   ├── orders/
│   │   ├── route.ts              # Orders API - fetch and list orders
│   │   └── [id]/
│   │       └── route.ts          # Individual order operations
│   └── webhooks/
│       └── stripe/
│           └── route.ts          # Stripe webhook handler
├── admin/
│   └── order/
│       └── page.tsx              # Order management page
components/
└── admin/
    └── order/
        └── order-list.tsx        # Order management component
lib/
├── email/
│   └── order-emails.ts           # Email notification system
├── stripe.ts                     # Stripe client configuration
└── prisma.ts                     # Database client
```

## 🔧 Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Database
DATABASE_URL="your_database_connection_string"
```

### 2. Stripe Webhook Setup

1. **Create Webhook Endpoint** in your Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.dispute.created`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. **Copy Webhook Secret** to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 3. Resend Email Setup

1. **Create Resend Account** at [resend.com](https://resend.com)
2. **Generate API Key** in your Resend dashboard
3. **Add API Key** to your `.env` file as `RESEND_API_KEY`
4. **Verify Domain** (optional but recommended for production)

## 📊 API Endpoints

### Orders API (`/api/orders`)

#### GET - List Orders
```typescript
GET /api/orders?page=1&limit=10&status=succeeded&search=customer@email.com

Response:
{
  "orders": [
    {
      "id": "pi_1234567890",
      "amount": 99.99,
      "currency": "USD",
      "status": "succeeded",
      "customerEmail": "customer@example.com",
      "customerName": "John Doe",
      "created": "2024-01-15T10:30:00Z",
      "shippingAddress": { ... },
      "charges": [ ... ],
      "refunds": [ ... ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by payment status (`succeeded`, `requires_capture`, `canceled`, etc.)
- `search`: Search by order ID, customer email, or description

### Individual Order API (`/api/orders/[id]`)

#### GET - Get Order Details
```typescript
GET /api/orders/pi_1234567890

Response:
{
  "id": "pi_1234567890",
  "amount": 99.99,
  "currency": "USD",
  "status": "succeeded",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "description": "Order #1001",
  "created": "2024-01-15T10:30:00Z",
  "customer": { ... },
  "shippingAddress": { ... },
  "charges": [ ... ],
  "refunds": [ ... ]
}
```

#### PATCH - Update Order
```typescript
PATCH /api/orders/pi_1234567890
Content-Type: application/json

{
  "action": "refund",
  "amount": 50.00,  // Optional: partial refund amount
  "reason": "requested_by_customer"  // Optional: refund reason
}

// Available actions:
// - "capture": Capture an authorized payment
// - "refund": Process a refund (full or partial)
// - "cancel": Cancel a pending payment
```

## 🎨 UI Components

### OrderList Component

The main order management interface includes:

- **Real-time Order Loading**: Fetches orders from Stripe API
- **Search & Filter**: Search by customer email, order ID, or description
- **Status Filtering**: Filter orders by payment status
- **Pagination**: Navigate through large order lists
- **Order Actions**: Capture, refund, cancel operations with confirmation dialogs
- **Order Details**: View comprehensive order information in modal

#### Usage:
```tsx
import { OrderList } from "@/components/admin/order/order-list";

export default function OrderManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <OrderList 
        title="Order Management"
        description="View and manage customer orders from Stripe Payment Intents"
      />
    </div>
  );
}
```

## 📧 Email System

### Supported Email Types

1. **Order Confirmation** - Sent when payment succeeds
2. **Order Cancellation** - Sent when order is cancelled
3. **Refund Confirmation** - Sent when refund is processed
4. **Payment Failed** - Sent when payment fails
5. **Dispute Alert** - Sent when chargeback/dispute occurs
6. **Generic Updates** - For other status changes

### Email Configuration

The email system uses Resend and includes:
- **HTML Templates**: Professional email templates for each type
- **Order Details**: Includes order information, amounts, and customer details
- **Error Handling**: Graceful error handling with logging
- **Async Processing**: Non-blocking email sending

### Usage:
```typescript
import { sendOrderStatusEmail } from "@/lib/email/order-emails";

await sendOrderStatusEmail({
  customerEmail: "customer@example.com",
  orderId: "pi_1234567890",
  status: "succeeded",
  amount: 99.99,
  currency: "USD"
});
```

## 🔄 Webhook Processing

### Event Handling

The webhook system processes the following Stripe events:

1. **payment_intent.succeeded**: Order confirmation and database update
2. **payment_intent.payment_failed**: Payment failure notification
3. **payment_intent.canceled**: Order cancellation processing
4. **charge.dispute.created**: Dispute/chargeback handling
5. **invoice.payment_succeeded**: Subscription payment processing
6. **customer.subscription.***: Subscription lifecycle management

### Security

- **Webhook Signature Verification**: Validates requests using Stripe webhook secret
- **Idempotency**: Prevents duplicate processing of events
- **Error Handling**: Comprehensive error logging and recovery

## 🛡️ Security Considerations

1. **Environment Variables**: All sensitive keys stored in environment variables
2. **Webhook Verification**: Stripe signature verification for webhook security
3. **Input Validation**: Proper validation of all API inputs
4. **Error Handling**: Secure error messages without exposing sensitive data
5. **Rate Limiting**: Consider implementing rate limiting for production

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Update Stripe keys to live mode
- [ ] Configure production webhook endpoint
- [ ] Set up proper domain for Resend emails
- [ ] Configure database for production
- [ ] Set up monitoring and logging
- [ ] Test webhook delivery in production environment
- [ ] Verify email delivery and templates

### Monitoring

Consider implementing:
- **Order Processing Metrics**: Track successful vs failed orders
- **Email Delivery Monitoring**: Monitor email send rates and failures
- **Webhook Reliability**: Track webhook processing success rates
- **Error Alerting**: Set up alerts for critical failures

## 🔧 Troubleshooting

### Common Issues

1. **Stripe API Errors**: Check API keys and webhook configuration
2. **Email Delivery Issues**: Verify Resend API key and domain setup
3. **Webhook Failures**: Check webhook secret and endpoint accessibility
4. **Database Connection**: Verify DATABASE_URL and Prisma configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed console logs for troubleshooting.

## 📈 Future Enhancements

Potential improvements to consider:

1. **Advanced Filtering**: Date ranges, amount ranges, payment methods
2. **Bulk Operations**: Bulk refunds, status updates, exports
3. **Analytics Dashboard**: Order metrics, revenue tracking, trends
4. **Customer Management**: Customer profiles, order history, preferences
5. **Inventory Integration**: Stock management, low stock alerts
6. **Advanced Email Templates**: Rich HTML templates with branding
7. **Multi-currency Support**: Enhanced currency handling and conversion
8. **Subscription Management**: Advanced subscription lifecycle management

---

## 📞 Support

For issues or questions regarding the Stripe integration:

1. Check the Stripe Dashboard for payment details
2. Review webhook logs for processing issues
3. Check application logs for detailed error information
4. Verify environment variable configuration

This integration provides a robust foundation for e-commerce order management with real-time Stripe data, comprehensive order operations, and automated customer communications.