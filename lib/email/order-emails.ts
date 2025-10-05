/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderTotal: number;
  orderStatus: string;
  orderItems?: any[];
  refundAmount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export async function sendOrderStatusEmail(data: OrderEmailData) {
  try {
    const { customerEmail, orderId, orderStatus } = data;

    let subject = "";
    let htmlContent = "";

    switch (orderStatus) {
      case "completed":
        subject = `Order Confirmation - Order #${orderId}`;
        htmlContent = generateOrderConfirmationEmail(data);
        break;

      case "cancelled":
        subject = `Order Cancelled - Order #${orderId}`;
        htmlContent = generateOrderCancellationEmail(data);
        break;

      case "refunded":
        subject = `Refund Processed - Order #${orderId}`;
        htmlContent = generateRefundEmail(data);
        break;

      case "failed":
        subject = `Payment Failed - Order #${orderId}`;
        htmlContent = generatePaymentFailedEmail(data);
        break;

      case "disputed":
        subject = `Payment Dispute - Order #${orderId}`;
        htmlContent = generateDisputeEmail(data);
        break;

      case "shipped":
        subject = `Your Order Has Shipped - Order #${orderId}`;
        htmlContent = generateTrackingEmail(data);
        break;

      default:
        subject = `Order Update - Order #${orderId}`;
        htmlContent = generateGenericOrderUpdateEmail(data);
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Store Ricardo <orders@storerecardo.com>",
      to: [customerEmail],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", emailData?.id);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error("Error in sendOrderStatusEmail:", error);
    throw error;
  }
}

export async function sendTrackingEmail(data: {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderTotal: number;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
  orderItems?: any[];
}) {
  try {
    const emailData: OrderEmailData = {
      ...data,
      orderStatus: "shipped",
    };

    const { data: result, error } = await resend.emails.send({
      from: "Store Ricardo <orders@storerecardo.com>",
      to: [data.customerEmail],
      subject: `Your Order Has Shipped - Order #${data.orderId}`,
      html: generateTrackingEmail(emailData),
    });

    if (error) {
      console.error("Error sending tracking email:", error);
      throw new Error(`Failed to send tracking email: ${error.message}`);
    }

    console.log("Tracking email sent successfully:", result?.id);
    return { success: true, emailId: result?.id };
  } catch (error) {
    console.error("Error in sendTrackingEmail:", error);
    throw error;
  }
}

function generateOrderConfirmationEmail(data: OrderEmailData): string {
  const { customerName, orderId, orderTotal, orderItems } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
        .total { font-weight: bold; font-size: 18px; color: #4f46e5; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>We're excited to confirm that your order has been successfully placed and payment has been processed.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Total:</strong> <span class="total">$${orderTotal.toFixed(
            2
          )}</span></p>
          
          ${
            orderItems && orderItems.length > 0
              ? `
            <h4>Items Ordered:</h4>
            ${orderItems
              .map(
                (item) => `
              <div class="item">
                <strong>${item.name || "Product"}</strong><br>
                Quantity: ${item.quantity || 1} × $${(item.price || 0).toFixed(
                  2
                )}
              </div>
            `
              )
              .join("")}
          `
              : ""
          }
        </div>
        
        <p>You will receive another email with tracking information once your order ships.</p>
        
        <p>If you have any questions about your order, please don't hesitate to contact our customer support team.</p>
        
        <p>Thank you for choosing Store Ricardo!</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generateOrderCancellationEmail(data: OrderEmailData): string {
  const { customerName, orderId, orderTotal } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Cancelled</h1>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>We're writing to inform you that your order has been cancelled.</p>
        
        <div class="order-details">
          <h3>Cancelled Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
        </div>
        
        <p>If you were charged for this order, the refund will be processed within 5-7 business days and will appear on your original payment method.</p>
        
        <p>If you have any questions about this cancellation, please contact our customer support team.</p>
        
        <p>We apologize for any inconvenience.</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generateRefundEmail(data: OrderEmailData): string {
  const { customerName, orderId, refundAmount, orderTotal } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Refund Processed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .refund-amount { font-weight: bold; font-size: 18px; color: #10b981; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Refund Processed</h1>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>Your refund has been successfully processed.</p>
        
        <div class="order-details">
          <h3>Refund Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Original Order Total:</strong> $${orderTotal.toFixed(
            2
          )}</p>
          <p><strong>Refund Amount:</strong> <span class="refund-amount">$${(
            refundAmount || orderTotal
          ).toFixed(2)}</span></p>
        </div>
        
        <p>The refund will appear on your original payment method within 5-7 business days.</p>
        
        <p>If you have any questions about this refund, please contact our customer support team.</p>
        
        <p>Thank you for your understanding.</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentFailedEmail(data: OrderEmailData): string {
  const { customerName, orderId, orderTotal } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Failed</h1>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>We were unable to process your payment for the following order:</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
        </div>
        
        <p>Please check your payment method and try again, or contact your bank if you believe this is an error.</p>
        
        <p>If you continue to experience issues, please contact our customer support team for assistance.</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generateDisputeEmail(data: OrderEmailData): string {
  const { customerName, orderId, orderTotal } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Dispute</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Dispute Received</h1>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>We've received a payment dispute for your order. We're working to resolve this matter promptly.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
        </div>
        
        <p>Our customer support team will be in touch with you shortly to help resolve this dispute.</p>
        
        <p>If you have any immediate questions, please contact our customer support team.</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generateTrackingEmail(data: OrderEmailData): string {
  const {
    customerName,
    orderId,
    orderTotal,
    trackingNumber,
    trackingUrl,
    carrier,
    orderItems,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .tracking-info { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .tracking-number { font-weight: bold; font-size: 20px; color: #10b981; margin: 10px 0; }
        .track-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Your Order Has Shipped!</h1>
        <p>Your package is on its way</p>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div class="tracking-info">
          <h3>📍 Tracking Information</h3>
          <div class="tracking-number">${trackingNumber || "N/A"}</div>
          <p><strong>Carrier:</strong> ${carrier || "Standard Shipping"}</p>
          ${
            trackingUrl
              ? `
            <a href="${trackingUrl}" class="track-button" target="_blank">
              Track Your Package
            </a>
          `
              : ""
          }
          <p><small>You can use this tracking number to monitor your package's progress</small></p>
        </div>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
          
          ${
            orderItems && orderItems.length > 0
              ? `
            <h4>Items Shipped:</h4>
            ${orderItems
              .map(
                (item) => `
              <div class="item">
                <strong>${item.name || "Product"}</strong><br>
                Quantity: ${item.quantity || 1}
              </div>
            `
              )
              .join("")}
          `
              : ""
          }
        </div>
        
        <p><strong>Estimated Delivery:</strong> Please check the tracking link above for the most up-to-date delivery estimate.</p>
        
        <p>If you have any questions about your shipment, please don't hesitate to contact our customer support team.</p>
        
        <p>Thank you for choosing Store Ricardo!</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

function generateGenericOrderUpdateEmail(data: OrderEmailData): string {
  const { customerName, orderId, orderStatus, orderTotal } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Update</h1>
      </div>
      
      <div class="content">
        <p>Hi ${customerName || "Valued Customer"},</p>
        
        <p>We wanted to update you on the status of your order.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Current Status:</strong> ${
            orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)
          }</p>
          <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
        </div>
        
        <p>If you have any questions about your order, please contact our customer support team.</p>
        
        <p>Thank you for choosing Store Ricardo!</p>
      </div>
      
      <div class="footer">
        <p>Store Ricardo | orders@storerecardo.com</p>
      </div>
    </body>
    </html>
  `;
}

interface PayoutEmailData {
  affiliateName: string;
  amount: number;
  bankAccount: string;
  payoutDate: Date;
  referralCount?: number;
  period?: string;
}

export function generatePayoutConfirmationEmail(data: PayoutEmailData): string {
  const {
    affiliateName,
    amount,
    bankAccount,
    payoutDate,
    referralCount,
    period,
  } = data;

  // Mask bank account (show only last 4 digits)
  const maskedAccount =
    bankAccount.length > 4 ? `****${bankAccount.slice(-4)}` : bankAccount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payout Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .payout-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .amount { font-weight: bold; font-size: 32px; color: #10b981; margin: 20px 0; text-align: center; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { color: #6b7280; }
        .info-value { font-weight: 600; }
        .stats { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💸 Payout Processed!</h1>
        <p>Your affiliate earnings are on the way</p>
      </div>
     
      <div class="content">
        <p>Hi ${affiliateName || "Valued Affiliate"},</p>
       
        <div class="success-icon">✅</div>
       
        <p>Great news! Your affiliate payout has been successfully processed and the funds are being transferred to your account.</p>
       
        <div class="payout-details">
          <h3>Payout Details</h3>
          
          <div class="amount">$${amount.toFixed(2)}</div>
          
          <div class="info-row">
            <span class="info-label">Bank Account:</span>
            <span class="info-value">${maskedAccount}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Payout Date:</span>
            <span class="info-value">${payoutDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          
          ${
            period
              ? `
          <div class="info-row">
            <span class="info-label">Period:</span>
            <span class="info-value">${period}</span>
          </div>
          `
              : ""
          }
        </div>
        
        ${
          referralCount
            ? `
        <div class="stats">
          <h4 style="margin-top: 0;">📊 Your Performance</h4>
          <p style="margin: 5px 0;">
            <strong>${referralCount}</strong> successful referral${referralCount !== 1 ? "s" : ""} this period
          </p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
            Keep up the great work! 🚀
          </p>
        </div>
        `
            : ""
        }
       
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>The funds should appear in your bank account within 3-5 business days</li>
          <li>You'll receive a notification once the transfer is complete</li>
          <li>You can view your full payout history in your affiliate dashboard</li>
        </ul>
       
        <p>Thank you for being a valued member of our affiliate program! Your efforts help us grow and we truly appreciate your partnership.</p>
       
        <p>If you have any questions about this payout, please don't hesitate to contact our support team.</p>
       
        <p style="margin-top: 30px;">Keep sharing, keep earning! 💰</p>
      </div>
     
      <div class="footer">
        <p><strong>Store Ricardo Affiliate Program</strong></p>
        <p>affiliates@storerecardo.com | <a href="https://storerecardo.com/affiliate">Affiliate Dashboard</a></p>
        <p style="font-size: 12px; margin-top: 15px;">
          This is an automated payout confirmation. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}
