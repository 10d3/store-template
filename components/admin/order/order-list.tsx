/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
import { Search, Filter, RefreshCw, Eye, Ban, RotateCcw, DollarSign, Mail } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  created: string;
  updated: string;
  metadata?: any;
  paymentMethod?: string;
  receiptUrl?: string;
  shippingAddress?: any;
  charges?: any[];
  refunds?: any[];
}

interface OrderListProps {
  title: string;
  description: string;
}

export function OrderList({ title, description }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    order: Order | null;
  }>({ open: false, action: "", order: null });
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasMore: false
  });


  const fetchOrders = async (page = 1, status = statusFilter, search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(status !== "all" && { status }),
        ...(search && { search })
      });

      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error fetching orders")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders(1, statusFilter, searchTerm);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders(1, status, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOrders(newPage, statusFilter, searchTerm);
  };

  const handleOrderAction = async (action: string, order: Order) => {
    setActionDialog({ open: true, action, order });
  };

  const executeOrderAction = async () => {
    if (!actionDialog.order) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/orders/${actionDialog.order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionDialog.action,
          reason: actionReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process order action");
      }

      const result = await response.json();
      
      toast.success(result.message);

      // Refresh orders list
      fetchOrders(pagination.page, statusFilter, searchTerm);
      
      // Close dialog
      setActionDialog({ open: false, action: "", order: null });
      setActionReason("");

    } catch (error: any) {
      console.error("Error processing order action:", error);
      toast.error("Error processing order action");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
        return "bg-green-100 text-green-800";
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
      case "requires_capture":
        return "bg-blue-100 text-blue-800";
      case "canceled":
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "disputed":
        return "bg-purple-100 text-purple-800";
      case "refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionButtons = (order: Order) => {
    const buttons = [];

    // View details button
    buttons.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => setSelectedOrder(order)}
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    );

    // Action buttons based on status
    switch (order.status) {
      case "requires_capture":
        buttons.push(
          <Button
            key="capture"
            variant="outline"
            size="sm"
            onClick={() => handleOrderAction("capture", order)}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Capture
          </Button>
        );
        buttons.push(
          <Button
            key="cancel"
            variant="outline"
            size="sm"
            onClick={() => handleOrderAction("cancel", order)}
          >
            <Ban className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        );
        break;

      case "succeeded":
      case "completed":
        buttons.push(
          <Button
            key="refund"
            variant="outline"
            size="sm"
            onClick={() => handleOrderAction("refund", order)}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Refund
          </Button>
        );
        break;

      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        buttons.push(
          <Button
            key="cancel"
            variant="outline"
            size="sm"
            onClick={() => handleOrderAction("cancel", order)}
          >
            <Ban className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        );
        break;
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order ID, customer email, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="requires_capture">Requires Capture</SelectItem>
                  <SelectItem value="requires_payment_method">Requires Payment</SelectItem>
                  <SelectItem value="requires_confirmation">Requires Confirmation</SelectItem>
                  <SelectItem value="requires_action">Requires Action</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
              <Button onClick={() => fetchOrders()} variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({pagination.totalCount})</CardTitle>
          <CardDescription>
            Manage your Stripe payment intents and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{order.id}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.customerEmail && (
                          <span className="mr-4">
                            <Mail className="inline h-3 w-3 mr-1" />
                            {order.customerEmail}
                          </span>
                        )}
                        <span>
                          {new Date(order.created).toLocaleDateString()} at{" "}
                          {new Date(order.created).toLocaleTimeString()}
                        </span>
                      </div>
                      {order.description && (
                        <div className="text-sm text-muted-foreground">
                          {order.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {order.currency.toUpperCase()} {order.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.paymentMethod}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getActionButtons(order)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Payment Intent ID: {selectedOrder.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <div className="font-semibold">
                    {selectedOrder.currency.toUpperCase()} {selectedOrder.amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Email</label>
                  <div>{selectedOrder.customerEmail || "N/A"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <div>{selectedOrder.paymentMethod || "N/A"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <div>{new Date(selectedOrder.created).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Updated</label>
                  <div>{new Date(selectedOrder.updated).toLocaleString()}</div>
                </div>
              </div>

              {selectedOrder.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div>{selectedOrder.description}</div>
                </div>
              )}

              {selectedOrder.shippingAddress && (
                <div>
                  <label className="text-sm font-medium">Shipping Address</label>
                  <div className="text-sm">
                    {selectedOrder.shippingAddress.line1}<br />
                    {selectedOrder.shippingAddress.line2 && (
                      <>{selectedOrder.shippingAddress.line2}<br /></>
                    )}
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postal_code}<br />
                    {selectedOrder.shippingAddress.country}
                  </div>
                </div>
              )}

              {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Refunds</label>
                  <div className="space-y-2">
                    {selectedOrder.refunds.map((refund: any, index: number) => (
                      <div key={index} className="text-sm border rounded p-2">
                        <div>Amount: {refund.currency.toUpperCase()} {(refund.amount / 100).toFixed(2)}</div>
                        <div>Reason: {refund.reason}</div>
                        <div>Status: {refund.status}</div>
                        <div>Created: {new Date(refund.created * 1000).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.receiptUrl && (
                <div>
                  <label className="text-sm font-medium">Receipt</label>
                  <div>
                    <a
                      href={selectedOrder.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, action: "", order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {actionDialog.action.charAt(0).toUpperCase() + actionDialog.action.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action} this order?
              {actionDialog.action === "refund" && " This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Enter reason for ${actionDialog.action}...`}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: "", order: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOrderAction}
              disabled={processing}
              variant={actionDialog.action === "refund" || actionDialog.action === "cancel" ? "destructive" : "default"}
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog.action.charAt(0).toUpperCase() + actionDialog.action.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}