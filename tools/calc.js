/* ==========================================================================
   SEO 工具页共享计算内核
   --------------------------------------------------------------------------
   和桌面版 app/costmodel.py 同一套口径，逐项对齐，避免「网页算一个数、
   桌面算另一个数」这种最伤信任的事：

     weight_g        = volume_cm3 * density
     runner_per_piece= runner_g / cavities
     net_price_per_kg= price_per_kg / (1 + vat/100)   （有专票、可抵扣时）
     material_cost   = (weight + runner_per_piece)/1000 * net_price * (1 + scrap/100)
     regrind_credit  = runner_per_piece/1000 * net_price * regrind%/100 * (1 - 0.5)
     material_cost  -= min(regrind_credit, material_cost)      // 不能为负
     machine_cost    = cycle_s/3600 * machine_rate / cavities
     labor_cost      = operators * 15 * cycle_s/3600 / cavities
     total           = material + machine + labor + extras

   材料密度与参考价来自桌面版 MATERIALS 表（2024 华东大致水平），
   页面上明确写「参考价，请按实际采购价改」，不假装是实时行情。
   ========================================================================== */

export const MATERIALS = {
  "ABS":     { density: 1.05, price: 12.8, shrink: 0.5 },
  "HIPS":    { density: 1.05, price: 10.3, shrink: 0.4 },
  "PS":      { density: 1.05, price: 10.0, shrink: 0.6 },
  "AS/SAN":  { density: 1.08, price: 12.6, shrink: 0.5 },
  "PP":      { density: 0.91, price: 9.8,  shrink: 1.6 },
  "PE":      { density: 0.95, price: 9.4,  shrink: 2.0 },
  "PVC":     { density: 1.38, price: 9.4,  shrink: 0.4 },
  "PMMA":    { density: 1.19, price: 16.0, shrink: 0.5 },
  "PC":      { density: 1.20, price: 24.0, shrink: 0.6 },
  "PC/ABS":  { density: 1.13, price: 22.0, shrink: 0.5 },
  "PC/GF10": { density: 1.27, price: 26.0, shrink: 0.3 },
  "PA6":     { density: 1.14, price: 26.0, shrink: 1.4 },
  "PA66":    { density: 1.15, price: 30.0, shrink: 1.8 },
  "PA6/GF30":{ density: 1.36, price: 30.0, shrink: 0.6 },
  "POM":     { density: 1.41, price: 22.0, shrink: 2.0 },
  "PBT":     { density: 1.31, price: 22.0, shrink: 1.8 },
  "PET":     { density: 1.34, price: 23.0, shrink: 0.7 },
  "PPS":     { density: 1.35, price: 55.0, shrink: 0.5 },
  "TPU":     { density: 1.14, price: 32.0, shrink: 0.6 },
  "TPE":     { density: 1.10, price: 28.0, shrink: 1.2 },
};

/* 注塑机台综合费率 元/小时（含电费、折旧、维修，不含人工） */
export const MACHINE_RATES = {
  "立式 60T": 35, "海天 90T": 38, "海天 100T": 40, "海天 130T": 45,
  "海天 150T": 50, "海天 160T": 52, "海天 180T": 55, "海天 220T": 60,
  "海天 250T": 68, "海天 280T": 75, "海天 320T": 80, "海天 450T": 105,
  "海天 530T": 125,
};

export const LABOR_RATE = 15.0;   // 元/小时·人
export const REGRIND_PRICE = 0.5; // 回料单价 = 新料 × 50%

/** 安全数字：非数/负数一律归零，避免 NaN 传染整个结果区。 */
export function num(v, dflt = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : dflt;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * 塑料件单件材料费。
 * @param {object} o
 *   volume_cm3, density, price_per_kg, vat_pct, vat_deductible,
 *   scrap_pct, runner_g, cavities, regrind_pct
 * @returns {object} 各分项与合计
 */
export function materialCost(o) {
  const volume = Math.max(0, num(o.volume_cm3));
  const density = Math.max(0, num(o.density, 1));
  const price = Math.max(0, num(o.price_per_kg));
  const vat = clamp(num(o.vat_pct), 0, 100);
  const scrap = clamp(num(o.scrap_pct), 0, 100);
  const cavities = Math.max(1, Math.round(num(o.cavities, 1)));
  const runnerG = Math.max(0, num(o.runner_g));
  const regrind = clamp(num(o.regrind_pct), 0, 100);

  const weightG = volume * density;
  const runnerPerPiece = runnerG / cavities;

  // 有专票、可抵扣时，成本只算不含税部分
  const netPrice = (o.vat_deductible && vat > 0) ? price / (1 + vat / 100) : price;

  const gross = weightG + runnerPerPiece;
  const spend = gross / 1000 * netPrice * (1 + scrap / 100);
  const credit = regrind > 0
    ? runnerPerPiece / 1000 * netPrice * regrind / 100 * (1 - REGRIND_PRICE)
    : 0;
  const material = Math.max(0, spend - Math.min(credit, spend));

  return {
    weight_g: weightG,
    runner_per_piece_g: runnerPerPiece,
    net_price_per_kg: netPrice,
    gross_g: gross,
    spend,
    regrind_credit: credit,
    material_cost: material,
  };
}

/** 机台费（按腔数摊到单件）。 */
export function machineCost(o) {
  const cavities = Math.max(1, Math.round(num(o.cavities, 1)));
  const cycle = Math.max(0, num(o.cycle_s));
  const rate = Math.max(0, num(o.machine_rate));
  return cycle / 3600 * rate / cavities;
}

/** 操作人工（每台机 N 人，摊到单件）。 */
export function laborCost(o) {
  const cavities = Math.max(1, Math.round(num(o.cavities, 1)));
  const cycle = Math.max(0, num(o.cycle_s));
  const ops = Math.max(0, num(o.operators));
  return ops * LABOR_RATE * cycle / 3600 / cavities;
}

/** 千件材料用量（kg）—— 用来对照采购起订量。 */
export function kgPerThousand(weightG, runnerPerPieceG, scrapPct) {
  return (Math.max(0, weightG) + Math.max(0, runnerPerPieceG)) / 1000
    * 1000 * (1 + clamp(num(scrapPct), 0, 100) / 100);
}

/* ------------------------------------------------------------------ 格式化 */
export function fmt(v, digits = 2) {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtG(v) {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return fmt(v / 1000, 2) + " kg";
  return fmt(v, v < 10 ? 2 : 1) + " g";
}

/** 把 query 里的参数读成初值，方便分享链接（?v=120&m=ABS）。 */
export function param(name, dflt) {
  try {
    const m = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    if (m) return decodeURIComponent(m[1]);
  } catch (e) {}
  return dflt;
}

/** 把当前输入写回地址栏（不产生历史记录），分享出去对方看到同样的数。 */
export function syncUrl(obj) {
  try {
    const q = Object.keys(obj)
      .filter(k => obj[k] !== "" && obj[k] != null)
      .map(k => k + "=" + encodeURIComponent(obj[k]))
      .join("&");
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  } catch (e) {}
}

/** 给 input 绑 input+change 双事件（数字框在部分浏览器只在 change 触发）。 */
export function on(input, fn) {
  if (!input) return;
  input.addEventListener("input", fn);
  input.addEventListener("change", fn);
}
