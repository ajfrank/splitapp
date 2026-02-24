"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, CATEGORIES } from "@/lib/utils/format";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { ExpenseWithRelations } from "@/lib/types";

interface SpendingChartsProps {
  expenses: ExpenseWithRelations[];
  currency: string;
}

// Color palette for charts
const CATEGORY_COLORS: Record<string, string> = {
  food: "#10b981",       // emerald
  transport: "#3b82f6",  // blue
  lodging: "#8b5cf6",    // purple
  entertainment: "#f59e0b", // amber
  other: "#6b7280",      // gray
};


export function SpendingByCategory({ expenses, currency }: SpendingChartsProps) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const category = expense.category || "other";
      totals[category] = (totals[category] || 0) + expense.amount;
    });

    return CATEGORIES.map((cat) => ({
      name: cat.label,
      value: Math.round((totals[cat.value] || 0) * 100) / 100,
      icon: cat.icon,
      color: CATEGORY_COLORS[cat.value] || CATEGORY_COLORS.other,
    })).filter((item) => item.value > 0);
  }, [expenses]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No expenses to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value) || 0, currency)}
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                  <span className="text-gray-400 ml-1">
                    ({Math.round((item.value / total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpendingByMonth({ expenses, currency }: SpendingChartsProps) {
  const data = useMemo(() => {
    // Get last 6 months
    const months: { month: Date; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      months.push({
        month: monthStart,
        label: format(monthStart, "MMM"),
        total: 0,
      });
    }

    // Sum expenses by month
    expenses.forEach((expense) => {
      const expenseDate = parseISO(expense.expense_date);
      const expenseMonth = startOfMonth(expenseDate);

      const monthData = months.find(
        (m) => m.month.getTime() === expenseMonth.getTime()
      );
      if (monthData) {
        monthData.total += expense.amount;
      }
    });

    return months.map((m) => ({
      name: m.label,
      amount: Math.round(m.total * 100) / 100,
    }));
  }, [expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickFormatter={(value) => `${getCurrencySymbolShort(currency)}${value}`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value) || 0, currency)}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, #fff)",
                  border: "1px solid var(--tooltip-border, #e5e7eb)",
                  borderRadius: "8px",
                }}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar
                dataKey="amount"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpendingTotals({ expenses, currency }: SpendingChartsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));

    let total = 0;
    let thisMonthTotal = 0;
    let lastMonthTotal = 0;

    expenses.forEach((expense) => {
      total += expense.amount;
      const expenseMonth = startOfMonth(parseISO(expense.expense_date));

      if (expenseMonth.getTime() === thisMonth.getTime()) {
        thisMonthTotal += expense.amount;
      } else if (expenseMonth.getTime() === lastMonth.getTime()) {
        lastMonthTotal += expense.amount;
      }
    });

    const avgPerExpense = expenses.length > 0 ? total / expenses.length : 0;

    return {
      total,
      thisMonthTotal,
      lastMonthTotal,
      expenseCount: expenses.length,
      avgPerExpense,
      monthChange: lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0,
    };
  }, [expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Spending Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Spent</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.total, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">This Month</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.thisMonthTotal, currency)}
            </p>
            {stats.monthChange !== 0 && (
              <p className={`text-xs ${stats.monthChange > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {stats.monthChange > 0 ? "↑" : "↓"} {Math.abs(Math.round(stats.monthChange))}% vs last month
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Expenses</p>
            <p className="text-xl font-semibold">{stats.expenseCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Avg per Expense</p>
            <p className="text-xl font-semibold">
              {formatCurrency(stats.avgPerExpense, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to get short currency symbol
function getCurrencySymbolShort(code: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  };
  return symbols[code] || "$";
}
