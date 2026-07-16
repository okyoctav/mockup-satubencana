import { Card } from "@/components/ui/card"

interface DataTableProps {
  data: Array<Record<string, string | number>>
}

export function DataTable({ data }: DataTableProps) {
  if (!data.length) {
    return (
      <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Tidak ada data.</p>
      </Card>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium text-slate-600">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-slate-700">
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
