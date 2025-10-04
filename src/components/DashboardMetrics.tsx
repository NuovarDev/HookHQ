"use client";

import { SendIcon, ArrowDownIcon, ArrowUpIcon, WebhookIcon, ClockIcon, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface MetricsData {
    summary: {
        totalMessages: number;
        deliveredMessages: number;
        failedMessages: number;
        successRate: number;
        avgQueueTime: number;
    };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardMetrics() {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/webhooks/metrics?timeRange=7d');
                if (!response.ok) {
                    throw new Error('Failed to fetch metrics');
                }
                const data = await response.json() as MetricsData;
                setMetrics(data);
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        return `${Math.round(ms / 60000)}m`;
    };

    if (loading) {
        return (
            <div>
                <h3 className="text-base font-semibold text-gray-900">Last 7 days</h3>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6 animate-pulse">
                            <div className="absolute rounded-md bg-gray-300 p-3">
                                <div className="size-6 bg-gray-400 rounded" />
                            </div>
                            <div className="ml-16">
                                <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                                <div className="h-8 bg-gray-300 rounded w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const stats = metrics ? [
        { 
            id: 1, 
            name: 'Total Messages', 
            stat: metrics.summary.totalMessages.toLocaleString(), 
            icon: SendIcon, 
            change: `${metrics.summary.deliveredMessages} delivered`, 
            changeType: 'info' as const
        },
        { 
            id: 2, 
            name: 'Success Rate', 
            stat: `${metrics.summary.successRate}%`, 
            icon: CheckCircle, 
            change: `${metrics.summary.failedMessages} failed`, 
            changeType: metrics.summary.successRate >= 95 ? 'increase' as const : 'decrease' as const
        },
        { 
            id: 3, 
            name: 'Avg Queue Time', 
            stat: formatDuration(metrics.summary.avgQueueTime), 
            icon: ClockIcon, 
            change: 'Time to processing', 
            changeType: 'info' as const
        },
        { 
            id: 4, 
            name: 'Failed Messages', 
            stat: metrics.summary.failedMessages.toLocaleString(), 
            icon: XCircle, 
            change: `${metrics.summary.totalMessages > 0 ? ((metrics.summary.failedMessages / metrics.summary.totalMessages) * 100).toFixed(1) : '0'}% of total`, 
            changeType: 'decrease' as const
        },
    ] : [];

    return (
        <div>
            <h3 className="text-base font-semibold text-gray-900">Last 7 days</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                <div
                    key={item.id}
                    className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6"
                >
                    <dt>
                    <div className={`absolute rounded-md p-3 ${
                        item.changeType === 'increase' ? 'bg-green-500' : 
                        item.changeType === 'decrease' ? 'bg-red-500' : 
                        'bg-indigo-500'
                    }`}>
                        <item.icon aria-hidden="true" className="size-6 text-white" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                    </dt>
                    <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                    <p
                        className={classNames(
                        item.changeType === 'increase' ? 'text-green-600' : 
                        item.changeType === 'decrease' ? 'text-red-600' : 
                        'text-gray-600',
                        'ml-2 flex items-baseline text-sm font-semibold',
                        )}
                    >
                        {item.changeType === 'increase' ? (
                        <ArrowUpIcon aria-hidden="true" className="size-5 shrink-0 self-center text-green-500" />
                        ) : item.changeType === 'decrease' ? (
                        <ArrowDownIcon aria-hidden="true" className="size-5 shrink-0 self-center text-red-500" />
                        ) : null}

                        <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : item.changeType === 'decrease' ? 'Decreased' : ''} by </span>
                        {item.change}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                        <div className="text-sm">
                        <a href="/dashboard/metrics" className="font-medium text-indigo-600 hover:text-indigo-500">
                            View all<span className="sr-only"> {item.name} stats</span>
                        </a>
                        </div>
                    </div>
                    </dd>
                </div>
                ))}
            </dl>
        </div>
    );
}
