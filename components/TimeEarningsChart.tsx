
import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Area
} from 'recharts';
import { AppData } from '../types';

interface TimeEarningsChartProps {
    data: AppData;
}

const TimeEarningsChart: React.FC<TimeEarningsChartProps> = ({ data }) => {
    const [viewMode, setViewMode] = useState<'time' | 'earnings'>('time');
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

    // 1. Process Data
    const processData = () => {
        const days = timeRange === 'week' ? 7 : 30;
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        const dateMap = new Map<string, any>();

        // Helper for local YYYY-MM-DD
        const getLocalYMD = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Initialize all dates
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = getLocalYMD(d);

            dateMap.set(dateStr, {
                date: dateStr,
                displayDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                totalDuration: 0,
                totalEarnings: 0,
                students: {} // For stacked bars
            });
        }

        // Aggregate Sessions
        data.sessions.forEach(session => {
            if (dateMap.has(session.date)) {
                const entry = dateMap.get(session.date);
                const duration = session.duration || (session.status === 'scheduled' ? 60 : 0);
                const student = data.students.find(s => s.id === session.studentId);

                if (student) {
                    // Time
                    if (session.status === 'completed' || session.status === 'in-progress') {
                        entry.students[student.name] = (entry.students[student.name] || 0) + duration;
                        entry.totalDuration += duration;

                        // Earnings
                        const earnings = (student.monthlyPayment || 0) / 8;
                        entry.totalEarnings += earnings;
                    } else if (session.status === 'scheduled') {
                        // Track scheduled separately or as a specific key like "Projected"
                        entry.students[student.name + ' (Projected)'] = (entry.students[student.name + ' (Projected)'] || 0) + duration;

                        // Projected Earnings
                        const earnings = (student.monthlyPayment || 0) / 8;
                        entry.totalEarnings += earnings;
                    }
                }
            }
        });

        return Array.from(dateMap.values());
    };

    const chartData = processData();
    const hasData = chartData.some(d => d.totalDuration > 0 || Object.keys(d.students).length > 0);

    const activeStudents = data.students.filter(s => s.status !== 'archived');
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#ebb305', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl text-white">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs font-bold mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-slate-300">{entry.name}:</span>
                            <span className="text-white">
                                {viewMode === 'time'
                                    ? `${entry.value} mins`
                                    : `$${Math.round(entry.value).toLocaleString()}`}
                            </span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-xs font-black text-white">
                            {viewMode === 'time'
                                ? `${payload.reduce((acc: any, curr: any) => acc + curr.value, 0)} mins`
                                : `$${Math.round(payload.reduce((acc: any, curr: any) => acc + curr.value, 0)).toLocaleString()}`}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!hasData) {
        return (
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-[3rem] p-10 border border-slate-200 dark:border-slate-700/50 pro-shadow">
                <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 text-2xl">
                        <i className="fas fa-chart-bar"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Data Available</h3>
                        <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto mb-4">
                            We couldn't match any sessions to the dates:
                            <br />
                            <span className="font-mono text-xs">{chartData[0]?.date} to {chartData[chartData.length - 1]?.date}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                            {data.sessions.length} total sessions found in DB.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate Header Totals
    const totalDurationForPeriod = chartData.reduce((acc, curr) => acc + curr.totalDuration, 0);
    const totalEarningsForPeriod = chartData.reduce((acc, curr) => acc + curr.totalEarnings, 0);

    // Format Header Text
    const headerText = viewMode === 'time'
        ? `${Math.floor(totalDurationForPeriod / 60)} h ${totalDurationForPeriod % 60} m`
        : `$${Math.round(totalEarningsForPeriod)}`;

    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl md:rounded-[3rem] p-4 md:p-10 border border-slate-200 dark:border-slate-700/50 pro-shadow">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-10 gap-2 md:gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-[#020617] dark:text-white tracking-tighter mb-1 md:mb-2">
                        {headerText}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                        {viewMode === 'time' ? 'Time' : 'Earnings'} • {timeRange === 'week' ? '7 Days' : '30 Days'}
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl self-end md:self-auto">
                    <button
                        onClick={() => setViewMode('time')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'time'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        Time
                    </button>
                    <button
                        onClick={() => setViewMode('earnings')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'earnings'
                            ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        $
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] md:h-[300px] w-full mb-6 md:mb-10">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'time' ? (
                        <BarChart data={chartData} barSize={window.innerWidth < 768 ? 12 : 24}>
                            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" opacity={0.5} />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: window.innerWidth < 768 ? 10 : 12, fontWeight: 700 }}
                                tickFormatter={(val) => val.split(' ')[0][0]} // First letter of Day (M, T, W...)
                                dy={10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5, radius: 12 }} />

                            {/* Track Background (Optional) */}

                            {activeStudents.map((student, index) => {
                                return (
                                    <React.Fragment key={student.id}>
                                        <Bar
                                            dataKey={`students.${student.name}`}
                                            stackId="a"
                                            fill={student.color || colors[index % colors.length]}
                                            radius={[2, 2, 2, 2]}
                                        />
                                        <Bar
                                            dataKey={`students.${student.name} (Projected)`}
                                            stackId="a"
                                            fill={student.color || colors[index % colors.length]}
                                            radius={[2, 2, 2, 2]}
                                            opacity={0.3}
                                        />
                                    </React.Fragment>
                                )
                            })}
                        </BarChart>
                    ) : (
                        <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" opacity={0.5} />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: window.innerWidth < 768 ? 9 : 11, fontWeight: 700 }}
                                tickFormatter={(val) => val.split(' ')[0][0]}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 0 }} width={0} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="totalEarnings" stroke="#22c55e" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={3} />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 md:space-y-4">
                {activeStudents.map((student, index) => {
                    // Calculate totals
                    let studentTotal = chartData.reduce((acc, curr) => {
                        return acc + (curr.students[student.name] || 0) + (curr.students[student.name + ' (Projected)'] || 0);
                    }, 0);

                    if (studentTotal === 0) return null;

                    const hours = Math.floor(studentTotal / 60);
                    const mins = studentTotal % 60;
                    const displayTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                    return (
                        <div key={student.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 md:p-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div
                                    className="w-2 md:w-3 h-2 md:h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: student.color || colors[index % colors.length] }}
                                ></div>
                                <span className="text-[12px] md:text-sm font-bold text-slate-700 dark:text-slate-200">{student.name.split(' ')[0]}</span>
                            </div>
                            <span className="text-[12px] md:text-sm font-black text-slate-900 dark:text-white">
                                {displayTime}
                            </span>
                        </div>
                    );
                })}
                {/* View All / More Button */}
                <button className="w-full py-2 md:py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mt-2 md:mt-4 border-t border-slate-100 dark:border-slate-800">
                    Detailed Analytics
                </button>
            </div>
        </div>
    );
};

export default TimeEarningsChart;
