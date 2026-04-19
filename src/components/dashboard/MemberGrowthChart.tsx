import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import type { MemberGrowthPoint } from '../../api/types';
interface MemberGrowthChartProps {
  data: MemberGrowthPoint[];
}
export function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5
          }}>
          
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0" />
          
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#64748b',
              fontSize: 12
            }}
            dy={10} />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#64748b',
              fontSize: 12
            }}
            dx={-10} />
          
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} />
          
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '10px'
            }} />
          
          <Line
            type="monotone"
            name="Total Members"
            dataKey="total"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{
              r: 4,
              strokeWidth: 2
            }}
            activeDot={{
              r: 6
            }} />
          
          <Line
            type="monotone"
            name="New Members"
            dataKey="new"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{
              r: 4,
              strokeWidth: 2
            }} />
          
        </LineChart>
      </ResponsiveContainer>
    </div>);

}