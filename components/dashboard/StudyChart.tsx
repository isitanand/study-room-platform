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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-zinc-350">{payload[0].payload.day}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-zinc-400">Current Week:</span>
            <span className="font-bold text-white font-mono">{payload[0].value} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500/40" />
            <span className="text-zinc-400">Last Week:</span>
            <span className="font-bold text-zinc-400 font-mono">{payload[1].value} mins</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-450">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={10}
                fontWeight="semibold"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                fontWeight="semibold"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#71717a',
                }}
              />
              <Bar
                name="Current Week"
                dataKey="currentWeek"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                name="Last Week"
                dataKey="lastWeek"
                fill="#8b5cf645"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
