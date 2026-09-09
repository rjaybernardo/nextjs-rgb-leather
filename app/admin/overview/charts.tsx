"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

type SalesData = {
  month: string;
  totalSales: number;
};

type ChartsProps = {
  data: {
    salesData: SalesData[];
  };
};

export default function Charts({ data: { salesData } }: ChartsProps) {
  return (
    <div className="h-[350px] w-full">
      <BarChart data={salesData} responsive className="h-full w-full">
        <XAxis
          dataKey="month"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />

        <Bar
          dataKey="totalSales"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </div>
  );
}
