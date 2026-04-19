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

export type SavingsGrowthPoint = {
  month: string;
  totalSavings: number;
  contributions: number;
};

interface SavingsGrowthChartProps {
  data?: SavingsGrowthPoint[];
}

export function SavingsGrowthChart({ data }: SavingsGrowthChartProps) {
  const chartData = data?.length ? data : [];
  if (chartData.length === 0) {
    return (
      <div className="h-72 w-full mt-4 flex items-center justify-center">
        <p className="text-sm text-fountain-gray-500 text-center px-4">
          No savings trend data yet. Populate metrics or cooperative chart
          records in Supabase.
        </p>
      </div>
    );
  }
  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
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
            name="Total Savings"
            dataKey="totalSavings"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.15}
            strokeWidth={2} />
          
          <Area
            type="monotone"
            name="Monthly Contributions"
            dataKey="contributions"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.1}
            strokeWidth={2} />
          
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}