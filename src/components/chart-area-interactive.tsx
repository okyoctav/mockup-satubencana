"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Tren Kejadian Bencana Indonesia"

// Data bencana simulasi per bulan 2025-2026
const chartData = [
  { date: "2025-07-01", banjir: 48, gempa: 12 },
  { date: "2025-08-01", banjir: 62, gempa: 8 },
  { date: "2025-09-01", banjir: 71, gempa: 15 },
  { date: "2025-10-01", banjir: 89, gempa: 9 },
  { date: "2025-11-01", banjir: 103, gempa: 21 },
  { date: "2025-12-01", banjir: 128, gempa: 17 },
  { date: "2026-01-01", banjir: 145, gempa: 11 },
  { date: "2026-02-01", banjir: 132, gempa: 24 },
  { date: "2026-03-01", banjir: 97, gempa: 19 },
  { date: "2026-04-01", banjir: 84, gempa: 13 },
  { date: "2026-05-01", banjir: 73, gempa: 16 },
  { date: "2026-06-01", banjir: 61, gempa: 22 },
  { date: "2026-07-01", banjir: 55, gempa: 18 },
]

const chartConfig = {
  banjir: {
    label: "Banjir",
    color: "var(--chart-1)",
  },
  gempa: {
    label: "Gempa Bumi",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("12m")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("3m")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const now = new Date("2026-07-01")
    let monthsBack = 12
    if (timeRange === "3m") monthsBack = 3
    else if (timeRange === "6m") monthsBack = 6
    const start = new Date(now)
    start.setMonth(start.getMonth() - monthsBack)
    return date >= start
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Tren Kejadian Bencana</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Distribusi kejadian banjir & gempa bumi per bulan
          </span>
          <span className="@[540px]/card:hidden">Tren banjir & gempa</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "12m")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="12m">12 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="6m">6 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="3m">3 Bulan</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Pilih rentang waktu"
            >
              <SelectValue placeholder="12 Bulan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="12m" className="rounded-lg">12 Bulan</SelectItem>
              <SelectItem value="6m" className="rounded-lg">6 Bulan</SelectItem>
              <SelectItem value="3m" className="rounded-lg">3 Bulan</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillBanjir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-banjir)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-banjir)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGempa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-gempa)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-gempa)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  year: "2-digit",
                })
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="banjir"
              type="natural"
              fill="url(#fillBanjir)"
              stroke="var(--color-banjir)"
              stackId="a"
            />
            <Area
              dataKey="gempa"
              type="natural"
              fill="url(#fillGempa)"
              stroke="var(--color-gempa)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
