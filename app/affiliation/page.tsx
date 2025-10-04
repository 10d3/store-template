import React, { Suspense } from "react";
import CardStats from "./_components/card-stats";
import CardProduct from "./_components/card-product";
import CardStatsSkeleton from "./_components/card-stats-skeleton";
import CardProductSkeleton from "./_components/card-product-skeleton";
import { getAffiliationData } from "@/lib/affiliation/affiliate-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function Page() {
  const data = await getAffiliationData();
  const { affiliate } = data;

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate recent vs previous period metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Recent clicks (last 30 days)
  const recentClicks = data.recentClicks.filter(
    (click) => new Date(click.createdAt) >= thirtyDaysAgo
  ).length;

  // Previous period clicks (30-60 days ago)
  const previousClicks = data.recentClicks.filter(
    (click) =>
      new Date(click.createdAt) >= sixtyDaysAgo &&
      new Date(click.createdAt) < thirtyDaysAgo
  ).length;

  // Recent conversion rate
  const recentConversions = data.referrals.filter(
    (ref) => ref.convertedAt && new Date(ref.convertedAt) >= thirtyDaysAgo
  ).length;
  const recentConversionRate = (recentConversions / recentClicks) * 100;

  // Previous period conversion rate
  const previousConversions = data.referrals.filter(
    (ref) =>
      ref.convertedAt &&
      new Date(ref.convertedAt) >= sixtyDaysAgo &&
      new Date(ref.convertedAt) < thirtyDaysAgo
  ).length;
  const previousConversionRate = (previousConversions / previousClicks) * 100;

  const statsData = [
    {
      title: "Total Sales",
      value: affiliate.totalEarnings,
      chartData: data.referrals
        .slice(0, 6)
        .map((ref) => ({
          month: ref.convertedAt
            ? new Date(ref.convertedAt).toLocaleString("default", {
                month: "short",
              })
            : "",
          desktop: ref.commissions.reduce(
            (sum, commission) => sum + (commission.amount || 0),
            0
          ),
        }))
        .reverse(),
      percentageChange: calculatePercentageChange(
        affiliate.recentEarnings,
        affiliate.totalEarnings - affiliate.recentEarnings
      ),
    },
    {
      title: "Total Clicks",
      value: affiliate.totalClicks,
      chartData: data.recentClicks
        .slice(0, 6)
        .map((click) => ({
          month: new Date(click.createdAt).toLocaleString("default", {
            month: "short",
          }),
          desktop: 1,
        }))
        .reverse(),
      percentageChange: calculatePercentageChange(recentClicks, previousClicks),
    },
    {
      title: "Conversion Rate",
      value: parseFloat(affiliate.conversionRate),
      chartData: data.referrals
        .slice(0, 6)
        .map((ref) => ({
          month: ref.convertedAt
            ? new Date(ref.convertedAt).toLocaleString("default", {
                month: "short",
              })
            : "",
          desktop:
            (ref.commissions.reduce(
              (sum, commission) => sum + (commission.amount || 0),
              0
            ) /
              affiliate.totalEarnings) *
            100,
        }))
        .reverse(),
      percentageChange: calculatePercentageChange(
        recentConversionRate,
        previousConversionRate
      ),
    },
    {
      title: "Commissions Earned",
      value: affiliate.availableBalance,
      chartData: data.commissions
        .slice(0, 6)
        .map((commission) => ({
          month: new Date(commission.createdAt).toLocaleString("default", {
            month: "short",
          }),
          desktop: commission.amount || 0,
        }))
        .reverse(),
      percentageChange: calculatePercentageChange(
        affiliate.recentEarnings,
        affiliate.availableBalance - affiliate.recentEarnings
      ),
    },
    {
      title: "Products Sold",
      value: affiliate.totalSoldProducts,
      chartData: data.referrals
        .slice(0, 6)
        .map((ref) => ({
          month: ref.convertedAt
            ? new Date(ref.convertedAt).toLocaleString("default", {
                month: "short",
              })
            : "",
          desktop: ref.quantity || 0,
        }))
        .reverse(),
      percentageChange: 0,
    },
  ];

  return (
    <div className="py-8 flex flex-col gap-8 bg-secondary/80 px-4 h-full">
      <Suspense fallback={
        <div className="grid md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <CardStatsSkeleton key={i} />
          ))}
        </div>
      }>
        {!data || !affiliate ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Could not load affiliate data. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {statsData.map((stat, index) => (
              <CardStats
                key={index}
                title={stat.title}
                totalSales={stat.value || 0}
                chartData={stat.chartData || []}
                chartConfig={{
                  desktop: {
                    label: stat.title,
                    color: "var(--chart-1)",
                  },
                }}
                pourcentageChange={stat.percentageChange || 0}
              />
            ))}
          </div>
        )}
      </Suspense>

      <div className="p-4 bg-background rounded-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">
          Top products affiliate
        </h1>
        <Suspense fallback={<CardProductSkeleton />}>
          {!affiliate?.topProduct ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No top product</AlertTitle>
              <AlertDescription>
                Start promoting products to see your top performer here.
              </AlertDescription>
            </Alert>
          ) : (
            <CardProduct
              productName={affiliate.topProduct.productName}
              postedAt={
                data.referrals[0]?.convertedAt?.toISOString().split("T")[0] || "-"
              }
              totalClicks={affiliate.totalClicks}
              commissions={affiliate.availableBalance}
              sold={affiliate.topProduct.quantity}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
