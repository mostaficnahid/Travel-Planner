"use client";

import { useState } from "react";
import { DollarSign, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useCurrency } from "@/lib/context/CurrencyContext";

interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  currency: string;
  isPlanned: boolean;
  date: string;
}

interface BudgetDetails {
  totalPlanned: number;
  accommodationBudget: number;
  transportBudget: number;
  foodBudget: number;
  activitiesBudget: number;
  shoppingBudget: number;
  miscBudget: number;
}

interface Props {
  tripId: string;
  budgetLimit: number;
  currency: string;
  budgetDetails?: BudgetDetails | null;
  expenses: Expense[];
  onExpenseAdded?: () => void;
}

export function BudgetTracker({
  tripId,
  budgetLimit,
  currency,
  budgetDetails,
  expenses,
  onExpenseAdded,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("food");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedCurrency, formatAmount, convertAmount, getSymbol, isLive } = useCurrency();

  const totalPlanned = budgetDetails?.totalPlanned || budgetLimit * 0.85;
  const totalActual = expenses.reduce((acc, e) => acc + e.amount, 0);
  const remaining = budgetLimit - totalActual;
  const variance = totalPlanned - budgetLimit;

  // Compute real actual spending per category from expenses prop
  const actualByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category.toLowerCase();
    // Normalize category keys to match chart labels
    const key =
      cat === "accommodation" ? "accommodation" :
      cat === "food" || cat === "food & dining" ? "food" :
      cat === "transportation" || cat === "transport" ? "transportation" :
      cat === "activities" ? "activities" :
      cat === "shopping" ? "shopping" : "misc";
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, {});

  // Chart data setup converted to selected global currency
  const chartData = [
    { category: "Accom.", Planned: convertAmount(budgetDetails?.accommodationBudget || 0), Actual: convertAmount(actualByCategory["accommodation"] || 0) },
    { category: "Food", Planned: convertAmount(budgetDetails?.foodBudget || 0), Actual: convertAmount(actualByCategory["food"] || 0) },
    { category: "Transport", Planned: convertAmount(budgetDetails?.transportBudget || 0), Actual: convertAmount(actualByCategory["transportation"] || 0) },
    { category: "Activities", Planned: convertAmount(budgetDetails?.activitiesBudget || 0), Actual: convertAmount(actualByCategory["activities"] || 0) },
    { category: "Shopping", Planned: convertAmount(budgetDetails?.shoppingBudget || 0), Actual: convertAmount(actualByCategory["shopping"] || 0) },
  ];


  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          title: newTitle,
          amount: parseFloat(newAmount),
          currency: selectedCurrency,
          isPlanned: false,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewAmount("");
        setShowAddForm(false);
        onExpenseAdded?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-7 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Budget Intelligence & FX Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Live rates matrix • Base {selectedCurrency} ({getSymbol(selectedCurrency)}) {isLive ? "• Verified Live API" : "• FX Matrix"}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-500/20 border border-white/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Allocated Budget</span>
          <p className="text-base sm:text-lg font-black text-white mt-1">{formatAmount(budgetLimit, currency)}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Planned</span>
          <p className="text-base sm:text-lg font-black text-blue-400 mt-1">{formatAmount(totalPlanned, currency)}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Actual Spent</span>
          <p className="text-base sm:text-lg font-black text-emerald-400 mt-1">{formatAmount(totalActual, currency)}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Remaining</span>
          <p className={`text-base sm:text-lg font-black mt-1 ${remaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatAmount(remaining, currency)}
          </p>
        </div>
      </div>

      {/* Smart Cost-Saving Suggestion Banner */}
      {variance > 0 ? (
        <div className="bg-amber-500/15 border border-amber-400/30 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300">Actionable Cost Optimization Suggestion</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Planned costs exceed your target by <strong>{formatAmount(variance, currency)}</strong>. Swapping 1 fine-dining activity for local street food and taking public transit brings you under budget!
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/15 border border-emerald-400/30 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Trip plan is strictly within budget limit with a safety margin of {formatAmount(Math.abs(variance), currency)}.</span>
        </div>
      )}

      {/* Add Expense Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="bg-slate-950 p-5 rounded-2xl border border-white/15 space-y-4 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-white">Add New Expense ({selectedCurrency})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <input
              type="text"
              placeholder="Title (e.g. Ramen Lunch)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder={`Amount (${getSymbol()})`}
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="food">Food & Dining</option>
              <option value="transportation">Transport</option>
              <option value="accommodation">Accommodation</option>
              <option value="activities">Activities</option>
              <option value="shopping">Shopping</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-blue-600/30"
          >
            Save Expense
          </button>
        </form>
      )}

      {/* Recharts Category Visualizer */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Category Breakdown (Planned vs Actual in {selectedCurrency})</h4>
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <Bar dataKey="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
