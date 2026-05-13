/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Separator } from "@/components/ui/separator";
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
  Mail,
  MapPin,
  Receipt,
  ShoppingCart,
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  name: string;
}

interface Order {
  id: string;
  /** Amount in cents (e.g. 1999 = $19.99) */
  amount: number;
  currency: string;
  status: string;
  fulfillmentStatus?: string;
  customerEmail: string | null;
  customerName: string | null;
  description: string | null;
  created: string;
  paymentMethod: string;
  receiptUrl: string | null;
  lineItems?: any[];
  charges: any[];
  refunds: any[];
  /** API returns the typo'd key; we normalise both into shippingAddress */
  shippingAddress?: Address;
  shippingAdress?: Address; // kept to match API typo
}

interface OrderTableProps {
  className?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Formats an amount to a currency string.
 * e.g. formatCurrency(84, "usd") → "$84.00"
 */
const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

/** Debounce hook — returns a debounced version of `value`. */
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG = {
  succeeded: { variant: "default" as const, label: "Completed" },
  requires_capture: { variant: "secondary" as const, label: "Pending Capture" },
  requires_action: { variant: "destructive" as const, label: "Action Required" },
  canceled: { variant: "outline" as const, label: "Cancelled" },
  processing: { variant: "secondary" as const, label: "Processing" },
} as const;

function PaymentStatusBadge({ status }: { status: string }) {
  const config = PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] ?? {
    variant: "outline" as const,
    label: status,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const FULFILLMENT_STATUS_CONFIG = {
  pending: { variant: "secondary" as const, label: "Pending", Icon: Clock, color: "text-yellow-600" },
  processing: { variant: "secondary" as const, label: "Processing", Icon: Package, color: "text-blue-600" },
  shipped: { variant: "default" as const, label: "Shipped", Icon: Truck, color: "text-purple-600" },
  delivered: { variant: "default" as const, label: "Delivered", Icon: CheckCircle, color: "text-green-600" },
  cancelled: { variant: "destructive" as const, label: "Cancelled", Icon: X, color: "text-red-600" },
  returned: { variant: "outline" as const, label: "Returned", Icon: RefreshCw, color: "text-orange-600" },
} as const;

function FulfillmentStatusBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  const config = FULFILLMENT_STATUS_CONFIG[status as keyof typeof FULFILLMENT_STATUS_CONFIG] ?? {
    variant: "outline" as const,
    label: status,
    Icon: AlertCircle,
    color: "text-gray-600",
  };

  const { Icon } = config;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function OrderTable({ className }: OrderTableProps) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status change dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Tracking email dialog
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");
  const [sendingTrackingEmail, setSendingTrackingEmail] = useState(false);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reset to page 1 whenever filters change
  const prevFiltersRef = useRef({ debouncedSearch, statusFilter });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.debouncedSearch !== debouncedSearch || prev.statusFilter !== statusFilter) {
      setCurrentPage(1);
      prevFiltersRef.current = { debouncedSearch, statusFilter };
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Data fetching ──────────────────────────

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(debouncedSearch && { search: debouncedSearch }),
        });

        const response = await fetch(`/api/orders?${params}`);
        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total ?? data.orders.length);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [currentPage, statusFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Actions ───────────────────────────────

  const handleOrderAction = async (orderId: string, action: string, reason?: string) => {
    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} order`);

      // FIX: was called twice — now called once
      toast.success(`Order ${action} successful`);
      fetchOrders(false);
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
        body: JSON.stringify({ action: "update_status", fulfillmentStatus: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      toast.success("Order status updated successfully");
      setShowStatusDialog(false);
      setStatusChangeOrder(null);
      setNewStatus(""); // FIX: was called twice — now called once
      fetchOrders(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setActionLoading(null);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    // Pre-populate immediately with list data so the modal opens
    // with shipping address already visible (the detail endpoint may
    // not return shippingAddress, but the list endpoint does).
    const listOrder = orders.find((o) => o.id === orderId);
    if (listOrder) setSelectedOrder(listOrder);

    try {
      setDetailLoading(true);
      setShowOrderDetails(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order details");

      const data = await response.json();

      // Merge: prefer detail API fields, but fall back to list data for
      // any field the detail endpoint omits (e.g. shippingAddress).
      setSelectedOrder((prev) => ({
        ...(prev ?? {}),
        ...data.order,
        shippingAddress:
          data.order.shippingAddress ??
          data.order.shippingAdress ??
          listOrder?.shippingAddress ??
          listOrder?.shippingAdress,
      }));
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order details");
      setShowOrderDetails(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendTrackingEmail = async () => {
    if (!trackingOrder || !trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      setSendingTrackingEmail(true);
      const response = await fetch(`/api/orders/${trackingOrder.id}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          ...(trackingUrl.trim() && { trackingUrl: trackingUrl.trim() }),
          ...(carrier.trim() && { carrier: carrier.trim() }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send tracking email");
      }

      toast.success("Tracking email sent successfully!");
      resetTrackingDialog();
      fetchOrders(false);
    } catch (error) {
      console.error("Error sending tracking email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send tracking email");
    } finally {
      setSendingTrackingEmail(false);
    }
  };

  // ── Dialog helpers ────────────────────────

  const openStatusDialog = (order: Order) => {
    setStatusChangeOrder(order);
    setNewStatus(order.fulfillmentStatus ?? "pending");
    setShowStatusDialog(true);
  };

  const openTrackingDialog = (order: Order) => {
    setTrackingOrder(order);
    setTrackingNumber("");
    setTrackingUrl("");
    setCarrier("");
    setShowTrackingDialog(true);
  };

  const resetTrackingDialog = () => {
    setShowTrackingDialog(false);
    setTrackingOrder(null);
    setTrackingNumber("");
    setTrackingUrl("");
    setCarrier("");
  };

  // ── Pagination helpers ────────────────────

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "ellipsis")[] = [1];

    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className={className}>
      {/* ── Filters ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search by order ID, email, or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="succeeded">Completed</SelectItem>
            <SelectItem value="requires_capture">Pending Capture</SelectItem>
            <SelectItem value="requires_action">Action Required</SelectItem>
            <SelectItem value="canceled">Cancelled</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchOrders()}
          title="Refresh orders"
          aria-label="Refresh orders"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* ── Orders Table ─────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Orders</CardTitle>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {totalCount} order{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm leading-tight">
                          {order.customerName ?? order.customerEmail ?? "Unknown"}
                        </span>
                        {order.customerName && order.customerEmail && (
                          <span className="text-xs text-muted-foreground">
                            {order.customerEmail}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground/60 font-mono">
                          #{order.id.slice(-8)}
                        </span>
                      </div>
                    </TableCell>

                    {/* FIX: was `{order.amount}$` — now properly formatted */}
                    <TableCell className="font-semibold tabular-nums">
                      {formatCurrency(order.amount, order.currency)}
                    </TableCell>

                    <TableCell>
                      <PaymentStatusBadge status={order.status} />
                    </TableCell>

                    <TableCell>
                      <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {mounted ? formatDate(order.created) : order.created.split("T")[0]}
                    </TableCell>

                    <TableCell className="capitalize text-sm">
                      {order.paymentMethod}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            {actionLoading === order.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(order)}>
                            <Package className="mr-2 h-4 w-4" />
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTrackingDialog(order)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Tracking Email
                          </DropdownMenuItem>

                          {(order.status === "requires_capture" ||
                            order.status === "succeeded" ||
                            order.status === "requires_action") && (
                              <DropdownMenuSeparator />
                            )}

                          {order.status === "requires_capture" && (
                            <DropdownMenuItem onClick={() => handleOrderAction(order.id, "capture")}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Capture Payment
                            </DropdownMenuItem>
                          )}
                          {order.status === "succeeded" && (
                            <DropdownMenuItem
                              onClick={() => handleOrderAction(order.id, "refund")}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refund
                            </DropdownMenuItem>
                          )}
                          {(order.status === "requires_capture" ||
                            order.status === "requires_action") && (
                              <DropdownMenuItem
                                onClick={() => handleOrderAction(order.id, "cancel")}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
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

          {/* ── Pagination ──────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Page {currentPage} of {totalPages} · {orders.length} shown
              </p>
              <Pagination className="order-1 sm:order-2 w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => !isFirstPage && setCurrentPage((p) => p - 1)}
                      aria-disabled={isFirstPage}
                      className={cn(isFirstPage && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, idx) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    {/* FIX: was !hasMore, now properly checks against totalPages */}
                    <PaginationNext
                      onClick={() => !isLastPage && setCurrentPage((p) => p + 1)}
                      aria-disabled={isLastPage}
                      className={cn(isLastPage && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          Order Details Modal
      ═══════════════════════════════════════ */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Order #${selectedOrder.id.slice(-8)} · ${selectedOrder.id}` : "Loading…"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : selectedOrder ? (
            <div className="space-y-5 pt-2">

              {/* Customer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Name</p>
                    <p className="font-medium">{selectedOrder.customerName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                    <p className="font-medium">{selectedOrder.customerEmail ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Order ID</p>
                    <p className="font-mono text-xs">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Created</p>
                    <p>{mounted ? formatDate(selectedOrder.created) : selectedOrder.created.split("T")[0]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Amount</p>
                    <p className="font-semibold text-base">
                      {/* FIX: uses formatCurrency correctly — amount is in cents */}
                      {formatCurrency(selectedOrder.amount, selectedOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Payment Method</p>
                    <p className="capitalize">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Payment Status</p>
                    <PaymentStatusBadge status={selectedOrder.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Fulfillment</p>
                    <FulfillmentStatusBadge status={selectedOrder.fulfillmentStatus} />
                  </div>
                  {selectedOrder.description && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-0.5">Description</p>
                      <p>{selectedOrder.description}</p>
                    </div>
                  )}
                  {selectedOrder.receiptUrl && (
                    <div className="col-span-2">
                      <a
                        href={selectedOrder.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs underline underline-offset-2 hover:opacity-80"
                      >
                        View Receipt ↗
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address — normalises both `shippingAddress` and the
                  API typo `shippingAdress` so neither is ever silently dropped */}
              {(() => {
                const addr = selectedOrder.shippingAddress ?? selectedOrder.shippingAdress;
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {addr ? (
                        <div className="space-y-1">
                          {addr.name && (
                            <p className="font-medium">{addr.name}</p>
                          )}
                          <p>{addr.line1}</p>
                          {addr.line2 && <p>{addr.line2}</p>}
                          <p>
                            {[addr.city, addr.state].filter(Boolean).join(", ")}
                            {addr.postal_code ? ` ${addr.postal_code}` : ""}
                          </p>
                          {addr.country && (
                            <p className="uppercase tracking-wide text-xs text-muted-foreground font-medium pt-0.5">
                              {addr.country}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No shipping address provided
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Line Items */}
              {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Items Purchased</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrder.lineItems.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg border bg-muted/30"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {item.price?.product?.name ?? item.description ?? "Unknown Item"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                            {item.price?.unit_amount != null && (
                              <> · {formatCurrency(item.price.unit_amount, selectedOrder.currency)} each</>
                            )}
                          </p>
                        </div>
                        <p className="font-semibold text-sm tabular-nums">
                          {/* FIX: was dividing by 100 before passing to formatCurrency
                               which divides by 100 again — now passes raw cents */}
                          {formatCurrency(item.amount_total ?? 0, selectedOrder.currency)}
                        </p>
                      </div>
                    ))}

                    <Separator className="my-2" />
                    <div className="flex justify-between items-center px-3 py-1">
                      <p className="text-sm font-medium">Total</p>
                      <p className="font-bold tabular-nums">
                        {formatCurrency(selectedOrder.amount, selectedOrder.currency)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment History */}
              {(selectedOrder.charges.length > 0 || selectedOrder.refunds.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrder.charges.map((charge: any, index: number) => (
                      <div key={`charge-${index}`} className="flex justify-between items-center p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">Charge</p>
                          <p className="text-xs text-muted-foreground">
                            {mounted ? formatDate(charge.created) : charge.created?.split("T")[0] ?? "—"}
                          </p>
                        </div>
                        <p className="text-green-600 font-semibold tabular-nums text-sm">
                          +{formatCurrency(charge.amount, selectedOrder.currency)}
                        </p>
                      </div>
                    ))}

                    {selectedOrder.refunds.map((refund: any, index: number) => (
                      <div key={`refund-${index}`} className="flex justify-between items-center p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">Refund</p>
                          <p className="text-xs text-muted-foreground">
                            {mounted ? formatDate(refund.created) : refund.created?.split("T")[0] ?? "—"}
                            {refund.reason && ` · ${refund.reason}`}
                          </p>
                        </div>
                        <p className="text-destructive font-semibold tabular-nums text-sm">
                          −{formatCurrency(refund.amount, selectedOrder.currency)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          Status Change Dialog
      ═══════════════════════════════════════ */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Fulfillment Status</DialogTitle>
            <DialogDescription>
              Order #{statusChangeOrder?.id?.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div>
              <p className="text-sm font-medium mb-2">Current Status</p>
              <FulfillmentStatusBadge status={statusChangeOrder?.fulfillmentStatus} />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FULFILLMENT_STATUS_CONFIG).map(([value, config]) => {
                    const { Icon } = config;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                disabled={!newStatus || newStatus === statusChangeOrder?.fulfillmentStatus || actionLoading === statusChangeOrder?.id}
              >
                {actionLoading === statusChangeOrder?.id ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          Tracking Email Dialog
      ═══════════════════════════════════════ */}
      <Dialog open={showTrackingDialog} onOpenChange={(open) => { if (!open) resetTrackingDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Tracking Email</DialogTitle>
            <DialogDescription>
              {trackingOrder?.customerEmail
                ? `Will be sent to ${trackingOrder.customerEmail}`
                : `Order #${trackingOrder?.id?.slice(-8)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div>
              <Label htmlFor="trackingNumber" className="text-sm font-medium">
                Tracking Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trackingNumber"
                placeholder="1Z999AA10123456784"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="carrier" className="text-sm font-medium">
                Carrier <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="carrier"
                placeholder="UPS, FedEx, DHL, USPS…"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="trackingUrl" className="text-sm font-medium">
                Tracking URL <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="trackingUrl"
                placeholder="https://tracking.carrier.com/…"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetTrackingDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSendTrackingEmail}
                disabled={!trackingNumber.trim() || sendingTrackingEmail}
              >
                {sendingTrackingEmail ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
