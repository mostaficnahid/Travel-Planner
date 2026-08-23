"use client";

import { useState } from "react";
import { Package, CheckSquare, Square, Shield, Umbrella, Shirt, Zap } from "lucide-react";

interface Props {
  destination: string;
  travelStyle: string;
  hasRainForecast?: boolean;
}

import { type LucideIcon } from "lucide-react";

interface PackingCategory {
  title: string;
  icon: LucideIcon;
  items: { id: string; name: string; checked: boolean }[];
}

export function PackingList({ destination, travelStyle, hasRainForecast = false }: Props) {
  const [categories, setCategories] = useState<PackingCategory[]>([
    {
      title: "Essentials & Documents",
      icon: Shield,
      items: [
        { id: "e1", name: "Passport / ID Card & Visa Documents", checked: true },
        { id: "e2", name: "Travel Insurance Details & Emergency Contacts", checked: true },
        { id: "e3", name: "Credit Cards, Local Cash & FX Cards", checked: false },
        { id: "e4", name: "Boarding Passes & Hotel Reservation PDFs", checked: true },
      ],
    },
    {
      title: "Electronics & Tech",
      icon: Zap,
      items: [
        { id: "t1", name: "Smartphone & Fast Charger Cable", checked: true },
        { id: "t2", name: "Universal Travel Plug Adapter", checked: false },
        { id: "t3", name: "Power Bank (10,000+ mAh)", checked: false },
        { id: "t4", name: "Noise-Cancelling Headphones", checked: false },
      ],
    },
    {
      title: "Clothing & Apparel",
      icon: Shirt,
      items: [
        { id: "c1", name: `Breathable ${travelStyle} Outfits & Daywear`, checked: false },
        { id: "c2", name: "Comfortable Walking Shoes / Sneakers", checked: true },
        { id: "c3", name: "Evening / Fine Dining Attire", checked: false },
        { id: "c4", name: "Lightweight Jacket or Layering Piece", checked: false },
      ],
    },
    {
      title: "Weather & Activity Gear",
      icon: Umbrella,
      items: [
        { id: "w1", name: hasRainForecast ? "Compact Travel Umbrella (Rain Expected!)" : "Foldable Windbreaker / Raincoat", checked: false },
        { id: "w2", name: "Sunscreen (SPF 50+) & Sunglasses", checked: false },
        { id: "w3", name: "Refillable Water Bottle & Hydration Packs", checked: false },
        { id: "w4", name: "Compact Daypack for Sightseeing", checked: true },
      ],
    },
  ]);

  const toggleCheck = (catIdx: number, itemIdx: number) => {
    setCategories((prev) => {
      const next = [...prev];
      next[catIdx].items[itemIdx].checked = !next[catIdx].items[itemIdx].checked;
      return next;
    });
  };

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedItems = categories.reduce(
    (acc, c) => acc + c.items.filter((i) => i.checked).length,
    0
  );
  const progressPercent = Math.round((checkedItems / totalItems) * 100);

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            AI Smart Packing List for {destination}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Tailored for {travelStyle} style & weather forecasts</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-emerald-400">{progressPercent}% Packed</span>
          <p className="text-[10px] text-slate-400">{checkedItems}/{totalItems} Items</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/10">
        <div
          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Category Accordion / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {categories.map((cat, cIdx) => {
          const IconComp = cat.icon;
          return (
            <div key={cat.title} className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <IconComp className="w-4 h-4 text-blue-400" />
                <span>{cat.title}</span>
              </h4>
              <div className="space-y-2">
                {cat.items.map((item, iIdx) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(cIdx, iIdx)}
                    className="flex items-center gap-3 cursor-pointer text-xs group"
                  >
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
                    )}
                    <span
                      className={`font-medium transition leading-snug ${
                        item.checked ? "text-slate-500 line-through" : "text-slate-200 group-hover:text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
