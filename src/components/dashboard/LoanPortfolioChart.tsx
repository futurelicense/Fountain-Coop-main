import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import type { LoanPortfolioPoint } from '../../api/types';
interface LoanPortfolioChartProps {
  data: LoanPortfolioPoint[];
}
export function LoanPortfolioChart({ data }: LoanPortfolioChartProps) {
  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
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
            tickFormatter={(value) => `₦${value}M`}
            dx={-10} />
          
          <Tooltip
            formatter={(value: number) => [`₦${value}M`, undefined]}
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
          
          <Area
            type="monotone"
            name="Disbursements"
            dataKey="disbursed"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.1}
            strokeWidth={2} />
          
          <Area
            type="monotone"
            name="Repayments"
            dataKey="repaid"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
            strokeWidth={2} />
          
        </AreaChart>
      </ResponsiveContainer>
    </div>);

}