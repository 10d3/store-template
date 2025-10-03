"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import React from "react";
import { Area, AreaChart } from "recharts";
import { FaArrowTrendUp } from "react-icons/fa6";

interface CardStatsProps {
  title: string;
  totalSales: number;
  chartData: { month: string; desktop: number }[];
  chartConfig: ChartConfig;
  pourcentageChange: number;
}

export default function CardStats({
  title,
  totalSales,
  pourcentageChange,
  chartData,
  chartConfig,
}: CardStatsProps) {
  return (
    <Card className="flex flex-row p-3 w-full h-30">
      <div className="w-1/2 flex flex-col justify-between">
        <CardTitle className="text-sm text-pretty text-primary/50 line-clamp-1">
          {title}
        </CardTitle>
        <CardDescription className="font-semibold text-xl text-primary">
          {title === "Conversion Rate"
            ? `${totalSales}%`
            : title === "Total Clicks" || title === "Products Sold"
              ? totalSales
              : `$${totalSales.toFixed(2)}`}
        </CardDescription>
        <div className="text-sm flex items-center text-gray-500">
          <Badge className="bg-green-200 mr-1 p-1">
            <FaArrowTrendUp className=" text-green-500 size-5 font-bold" />
          </Badge>
          <p className="font-medium text-green-500">
            {pourcentageChange > 0 ? "+" : "-"}
            {Math.abs(pourcentageChange).toFixed(0)}%
          </p>
        </div>
      </div>
      <div className="w-1/2 h-full">
        <ChartContainer className="h-full w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.1}
              stroke="var(--color-desktop)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
