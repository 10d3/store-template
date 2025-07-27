/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderTotal: number;
  orderStatus: string;
  orderItems?: any[];
  refundAmount?: number;
}

export async function sendOrderStatusEmail(data: OrderEmailData) {
  try {
    const {
      customerEmail,
      customerName,
      orderId,
      orderStatus,
      orderTotal,
      orderItems,
      refundAmount,
    } = data;

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
