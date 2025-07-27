"use client"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listProducts, listCoupons } from "@/lib/product/crud"
import { Package, ShoppingCart, Percent, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  // Queries for statistics
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  })

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: listCoupons,
  })

  // Calculate statistics
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.active).length
  const totalPacks = products.filter(p => p.metadata?.type === 'pack').length
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter(c => c.valid).length

  // Calculate total revenue potential (sum of all product prices)
  const totalRevenuePotential = products.reduce((sum, product) => {
    if (product.default_price && typeof product.default_price === 'object' && 'unit_amount' in product.default_price) {
      return sum + (product.default_price.unit_amount || 0)
    }
    return sum
  }, 0) / 100 // Convert from cents to dollars

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      description: `${activeProducts} active`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Product Packs",
      value: totalPacks,
      description: "Bundle deals",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Coupons",
      value: totalCoupons,
      description: `${activeCoupons} active`,
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Revenue Potential",
      value: `$${totalRevenuePotential.toFixed(2)}`,
      description: "Total product value",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  const quickActions = [
    {
      title: "Manage Products",
      description: "Create, edit, and manage your products",
      href: "/admin/product",
      icon: Package,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Manage Bundles",
      description: "Create and manage product bundles",
      href: "/admin/bundle",
      icon: ShoppingCart,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Manage Coupons",
      description: "Create and manage discount coupons",
      href: "/admin/coupon",
      icon: Percent,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "View Orders",
      description: "Monitor and manage customer orders",
      href: "/admin/order",
      icon: TrendingUp,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      {/* <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store performance and quick actions</p>
      </div> */}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productsLoading || couponsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage different aspects of your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className={`p-3 rounded-full text-white ${action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Overview</CardTitle>
            <CardDescription>Summary of your product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Products</span>
                <Badge variant="secondary">{activeProducts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inactive Products</span>
                <Badge variant="outline">{totalProducts - activeProducts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Product Bundles</span>
                <Badge variant="default">{totalPacks}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotions Overview</CardTitle>
            <CardDescription>Summary of your promotional campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Coupons</span>
                <Badge variant="secondary">{activeCoupons}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Expired Coupons</span>
                <Badge variant="outline">{totalCoupons - activeCoupons}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Coupons</span>
                <Badge variant="default">{totalCoupons}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
