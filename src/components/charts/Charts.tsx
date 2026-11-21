'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px rgba(49,46,129,0.1)',
  fontSize: 12,
  padding: '8px 12px',
  backgroundColor: '#ffffff',
};

export interface AttendanceAreaProps {
  data: {
    month: string;
    present: number;
    absent?: number;
  }[];
}

export function AttendanceArea({ data }: AttendanceAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 8,
          left: -16,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
          domain={[60, 100]}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{
            stroke: '#c4b5fd',
            strokeWidth: 1,
          }}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="#8B5CF6"
          strokeWidth={2.5}
          fill="url(#presentFill)"
          name="Present %"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface PerformanceBarProps {
  data: {
    grade?: string;
    subject?: string;
    average?: number;
    score?: number;
  }[];
  dataKey: 'average' | 'score';
  xKey: 'grade' | 'subject';
}

export function PerformanceBar({ data, dataKey, xKey }: PerformanceBarProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{
          top: 10,
          right: 8,
          left: -16,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{
            fill: '#f5f3ff',
          }}
        />
        <Bar
          dataKey={dataKey}
          fill="#312E81"
          radius={[8, 8, 0, 0]}
          maxBarSize={42}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface EnrollmentDonutProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function EnrollmentDonut({ data }: EnrollmentDonutProps) {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-extrabold text-slate-900">
            {total}
          </span>
          <span className="text-xs text-slate-400">Students</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: d.color,
              }}
            />
            <span className="text-slate-600">{d.name}</span>
            <span className="ml-auto font-semibold text-slate-900">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface MiniLineProps {
  data: {
    month: string;
    present: number;
  }[];
}

export function MiniLine({ data }: MiniLineProps) {
  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart
        data={data}
        margin={{
          top: 4,
          right: 4,
          left: 4,
          bottom: 4,
        }}
      >
        <Line
          type="monotone"
          dataKey="present"
          stroke="#8B5CF6"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
