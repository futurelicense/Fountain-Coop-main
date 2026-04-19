import { Card } from '../ui/Card';

export type AgingBucketSlice = { count: number; amount: number };

export type AgingBucketsSnapshot = {
  current: AgingBucketSlice;
  bucket1_30: AgingBucketSlice;
  bucket31_60: AgingBucketSlice;
  bucket61_90: AgingBucketSlice;
  bucket90plus: AgingBucketSlice;
};

const EMPTY: AgingBucketsSnapshot = {
  current: { count: 0, amount: 0 },
  bucket1_30: { count: 0, amount: 0 },
  bucket31_60: { count: 0, amount: 0 },
  bucket61_90: { count: 0, amount: 0 },
  bucket90plus: { count: 0, amount: 0 },
};

interface AgingBucketsProps {
  snapshot?: AgingBucketsSnapshot | null;
}

export function AgingBuckets({ snapshot }: AgingBucketsProps) {
  const agingBuckets = snapshot ?? EMPTY;
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  const totalAmount =
    agingBuckets.current.amount +
    agingBuckets.bucket1_30.amount +
    agingBuckets.bucket31_60.amount +
    agingBuckets.bucket61_90.amount +
    agingBuckets.bucket90plus.amount;
  const getPercentage = (amount: number) => {
    if (!totalAmount) return '0%';
    return `${((amount / totalAmount) * 100).toFixed(1)}%`;
  };
  const buckets = [
    {
      label: 'Current',
      data: agingBuckets.current,
      color: 'bg-fountain-green',
      textColor: 'text-fountain-green',
    },
    {
      label: '1-30 Days',
      data: agingBuckets.bucket1_30,
      color: 'bg-fountain-blue',
      textColor: 'text-fountain-blue',
    },
    {
      label: '31-60 Days',
      data: agingBuckets.bucket31_60,
      color: 'bg-fountain-amber',
      textColor: 'text-fountain-amber',
    },
    {
      label: '61-90 Days',
      data: agingBuckets.bucket61_90,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
    },
    {
      label: '90+ Days',
      data: agingBuckets.bucket90plus,
      color: 'bg-fountain-red',
      textColor: 'text-fountain-red',
    },
  ];

  return (
    <Card title="Portfolio Aging Analysis" className="h-full">
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-fountain-gray-600 font-medium">
            Total Portfolio
          </span>
          <span className="text-fountain-gray-900 font-bold">
            {formatNaira(totalAmount)}
          </span>
        </div>

        <div className="h-4 w-full flex rounded-full overflow-hidden">
          {buckets.map((bucket, idx) => (
            <div
              key={idx}
              className={bucket.color}
              style={{
                width: getPercentage(bucket.data.amount),
              }}
              title={`${bucket.label}: ${formatNaira(bucket.data.amount)}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {buckets.map((bucket, idx) => (
          <div
            key={idx}
            className="bg-fountain-gray-50 rounded-lg p-3 border border-fountain-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${bucket.color}`} />
              <span className="text-xs font-semibold text-fountain-gray-600 uppercase tracking-wider">
                {bucket.label}
              </span>
            </div>
            <div className="text-lg font-bold text-fountain-gray-900 mb-0.5">
              {formatNaira(bucket.data.amount)}
            </div>
            <div className="text-xs text-fountain-gray-500">
              {bucket.data.count} cases ({getPercentage(bucket.data.amount)})
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
