/* ==========================================================================
   产品成本核算工具 · 落地页双语（中文 / English）
   --------------------------------------------------------------------------
   设计要点：
   1) 不改 HTML 结构 —— 用「中文原文」当 key 去匹配文本节点与属性，
      与桌面版 app/i18n.py 的思路一致。切回中文时把原文写回去。
   2) 必须在 app.js 之前加载：app.js 的滚动叙事从 DOM 读数字，
      语言要先落定，动画才按当前语言的版面算触发点。
   3) 数字、data-*、data-count 一律不动 —— 动画读的是这些。
   4) 只有内部含 <b>/<em>/<span> 的少数元素用 data-i18n-html 覆盖 innerHTML。
   ========================================================================== */

(function (global) {
  "use strict";

  var STORE_KEY = "pc_lang";

  /* ------------------------------------------------------------------ 文本 */
  /* key = HTML 里的中文原文（空白已折叠成单个空格）；值 = 英文 */
  var TEXT = {
    "产品成本核算工具 · 导入 STEP，把一件货的钱拆成 14 行算出厂价":
      "Product Cost Calculator — drop in a STEP, get 14 cost lines and an ex-works price",
    "产品成本核算工具": "Product Cost Calculator",

    "拆解": "Breakdown",
    "占比": "Share",
    "谁该用": "Who it's for",
    "阶梯报价": "Tier pricing",
    "模具与包材": "Mold & packaging",
    "渠道": "Channels",
    "价格": "Pricing",
    "下载试用": "Download trial",

    "导入 STEP → 自动拆件 → 算出厂价 · 甲方内部核价 · Windows 桌面版":
      "STEP in → parts split → ex-works price · Buyer-side costing · Windows",
    "元 / 件 · 出厂价（不含税）": "¥ / pc · Ex-works, excl. VAT",
    "一个 STEP 文件进去，体积、克重、材料费、机台费、人工、模具摊销、外购件、包材一路摊到单件成本， 再加上毛利，出厂价就出来了。每一分钱都能点开看它怎么来的。":
      "One STEP file goes in: volume, weight, material, machine time, labor, mold amortization, purchased parts and packaging all roll into a unit cost — add margin and you have the ex-works price. Every cent opens up to show where it came from.",
    "下载桌面版 · 免费试用 30 天": "Download for Windows · 30-day free trial",
    "或先试网页版（只算塑料件材料费，免安装）":
      "Or try the web version first (plastics material only, no install)",
    "399 元 / 台 · 一次买断": "US$59.9 / seat · one-time purchase (≈ ¥399)",
    "下载 87 MB": "87 MB download",
    "离线可用": "Works offline",
    "一机一码": "One machine, one code",

    "材料费": "Material",
    "外购件": "Purchased parts",
    "模具摊销": "Mold amortization",
    "单件成本": "Unit cost",
    "毛利": "Margin",
    "往下看：这 14 行是怎么加出来的": "Keep scrolling: where these 14 lines come from",

    "01 / 拆开看": "01 / Broken down",
    "14 行里有 6 行，多数报价表根本没这一栏":
      "Six of these 14 lines are missing from most quotes",
    "单件成本 · 14 行相加": "Unit cost · sum of 14 lines",
    "科目": "Item",
    "元 / 件": "¥ / pc",
    "管理费用": "Overhead",
    "模具分摊": "Mold amortized",
    "物流": "Logistics",
    "成型加工": "Molding",
    "资金占用": "Capital cost",
    "装配人工": "Assembly labor",
    "这件货用不上 · 6 项": "Not used on this part · 6 items",
    "模内五金": "In-mold hardware",
    "包装": "Packaging",
    "二次加工": "Secondary ops",
    "不良品摊销": "Scrap allowance",
    "销售佣金": "Sales commission",
    "出口费用": "Export costs",
    "毛利 20.0%": "Margin 20.0%",
    "出厂价（不含税）": "Ex-works price (excl. VAT)",
    "含税价 13%": "Incl. VAT 13%",
    "数据来自软件内置示例：ABS 外壳上盖，42 cm³ / 44.1 g，模穴 2，订单 50,000 件。 灰色 6 行是这件货这次没用上的科目（不填就是 0），启用后自动加进来——所以是 14 行，不是 8 行。 这 14 行里，模具摊销、不良品摊销、资金占用这几栏，Excel 里通常根本不设。":
      "Data from the built-in example: ABS housing top cover, 42 cm³ / 44.1 g, 2 cavities, 50,000 pcs order. The six grey lines are items this part didn't use (blank = 0); switch them on and they join the total — which is why it's 14 lines, not 8. Mold amortization, scrap allowance and capital cost are exactly the columns a typical spreadsheet leaves out.",

    "02 / 一个反直觉的数字": "02 / A counter-intuitive number",
    "塑料件总共只占 7.1%，剩下 92.9% 在别处":
      "The plastic part is only 7.1% — the other 92.9% sits elsewhere",
    "塑料件页：拖入 STEP 后自动出体积、克重、材料费、机台费，右侧是 14 行成本构成":
      "Plastic parts page: drop a STEP in and volume, weight, material and machine cost appear, with the 14-line breakdown on the right",
    "元/件": "¥ / pc",
    "这个塑料件的单件合计，占整件成本 7.1%":
      "This part's unit total — 7.1% of the whole unit cost",
    "外购件（五金、电子）占 79.3%，这才是报价主体的风险点":
      "Purchased parts (hardware, electronics) are 79.3% — that's where the quote risk lives",
    "模具费按订单量摊销；订单一变，这个数立刻跟着变":
      "Mold cost is amortized by order quantity — change the order and this moves",

    "03 / 先对齐一件事": "03 / One thing to settle first",
    "谁该用，谁别用": "Who should use it — and who shouldn't",
    "适合": "Good fit",
    "甲方采购、产品经理、硬件创业团队，要判断供应商报价合不合理":
      "Buyers, product managers and hardware startups judging whether a supplier's quote is fair",
    "立项前要估 BOM 成本，手上只有模型和一张外购件清单":
      "Estimating BOM cost before kickoff with only a model and a purchased-parts list",
    "要一次性出多档数量的价格表，而不是每次重敲一遍 Excel":
      "Producing a multi-quantity price table in one pass instead of retyping Excel",
    "出口或做电商，想知道扣完平台费用还剩多少净利":
      "Selling cross-border or on marketplaces and needing the net after platform fees",
    "不适合": "Not a fit",
    "模具厂对外报价——这里模具费只是一个摊销项，不是报价主体":
      "Mold shops quoting their own customers — here mold cost is one amortized line",
    "排产、排机、管车间——它不做 ERP 的活":
      "Scheduling, machine planning, shop-floor control — it isn't an ERP",
    "纯外观比价，不上量、不算模具":
      "Pure appearance shopping with no volume and no mold",
    "30 天": "30 days",
    "免费试用，功能不阉割": "Free trial, full features",
    "到期": "After trial",
    "变只读预览：能看不给改，也不给导出":
        "Becomes a read-only preview: viewable, but no edits or exports",
    "离线": "Offline",
    "一机一码激活，除材料行情与汇率外不联网":
      "One machine, one code; online only for material prices and FX",
    "本地": "Local",
    "报价存成文件放自己电脑，不上传": "Quotes stay as files on your own PC — nothing uploaded",

    "04 / 阶梯报价": "04 / Tier pricing",
    "填 5 档数量，材料单价与毛利率自动重算":
      "Enter 5 quantities — material price and margin recalculate themselves",
    "你只填数量档位。用料总重量越大，材料单价自动往下调（备注列写明相对基准价涨跌几个点）， 外购件折扣和毛利率也跟着数量走——不用自己拍脑袋定系数，改一个数量，整张表重算。":
      "You fill in quantities only. The more total material weight, the lower the material unit price (the note shows the delta against the base price), and the purchased-parts discount and margin follow the quantity too — no coefficients to guess. Change one quantity and the whole table recomputes.",
    "数量（件）": "Quantity (pcs)",
    "材料单价变动": "Material unit price",
    "出厂价": "Ex-works price",
    "降幅": "Reduction",
    "材料单价 +8.0% → −0.9%，用料总重 46.3 kg → 4,630.50 kg。降幅里含模具费被摊薄的部分， 不是单纯砍材料钱。同是 5 万件：首屏 14.361 元是主报价页口径（模具费按实际批量单列）， 这里 14.395 元是阶梯页口径（模具费摊进单价），差 0.034 元，两边都算给你看。":
      "Material unit price +8.0% → −0.9%, total material weight 46.3 kg → 4,630.50 kg. The reduction includes the mold being spread thinner, not just cheaper material. At 50,000 pcs the hero's 14.361 is the main quote page (mold billed separately), while 14.395 here is the tier page (mold folded into the unit price) — a 0.034 gap, shown both ways.",
    "阶梯报价页：只有「数量」一列可以改，其余 11 列都是算出来的":
      "Tier pricing page: only the quantity column is editable — the other 11 are computed",

    "05 / 模具与包材": "05 / Mold & packaging",
    "一套模多少钱，一箱货多少材积": "What a mold costs, what a carton measures",
    "按投影面积和腔数估模具费，拼模排布后把模具费摊进单件；内盒外箱按模型外形自动算尺寸和克重。 报价单里不再漏掉包材，也不再凭记忆填模具价。":
      "Estimate mold cost from projected area and cavity count, lay the parts out in the mold and amortize it into the unit price; inner box and carton are sized and weighed from the model's shape. Packaging stops being forgotten and mold prices stop being recalled from memory.",
    "模具方案页：投影面积、腔数、抛光与寿命要求，生成后一键写入报价":
      "Mold plan page: projected area, cavity count, polish and tool-life requirements — write it into the quote in one click",
    "万元": "k ¥",
    "单腔钢模 1.8–3.5 万，2 腔约 2.2 倍；同样一套模摊到 5,000 件是 9.7 元/件，10 万件降到 0.48 元/件":
      "A single-cavity steel mold runs ¥18k–35k; two cavities is about 2.2×. The same mold is ¥9.7/pc over 5,000 pcs and ¥0.48/pc over 100,000.",
    "腔": "cavities",
    "塑料件表、①表、模具费三处腔数联动，改一处其余同步；腔数一变，机台费和人工费跟着摊薄":
      "Cavity count is linked across the parts table, table ① and the mold cost — edit one and the rest follow; more cavities spread machine and labor cost thinner",
    "内盒 + 外箱": "Inner box + carton",
    "按成品外形自动推尺寸与克重，公式取自实际包材报价单，不再漏掉包材这一笔":
      "Sizes and weights come from the finished part's shape using formulas from real packaging quotes — no more missing packaging line",

    "06 / 卖出去之后": "06 / After it sells",
    "出厂价 14.36 元，在 Amazon 该标 87.30 元":
      "Ships at ¥14.36 — list it at ¥87.30 on Amazon",
    "还是上面那件货（出厂价 14.36 元）。软件内置 10 个平台，这里举 3 个最典型的： 佣金、支付、推广、达人、尾程、仓储、退货、关税逐项扣完，反推保本价和目标价； 跨境渠道按当地币种标价，汇率自动更新。":
      "Same product as above (ex-works ¥14.36). The app ships with 10 platforms; here are the 3 most typical: commission, payment, ads, creator fees, last mile, storage, returns and duty are deducted line by line to back-solve the break-even and target price. Cross-border channels price in local currency with auto-updated FX.",
    "淘宝 / 天猫": "Taobao / Tmall",
    "净利率 20.0% · 保本价 21.40": "20.0% net · break-even ¥21.40",
    "Amazon（美国 FBA）": "Amazon (US FBA)",
    "→ 87.30 元": "→ ¥87.30",
    "净利 17.46 · ROI 152% · 保本 62.57": "Net ¥17.46 · ROI 152% · break-even ¥62.57",
    "抖音电商": "Douyin Shop",
    "净利率 20.0% · 保本价 31.65": "20.0% net · break-even ¥31.65",
    "1 外币折人民币": "1 unit of FX in CNY",
    "2026-11-09 更新": "Updated 2026-11-09",
    "渠道成本页：三个平台同表对比，底部一行写出这个渠道的账是怎么拆的":
      "Channel cost page: three platforms side by side, with a line underneath showing how that channel's numbers break down",

    "07 / 价格与下载": "07 / Price & download",
    "现在就能算第一件货": "Cost your first product today",
    "30 天免费试用，功能全开。到期后变成只读预览：报价照常算给你看，但导入模型、改参数、导出 Excel / PDF 都要激活。":
        "30-day free trial with everything unlocked. After it ends the app becomes a read-only preview: the quote is still calculated, but importing models, editing values and exporting Excel / PDF all require activation.",
    "一次买断 · 含 1 年更新 · 一机一码":
      "One-time purchase · 1 year of updates · one machine, one code",
    "一台电脑一个授权；换电脑重新发码，不额外收费":
      "One license per PC; move to another machine and we reissue the code free",
    "多台按台数算，10 台以上可以谈": "Priced per seat; volume pricing from 10 seats up",
    "立即购买（邮件下单）": "Buy now (order by email)",
    "先下载试用 30 天 · 87 MB": "Download the 30-day trial · 87 MB",
    "解压即用，不用安装。程序没有买代码签名证书，首次运行 Windows 可能弹 「Windows 已保护你的电脑」——点「更多信息 → 仍要运行」即可，这是未签名程序的正常提示。":
      "Unzip and run — no installer. The app carries no code-signing certificate, so Windows may show “Windows protected your PC” on first launch: click “More info → Run anyway”. That's normal for unsigned software.",
    "发票": "Invoice",
    "可开电子普票或 13% 专票，邮件里注明抬头与税号即可":
      "E-invoice available, standard or 13% VAT special — just include the title and tax ID",
    "退款": "Refund",
    "先试后买：30 天试用期内功能全开，试过再决定。付款后未发码前可随时全额退；激活码一经发出不退——电子码无法回收，我方也无法核实是否已使用。重复付款或码无法激活，换码或全额退款。":
      "Try before you buy — the 30-day trial is fully functional. Full refund any time before we issue your activation code. Once the code is issued we cannot refund it: an e-code cannot be recalled, and we have no way to verify whether it has been used. Duplicate payment or a code that will not activate: we reissue it or refund in full.",
    "授权范围": "License",
    "一机一码，可用于你自己的商业项目与对客户的报价；不可转售、不可拆包分发":
      "One machine, one code. Use it on your own projects and customer quotes; no resale or repackaging.",
    "购买 · 发码 · 下载出问题": "Buying · codes · downloads",
    "已经装了，想问怎么用": "Already installed, need help using it",
    "点软件右下角「功能说明」，图文步骤都在里面":
      "Click the feature guide at the bottom right of the app — the illustrated steps are all there",
    "口径说明（省得后面对不上账）": "Definitions (so the numbers reconcile)",
    "成本口径：不含税成本 + 毛利 = 出厂价（不含税）；含税价按 13% 增值税另算，不重复加税。":
      "Cost basis: ex-VAT cost + margin = ex-works price (ex-VAT); the VAT-inclusive price adds 13% separately, never twice.",
    "材料价：内置默认价可以手动改；「材料行情」联网取自生意社公开报价，抓不到时保留上次价格并标注日期。":
      "Material prices: built-in defaults are editable; the market lookup pulls public quotes online and keeps the last price with its date when unavailable.",
    "汇率：取自 open.er-api.com 的公开中间价，软件和本页都显示更新日期；实际结汇以银行牌价为准。":
      "FX: public mid-rates from open.er-api.com, with the update date shown in both the app and this page; settlement follows your bank's rate.",
    "本页所有数字来自软件内置示例，可以自己复算；真实报价请用自己的 BOM 与供应商价格。":
      "Every number here comes from the app's built-in example and can be recomputed; for real quotes use your own BOM and supplier prices.",

    "隐私政策": "Privacy",
    "网页版": "Web version",
    "邮箱": "Email",
    "页面上的数字都来自软件内置示例，可以直接复算 · 联系 871756851@qq.com":
      "Every number here comes from the app's built-in example and can be recomputed · 871756851@qq.com"
  };

  /* --------------------------------------------------------------- 属性值 */
  var ATTR = {
    "页面导航": "Page navigation",
    "展开导航": "Open menu",
    "收起导航": "Close menu",
    "成本构成摘要": "Cost summary",
    "成本构成明细": "Cost breakdown",
    "阶梯报价示例": "Tier pricing example",
    "实时汇率": "Live FX rates",
    "购买流程": "How to buy",
    "语言切换": "Switch language",
    "把 STEP 拖进窗口，材料费、机台费、人工、模具摊销、外购件、包材、渠道佣金一路算到出厂价。阶梯报价自动折扣、模具费摊销、实时汇率折算。Windows 桌面版，免费试用 30 天。":
      "Drop a STEP in and material, machine time, labor, mold amortization, purchased parts, packaging and channel fees all roll into an ex-works price. Automatic tier pricing, mold amortization and live FX. Windows desktop, 30-day free trial.",
    "产品成本核算工具 · 导入 STEP，把一件货的钱拆成 14 行算出厂价":
      "Product Cost Calculator — drop in a STEP, get 14 cost lines and an ex-works price",
    "甲方内部核价工具：STEP → 单件成本 → 出厂价，每一分钱都能点开看它怎么来的。":
      "A buyer-side costing tool: STEP → unit cost → ex-works price. Every cent opens up to show where it came from.",
    "产品成本核算工具 v10.2 塑料件页：零件表与右侧 14 行成本构成、出厂价 14.361 元":      "Product Cost Calculator v10.2, plastic parts page: parts table and the 14-line cost breakdown showing an ex-works price of ¥14.361",
    "阶梯报价页：五档数量自动算出材料折扣、单件成本与出厂价":
      "Tier pricing page: five quantities with auto-computed material discount, unit cost and ex-works price",
    "模具方案页：零件投影面积 26.6 cm²、腔数 2、模具工艺要求":
      "Mold plan page: projected area 26.6 cm², 2 cavities, mold process requirements",
    "渠道成本页：三个平台逐项扣费后的净利、保本价与目标价，底部有逐项拆账":
      "Channel cost page: net profit, break-even and target price per platform after line-by-line fees, with the breakdown underneath"
  };

  /* ------------------------------------ 含内联标签的元素：整段 innerHTML 覆盖 */
  var HTML = {
    "hero-h1-1": "Drop in a STEP file,",
    "hero-h1-2": "and it splits into <em>14</em> lines.",
    "insight-lead":
      "In this product the plastic part's money comes in three pieces: material 0.525 + molding 0.233 + assembly 0.058 = <b>¥0.816</b>, or 7.1% of the whole unit cost. Purchased parts alone are 9.106, or 79.3%. That's why a material-only quote sheet never reconciles — the real weight sits in hardware, electronics and packaging.",
    "price-num": "US$59.9<span> / seat</span>",
    "mold-num-1": "18–35<span>k ¥</span>",
    "get-alt":
      "Only need the plastics material cost? The <a href=\"./web/index.html\">free web version</a> runs in your browser — no install.",
    "buy-s1": "Email us at the address below with the <b>number of seats</b> and the <b>invoice title</b>",
    "buy-s2":
      "You get payment options (WeChat / Alipay / bank transfer) — send the receipt once paid",
    "buy-s3":
      "Install the app, click “Trial 30 days” at the bottom right, then “Copy” to grab the <b>machine code</b>",
    "buy-s4":
      "After payment you get a voucher — open the <a href=\"https://product-cost-calculator.pages.dev/claim\">claim page</a>, enter voucher + machine code, and the 16-character activation code shows up on the spot; the e-invoice goes out the same day",
    "price-li-offline":
      "Offline activation, no internet check — after payment you receive a voucher; enter it plus your machine code on the <a href=\"https://product-cost-calculator.pages.dev/claim\">claim page</a> and the activation code appears on the spot."
  };

  var CJK = /[\u3400-\u9fff\uff08\uff09\u3001\u3002\uff0c\uff1a\uff1b\u201c\u201d\u300c\u300d\uff01\uff1f]/;
  var ATTRS = ["alt", "aria-label", "title", "content", "placeholder"];

  var _lang = "zh";
  var _nodes = [];   // {node, zh, en}
  var _els = [];     // {el, zhHtml, key}
  var _attrs = [];   // {el, name, zh, en}
  var _title = null; // {zh, en}

  function norm(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  /* ------------------------------------------------------------ 采集原文 */
  function collect(root) {
    // 先收 data-i18n-html 元素
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-html");
      if (HTML[k]) _els.push({ el: el, zh: el.innerHTML, en: HTML[k] });
    });
    var skip = new Set();
    _els.forEach(function (o) { skip.add(o.el); });

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName ? p.nodeName.toLowerCase() : "";
        if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
        if (skip.has(p)) return NodeFilter.FILTER_REJECT;
        return CJK.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var key = norm(n.nodeValue);
      if (!key) continue;
      var en = TEXT[key];
      if (!en) continue;
      _nodes.push({ node: n, zh: n.nodeValue, en: en });
    }

    root.querySelectorAll("*").forEach(function (el) {
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (!v || !CJK.test(v)) return;
        var en = ATTR[norm(v)];
        if (!en) return;
        _attrs.push({ el: el, name: a, zh: v, en: en });
      });
    });

    var t = norm(document.title);
    var enTitle = ATTR[t] || TEXT[t];
    _title = { zh: document.title, en: enTitle || null };

    // 版本号：写死在 HTML 里，字典抓不到，这里统一覆盖
    root.querySelectorAll(".nav-ver, .foot-brand span").forEach(function (el) {
      el.textContent = "v10.2";
    });
  }

  /* -------------------------------------------------------------- 应用语言 */
  function pad(orig, core) {
    var lead = (orig.match(/^\s*/) || [""])[0];
    var trail = (orig.match(/\s*$/) || [""])[0];
    return lead + core + trail;
  }

  function apply(lang) {
    _lang = lang === "en" ? "en" : "zh";
    var en = _lang === "en";
    var root = document.documentElement;
    root.setAttribute("data-lang", _lang);
    root.setAttribute("lang", en ? "en" : "zh-CN");

    _nodes.forEach(function (o) {
      o.node.nodeValue = pad(o.zh, en ? o.en : norm(o.zh));
    });
    _els.forEach(function (o) {
      o.el.innerHTML = en ? o.en : o.zh;
    });
    _attrs.forEach(function (o) {
      o.el.setAttribute(o.name, en ? o.en : o.zh);
    });
    if (_title && _title.en) document.title = en ? _title.en : _title.zh;

    // 截图有两套（中文界面 / 英文界面），按语言换图
    document.querySelectorAll("[data-src-zh]").forEach(function (im) {
      var want = en ? im.getAttribute("data-src-en") : im.getAttribute("data-src-zh");
      if (want && im.getAttribute("src") !== want) im.setAttribute("src", want);
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      var on = b.getAttribute("data-lang-btn") === _lang;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-on", on);
    });

    // 汉堡 aria-label 由 app.js 在展开/收起时改写，这里同步一次当前值
    var burger = document.querySelector(".nav-burger");
    var toggle = document.getElementById("nav-toggle");
    if (burger && toggle) {
      var k = toggle.checked ? "收起导航" : "展开导航";
      burger.setAttribute("aria-label", ATTR[k] ? (en ? ATTR[k] : k) : burger.getAttribute("aria-label"));
    }
  }

  /* --------------------------------------------------------------- 检测语言 */
  function detect() {
    try {
      var m = global.location.search.match(/[?&]lang=(zh|en)/i);
      if (m) return m[1].toLowerCase();
    } catch (e) {}
    try {
      var s = global.localStorage.getItem(STORE_KEY);
      if (s === "zh" || s === "en") return s;
    } catch (e) {}
    var nav = String(global.navigator.language || (global.navigator.languages || [])[0] || "").toLowerCase();
    if (nav.indexOf("zh") === 0) return "zh";
    if (nav) return "en";
    return "zh";
  }

  function set(lang) {
    var next = lang === "en" ? "en" : "zh";
    try { global.localStorage.setItem(STORE_KEY, next); } catch (e) {}
    if (next === _lang) return;
    apply(next);
    // 文案长度变了 → 版面高度变了 → 滚动触发点必须重算
    if (global.ScrollTrigger && global.ScrollTrigger.refresh) {
      try { global.ScrollTrigger.refresh(); } catch (e) {}
    }
    try { global.dispatchEvent(new CustomEvent("pc:lang", { detail: { lang: next } })); } catch (e) {}
  }

  function bind() {
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      if (b.__pcBound) return;
      b.__pcBound = true;
      b.addEventListener("click", function (e) {
        e.preventDefault();
        set(b.getAttribute("data-lang-btn"));
      });
    });
  }

  function boot() {
    collect(document.body);
    apply(detect());
    bind();
    // 文案已替换完，解除 <head> 里为防止闪中文加的遮挡
    document.documentElement.classList.remove("i18n-boot");
  }

  if (document.body) {
    // 放在 </body> 之前时同步执行：这样 app.js 拿到的就是当前语言的文本与版面
    boot();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.PCI18N = {
    set: set,
    apply: apply,
    current: function () { return _lang; },
    text: TEXT,
    attr: ATTR,
    html: HTML
  };
})(window);
