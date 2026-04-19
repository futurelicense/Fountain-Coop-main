import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import { Card } from '../ui/Card';

export type RecoveryTrendPoint = {
  month: string;
  recovered: number;
  target: number;
};

interface RecoveryTrendChartProps {
  data?: RecoveryTrendPoint[];
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  const chartData = data?.length ? data : [];
  if (chartData.length === 0) {
    return (
      <Card title="Recovery Performance Trend" className="h-full">
        <div className="h-72 w-full mt-4 flex items-center justify-center">
          <p className="text-sm text-fountain-gray-500 text-center px-4">
            No recovery trend data yet.
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card title="Recovery Performance Trend" className="h-full">
      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
              dx={-10} />
            
            <Tooltip
              formatter={(value: number) => [
              new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                maximumFractionDigits: 0
              }).format(value),
              undefined]
              }
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              cursor={{
                fill: '#f1f5f9'
              }} />
            
            <Legend
              iconType="circle"
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px'
              }} />
            
            <Bar
              name="Target"
              dataKey="target"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              barSize={20} />
            
            <Bar
              name="Recovered"
              dataKey="recovered"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={20} />
            
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>);

}