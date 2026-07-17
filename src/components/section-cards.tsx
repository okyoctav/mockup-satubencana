"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertTriangleIcon,
  UsersIcon,
  MapPinIcon,
  ActivityIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react"

const cards = [
  {
    label: "Total Kejadian Bencana",
    value: "1.247",
    change: "+8.3%",
    trend: "up",
    note: "Naik bulan ini",
    sub: "Data dari seluruh Indonesia",
    icon: AlertTriangleIcon,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    label: "Total Pengungsi",
    value: "48.320",
    change: "-12.1%",
    trend: "down",
    note: "Turun dari periode lalu",
    sub: "Penanganan berjalan",
    icon: UsersIcon,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    label: "Wilayah Terdampak",
    value: "34",
    change: "+2",
    trend: "up",
    note: "Provinsi baru terdata",
    sub: "Dari 34 provinsi",
    icon: MapPinIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Level Siaga Tinggi",
    value: "127",
    change: "+4.5%",
    trend: "up",
    note: "Meningkat pekan ini",
    sub: "Memerlukan penanganan segera",
    icon: ActivityIcon,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
]

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => {
        const Icon = card.icon
        const TrendIcon = card.trend === "up" ? TrendingUpIcon : TrendingDownIcon
        return (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`size-4 ${card.color}`} />
                </div>
                <CardDescription>{card.label}</CardDescription>
              </div>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge
                  variant="outline"
                  className={card.trend === "up" ? "text-red-600" : "text-green-600"}
                >
                  <TrendIcon />
                  {card.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.note} <TrendIcon className={`size-4 ${card.trend === "up" ? "text-red-500" : "text-green-500"}`} />
              </div>
              <div className="text-muted-foreground">{card.sub}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
