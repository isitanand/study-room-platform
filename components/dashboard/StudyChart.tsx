'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Clock } from 'lucide-react'

interface StudyChartProps {
  data: {
    day: string
    currentWeek: number
    lastWeek: number
  }[]
}

export function StudyChart({ data }: StudyChartProps) {
  // Custom styled Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#e7e7e7] rounded-[10px] p-4 text-caption font-sans space-y-2 shadow-none">
          <p className="font-semibold text-[#141414] uppercase">{payload[0].payload.day}</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A7C6E]" />
            <span className="text-[#4e4d4c] font-medium uppercase">Current Week:</span>
            <span className="text-[#141414] font-semibold">{payload[0].value} MINS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#262626]" />
            <span className="text-[#4e4d4c] font-medium uppercase">Last Week:</span>
            <span className="text-[#262626] font-semibold">{payload[1].value} MINS</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
      <CardHeader className="p-5 pb-0 flex flex-row items-center gap-2">
        <Clock className="w-4 h-4 text-[#0A7C6E]" />
        <CardTitle className="text-caption font-semibold uppercase tracking-wider text-[#4e4d4c] mt-0.5">
          Weekly Study Activity (Minutes)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e7" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="day"
                stroke="#4e4d4c"
                fontSize={10}
                fontFamily="Figtree"
                fontWeight={500}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4e4d4c"
                fontSize={10}
                fontFamily="Figtree"
                fontWeight={500}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,225,48,0.03)' }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: 'Figtree',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: '#4e4d4c',
                }}
              />
              <Bar
                name="Current Week"
                dataKey="currentWeek"
                fill="#0A7C6E"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                activeBar={{ stroke: '#141414', strokeWidth: 1.5, fill: '#0A7C6E' }}
              />
              <Bar
                name="Last Week"
                dataKey="lastWeek"
                fill="#262626"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                activeBar={{ stroke: '#0A7C6E', strokeWidth: 1.5, fill: '#262626' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
