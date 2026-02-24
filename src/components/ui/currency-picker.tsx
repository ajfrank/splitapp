"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ALL_CURRENCIES,
  PRIORITY_CURRENCIES,
  searchCurrencies,
  type Currency,
} from "@/lib/utils/currencies";

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function CurrencyPicker({ value, onChange, className }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCurrencies = search ? searchCurrencies(search) : ALL_CURRENCIES;
  const selectedCurrency = ALL_CURRENCIES.find((c) => c.code === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <span className="flex items-center gap-2">
          <span className="font-medium">{selectedCurrency?.symbol}</span>
          <span>{selectedCurrency?.code}</span>
          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
            - {selectedCurrency?.name}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search currencies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Currency list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {!search && (
              <>
                {/* Priority currencies section */}
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Popular
                </div>
                {PRIORITY_CURRENCIES.map((currency) => (
                  <CurrencyOption
                    key={currency.code}
                    currency={currency}
                    selected={value === currency.code}
                    onSelect={() => {
                      onChange(currency.code);
                      setOpen(false);
                      setSearch("");
                    }}
                  />
                ))}
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  All Currencies
                </div>
              </>
            )}

            {filteredCurrencies.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No currencies found
              </div>
            ) : (
              (search ? filteredCurrencies : filteredCurrencies.filter(c => !PRIORITY_CURRENCIES.some(p => p.code === c.code))).map((currency) => (
                <CurrencyOption
                  key={currency.code}
                  currency={currency}
                  selected={value === currency.code}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearch("");
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CurrencyOptionProps {
  currency: Currency;
  selected: boolean;
  onSelect: () => void;
}

function CurrencyOption({ currency, selected, onSelect }: CurrencyOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
        selected
          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="w-6 font-medium">{currency.symbol}</span>
        <span className="font-medium">{currency.code}</span>
        <span className="text-gray-500 dark:text-gray-400">- {currency.name}</span>
      </span>
      {selected && <Check className="h-4 w-4 text-emerald-600" />}
    </button>
  );
}
