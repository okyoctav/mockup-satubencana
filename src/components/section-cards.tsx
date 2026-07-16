import { Card } from "@/components/ui/card"
import BellIcon from "nexticons/outline/BellIcon"
import StarListIcon from "nexticons/outline/StarListIcon"
import ClipboardListIcon from "nexticons/outline/ClipboardListIcon"

const stats = [
  { label: "Kejadian hari ini", value: "24", hint: "+12% dari minggu lalu", icon: <BellIcon width={20} height={20} /> },
  { label: "Wilayah terdampak", value: "18", hint: "3 prioritas tinggi", icon: <StarListIcon width={20} height={20} /> },
  { label: "Data terverifikasi", value: "93%", hint: "Pembaruan 10 menit lalu", icon: <ClipboardListIcon width={20} height={20} /> },
]

export function SectionCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((item) => (
        <Card key={item.label} className="rounded-3xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="rounded-2xl bg-slate-100 p-2">{item.icon}</div>
            <p className="text-sm font-semibold">{item.label}</p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
          <p className="mt-1 text-sm text-slate-600">{item.hint}</p>
        </Card>
      ))}
    </div>
  )
}
