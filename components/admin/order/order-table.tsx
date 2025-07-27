/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  DollarSign,
  X,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  fulfillmentStatus?: string; // New field for order fulfillment tracking
  customerEmail: string | null;
  customerName: string | null;
  description: string | null;
  created: string;
  paymentMethod: string;
  receiptUrl: string | null;
  lineItems?: any[];
  charges: any[];
  refunds: any[];
}

interface OrderTableProps {
  className?: string;
}

export function OrderTable({ className }: OrderTableProps) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(
    null
  );
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  const handleOrderAction = async (
    orderId: string,
    action: string,
    reason?: string
  ) => {
    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} order`);

      toast.success(`Order ${action} successful`);
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error(`Error ${action} order:`, error);
      toast.error(`Failed to ${action} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async () => {
    if (!statusChangeOrder || !newStatus) return;

    try {
      setActionLoading(statusChangeOrder.id);
      const response = await fetch(`/api/orders/${statusChangeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          fulfillmentStatus: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      toast.success("Order status updated successfully");
      setShowStatusDialog(false);
      setStatusChangeOrder(null);
      setNewStatus("");
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setActionLoading(null);
    }
  };

  const openStatusDialog = (order: Order) => {
    setStatusChangeOrder(order);
    setNewStatus(order.fulfillmentStatus || "pending");
    setShowStatusDialog(true);
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order details");

      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderDetails(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order details");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      succeeded: { variant: "default" as const, label: "Completed" },
      requires_capture: { variant: "secondary" as const, label: "Pending" },
      requires_action: {
        variant: "destructive" as const,
        label: "Action Required",
      },
      canceled: { variant: "outline" as const, label: "Cancelled" },
      processing: { variant: "secondary" as const, label: "Processing" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFulfillmentStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        label: "Pending",
        icon: Clock,
        color: "text-yellow-600",
      },
      processing: {
        variant: "secondary" as const,
        label: "Processing",
        icon: Package,
        color: "text-blue-600",
      },
      shipped: {
        variant: "default" as const,
        label: "Shipped",
        icon: Truck,
        color: "text-purple-600",
      },
      delivered: {
        variant: "default" as const,
        label: "Delivered",
        icon: CheckCircle,
        color: "text-green-600",
      },
      cancelled: {
        variant: "destructive" as const,
        label: "Cancelled",
        icon: X,
        color: "text-red-600",
      },
      returned: {
        variant: "outline" as const,
        label: "Returned",
        icon: RefreshCw,
        color: "text-orange-600",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
      icon: AlertCircle,
      color: "text-gray-600",
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents to dollars
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use a consistent format that works the same on server and client
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className={className}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order ID, email, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="succeeded">Completed</SelectItem>
            <SelectItem value="requires_capture">Pending</SelectItem>
            <SelectItem value="requires_action">Action Required</SelectItem>
            <SelectItem value="canceled">Cancelled</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Fulfillment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.customerName ||
                            order.customerEmail ||
                            "Unknown Customer"}
                        </span>
                        {order.customerName && order.customerEmail && (
                          <span className="text-sm text-gray-500">
                            {order.customerEmail}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">
                          {order.id.slice(-8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.amount, order.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {getFulfillmentStatusBadge(order.fulfillmentStatus) || (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mounted ? formatDate(order.created) : order.created.split('T')[0]}
                    </TableCell>
                    <TableCell className="capitalize">
                      {order.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openStatusDialog(order)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Change Status
                          </DropdownMenuItem>
                          {order.status === "requires_capture" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleOrderAction(order.id, "capture")
                              }
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Capture Payment
                            </DropdownMenuItem>
                          )}
                          {order.status === "succeeded" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleOrderAction(order.id, "refund")
                              }
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refund
                            </DropdownMenuItem>
                          )}
                          {(order.status === "requires_capture" ||
                            order.status === "requires_action") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleOrderAction(order.id, "cancel")
                              }
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing page {currentPage} of {totalPages} ({orders.length}{" "}
                orders)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className={cn(
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className={cn(
                        !hasMore && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for order {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedOrder.customerName || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedOrder.customerEmail || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Order ID:</span>{" "}
                      {selectedOrder.id}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>{" "}
                      {formatCurrency(
                        selectedOrder.amount,
                        selectedOrder.currency
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Payment Method:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {mounted ? formatDate(selectedOrder.created) : selectedOrder.created.split('T')[0]}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span>{" "}
                      {selectedOrder.description || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              {selectedOrder.lineItems &&
                selectedOrder.lineItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Items Purchased</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedOrder.lineItems.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 border rounded"
                            >
                              <div>
                                <div className="font-medium">
                                  {item.price?.product?.name ||
                                    item.description ||
                                    "Unknown Item"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(
                                    (item.amount_total || 0) / 100,
                                    selectedOrder.currency
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Charges and Refunds */}
              {(selectedOrder.charges.length > 0 ||
                selectedOrder.refunds.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder.charges.map((charge: any, index: number) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Charge</div>
                            <div className="text-sm text-gray-500">
                              {mounted ? formatDate(charge.created) : charge.created.split('T')[0]}
                            </div>
                          </div>
                          <div className="text-green-600 font-medium">
                            +
                            {formatCurrency(
                              charge.amount,
                              selectedOrder.currency
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedOrder.refunds.map((refund: any, index: number) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Refund</div>
                            <div className="text-sm text-gray-500">
                              {mounted ? formatDate(refund.created) : refund.created.split('T')[0]} • {refund.reason}
                            </div>
                          </div>
                          <div className="text-red-600 font-medium">
                            -
                            {formatCurrency(
                              refund.amount,
                              selectedOrder.currency
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
            <DialogDescription>
              Update the fulfillment status for order{" "}
              {statusChangeOrder?.id?.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Current Status
              </label>
              <div className="flex items-center gap-2">
                {(statusChangeOrder &&
                  getFulfillmentStatusBadge(
                    statusChangeOrder.fulfillmentStatus
                  )) || (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                New Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="processing">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Processing
                    </div>
                  </SelectItem>
                  <SelectItem value="shipped">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-600" />
                      Shipped
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Delivered
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      Cancelled
                    </div>
                  </SelectItem>
                  <SelectItem value="returned">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-orange-600" />
                      Returned
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setStatusChangeOrder(null);
                  setNewStatus("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={!newStatus || actionLoading === statusChangeOrder?.id}
              >
                {actionLoading === statusChangeOrder?.id ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
