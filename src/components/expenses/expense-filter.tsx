"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/utils/format";
import type { Category } from "@/lib/types";

export interface ExpenseFilters {
  search: string;
  category: Category | "all";
  dateFrom: string;
  dateTo: string;
}

interface ExpenseFilterProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
}

const defaultFilters: ExpenseFilters = {
  search: "",
  category: "all",
  dateFrom: "",
  dateTo: "",
};

export function ExpenseFilter({ filters, onFiltersChange }: ExpenseFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </Button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Category filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Category
            </label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, category: "all" })}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  filters.category === "all"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, category: cat.value as Category })}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors flex items-center gap-1 ${
                    filters.category === cat.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                From
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                To
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to filter expenses
export function filterExpenses<T extends { description: string; category: string; expense_date: string }>(
  expenses: T[],
  filters: ExpenseFilters
): T[] {
  return expenses.filter((expense) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!expense.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom && expense.expense_date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && expense.expense_date > filters.dateTo) {
      return false;
    }

    return true;
  });
}
