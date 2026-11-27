/* ==========================================================================
   产品成本核算工具 · 落地页动效
   库：GSAP + ScrollTrigger + Lenis（本地 vendor，无 CDN 依赖）
   两段滑动驱动叙事：
     ① 首屏景深——数字是主角，滚动推近，标题退成背景
     ② 14 行拆解——每根条随滚动长出来，数字跟着走
   其余区块：滑动触发、单向一次性、按内容出场
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- 工具 */

  // 数字滚到目标值：整数部分先到，小数位后到（高位先停、末位后停）
  function countUp(el, target, digits, dur) {
    var obj = { v: 0 };
    var fmt = function (n) {
      return n.toLocaleString("zh-CN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
    };
    return gsap.to(obj, {
      v: target,
      duration: dur || 1.2,
      ease: "power2.out",
      onUpdate: function () {
        el.textContent = fmt(obj.v);
      },
      onComplete: function () {
        el.textContent = fmt(target);
      }
    });
  }

  function splitNum(text) {
    var n = parseFloat(String(text).replace(/,/g, ""));
    var m = String(text).match(/\.(\d+)/);
    return { value: isNaN(n) ? 0 : n, digits: m ? m[1].length : 0 };
  }

  /* -------------------------------------------------- 没有 GSAP 时的兜底 */

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    document.documentElement.classList.add("no-motion");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------- 平滑滚动（Lenis） */

  var lenis = null;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  var navToggle = document.getElementById("nav-toggle");
  var navBurger = document.querySelector(".nav-burger");
  var NAV_OFFSET = 78; // 与 styles.css 的 scroll-margin-top: 78px 保持一致

  // 汉堡按钮的 aria-label 要跟着语言走（i18n.js 在后面加载的场景下用原文兜底）
  function burgerLabel(open) {
    var zh = open ? "收起导航" : "展开导航";
    var api = window.PCI18N;
    if (api && api.current() === "en" && api.attr[zh]) return api.attr[zh];
    return zh;
  }

  if (navToggle && navBurger) {
    navToggle.addEventListener("change", function () {
      navBurger.setAttribute("aria-label", burgerLabel(navToggle.checked));
    });
    window.addEventListener("pc:lang", function () {
      navBurger.setAttribute("aria-label", burgerLabel(navToggle.checked));
    });
  }

  // 锚点跳转走 Lenis，避免和 pin 打架
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      // 移动端点完菜单项要收起来，否则菜单盖住刚跳到的内容
      if (navToggle && navToggle.checked) {
        navToggle.checked = false;
        navBurger.setAttribute("aria-label", burgerLabel(false));
      }
      if (lenis) {
        lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.1 });
      } else {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET,
          behavior: reduced ? "auto" : "smooth"
        });
      }
    });
  });

  /* ----------------------------------------------------------- 导航吸顶状态 */

  var nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: "top -24",
    end: 99999,
    onToggle: function (self) {
      nav.classList.toggle("is-stuck", self.isActive);
    }
  });

  /* ======================================================================
     减少动态效果：一切直接到位，只保留数字的最终值
     ====================================================================== */

  if (reduced) {
    document.querySelectorAll(".hero-num, .bd-total-num, .tier-price, .fact-num").forEach(function (el) {
      // 保持原值不动
      el.style.opacity = 1;
    });
    document.querySelectorAll(".bd-row .bar i").forEach(function (i) {
      i.style.transform = "none";
    });
    // 这些元素在 CSS 里初值是隐藏的（等 GSAP 入场），reduced 分支不会跑入场动画，
    // 必须在这里手动亮出来，否则「减少动态效果」的用户永远看不到它们
    document.querySelectorAll(".hero-handoff, .hero-h1 .lw, .hero-eyebrow, .hero-lead, .hero-cta, .hero-meta").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  /* ======================================================================
     ① 首屏入场
     ====================================================================== */

  var heroNum = document.querySelector("[data-hero-num]");
  var heroLines = gsap.utils.toArray(".hero-h1 .lw");

  var intro = gsap.timeline({ delay: 0.15 });

  intro
    .from(".hero-eyebrow", { y: 12, opacity: 0, duration: 0.6, ease: "power2.out" })
    .from(
      heroLines,
      { yPercent: 108, duration: 0.95, stagger: 0.1, ease: "power3.out" },
      "-=0.35"
    )
    .from(
      [heroNum, ".hero-unit"],
      { y: 26, opacity: 0, duration: 0.9, ease: "power3.out" },
      "-=0.75"
    )
    .from(
      ".hero-lead",
      { y: 14, opacity: 0, duration: 0.7, ease: "power2.out" },
      "-=0.55"
    )
    .from(
      ".hero-cta .btn",
      { y: 12, opacity: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" },
      "-=0.45"
    )
    .from(
      ".hero-meta li",
      { opacity: 0, duration: 0.4, stagger: 0.04, ease: "none" },
      "-=0.35"
    );

  // 数字从 0 滚到 14.361（入场时先说清这一屏在讲什么）
  if (heroNum) {
    var hv = splitNum(heroNum.textContent);
    heroNum.textContent = (0).toLocaleString("zh-CN", {
      minimumFractionDigits: hv.digits,
      maximumFractionDigits: hv.digits
    });
    countUp(heroNum, hv.value, hv.digits, 1.9);
  }

  // 首屏成本摘要条：被数字带出
  gsap.from(".strip-item", {
    y: 16,
    opacity: 0,
    duration: 0.6,
    stagger: 0.06,
    ease: "power2.out",
    delay: 0.85
  });

  /* ======================================================================
     ② 首屏景深：固定舞台，滚动推近数字，标题退成背景
     滚动距离 130vh；主层缩放 1 → 1.24（≥15%）
     ====================================================================== */

  /* ======================================================================
     ② 首屏不做 pin。
     首屏是满版数字 + 一句话，真正的"主角变化"放在下一节：14 根条随滚动
     一根根长出来（见 ③）。这里只做一件事——滚出首屏时，数字轻轻退开，
     把视线交给下一节，不做整块推走。
     ====================================================================== */

  gsap.fromTo(
    heroNum,
    { yPercent: 0, opacity: 1 },
    {
      yPercent: 12,
      /* 淡到 0.55 就够了：再淡数字的对比度会掉到 3:1 以下，看着像渲染失败 */
      opacity: 0.55,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6
      }
    }
  );

  gsap.fromTo(
    ".hero-handoff",
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      ease: "none",
      duration: 1,
      scrollTrigger: { trigger: ".hero-strip", start: "bottom 92%" }
    }
  );

  /* ======================================================================
     ③ 14 行拆解：滚动驱动每一根条长出来
     这是页面中段的一镜到底：14 行从上到下依次被"填满"，
     数字在条停稳后才亮起，总和最后落到 11.489
     ====================================================================== */

  // 表头行（.bd-hrow）只作列名，不参与逐行填充
  var rows = gsap.utils.toArray(".bd-row").filter(function (r) {
    return !r.classList.contains("bd-hrow");
  });
  var totalEl = document.querySelector("[data-bd-total]");
  var running = { v: 0 };
  var rowVals = rows.map(function (row) {
    var num = row.querySelector("b");
    return num ? splitNum(num.textContent) : { value: 0, digits: 3 };
  });
  // 真实合计（不是各行四舍五入后的和）由 HTML 上的 data-bd-grand 给出，
  // 否则 14 行显示值相加会差 0.001（11.488 vs 11.489）
  var grandAttr = document.querySelector("[data-bd-grand]");
  var grand = grandAttr
    ? parseFloat(grandAttr.getAttribute("data-bd-grand"))
    : rowVals.reduce(function (s, r) { return s + r.value; }, 0);

  // HTML 里写的是真值 11.489（无 JS 也能读）；JS 接管后再归零随滚动滚上去
  if (totalEl) running.v = 0;

  function paintTotal() {
    if (!totalEl) return;
    totalEl.textContent = running.v.toLocaleString("zh-CN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });
  }
  paintTotal();

  var barTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".bd-stage",
      start: "top 82%",
      end: "bottom 62%",
      scrub: 0.6
    }
  });

  rows.forEach(function (row, i) {
    var bar = row.querySelector(".bar i");
    var num = row.querySelector("b");
    var parsed = rowVals[i];
    var target = num ? num.textContent : "";
    var at = i * 0.16;

    if (bar) {
      barTimeline.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "power1.out", duration: 0.5, immediateRender: false }, at);
    }

    if (num) {
      // 起始透明度不能太低：0.55 时中途对比度只有 2.9:1（灰行更差），0.8 兼顾「亮起来」和可读
      barTimeline.fromTo(num, { opacity: 0.8 }, { opacity: 1, ease: "none", duration: 0.3, immediateRender: false }, at + 0.2);

      // 单行数字自己滚，同时把累计值推进一分
      var obj = { v: 0 };
      barTimeline.to(
        obj,
        {
          v: parsed.value,
          duration: 0.5,
          ease: "power1.out",
          onUpdate: function () {
            num.textContent = obj.v.toLocaleString("zh-CN", {
              minimumFractionDigits: parsed.digits,
              maximumFractionDigits: parsed.digits
            });
          },
          onComplete: function () {
            num.textContent = target;
          }
        },
        at
      );

      var from = rowVals.slice(0, i).reduce(function (s, r) { return s + r.value; }, 0);
      // 最后一行直接落到真实合计，避免"各行显示值相加 = 11.488"与"合计 11.489"差 0.001
      var to = i === rows.length - 1 ? grand : from + parsed.value;
      barTimeline.to(
        running,
        {
          v: to,
          duration: 0.5,
          ease: "power1.out",
          onUpdate: paintTotal
        },
        at
      );
    }
  });

  // 全部加完，合计落定为真实总和（不是各行四舍五入后的和）
  barTimeline.to(running, {
    v: grand,
    duration: 0.4,
    ease: "power1.out",
    onUpdate: paintTotal
  });

  // 底部合计：条全部长完之后才落定
  gsap.from(".bd-sum-row", {
    opacity: 0,
    y: 12,
    duration: 0.55,
    stagger: 0.09,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".bd-sum",
      start: "top bottom"
    }
  });

  /* ======================================================================
     价格卡 / 联系方式 / 口径说明
     ====================================================================== */

  gsap.from(".price-card", {
    y: 22,
    opacity: 0,
    duration: 0.7,
    ease: "power2.out",
    scrollTrigger: { trigger: ".price-card", start: "top bottom" }
  });

  gsap.from(".contact-row, .disclaimer", {
    y: 14,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: { trigger: ".contact-row", start: "top bottom" }
  });

  /* ======================================================================
     ④ 区块出场（滑动触发、单向一次性）
     ====================================================================== */

  /* 大标题：按行从遮罩里升起 */
  gsap.utils.toArray(".band .h2").forEach(function (h) {
    gsap.from(h, {
      y: 22,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: h, start: "top bottom" }
    });
  });

  gsap.utils.toArray(".band .kicker, .band .lead, .band .note").forEach(function (el) {
    gsap.from(el, {
      y: 14,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top bottom" }
    });
  });

  /* 截图：遮罩从主体方向揭开，同时从 1.06 回缩到 1 */
  gsap.utils.toArray(".shot-wipe").forEach(function (fig) {
    var img = fig.querySelector("img");
    gsap.fromTo(
      fig,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 1.0,
        ease: "power3.inOut",
        scrollTrigger: { trigger: fig, start: "top bottom" }
      }
    );
    if (img) {
      gsap.fromTo(
        img,
        { scale: 1.06 },
        {
          scale: 1,
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: { trigger: fig, start: "top bottom" }
        }
      );
    }
    gsap.from(fig.querySelector("figcaption"), {
      opacity: 0,
      y: 8,
      duration: 0.5,
      delay: 0.35,
      scrollTrigger: { trigger: fig, start: "top bottom" }
    });
  });

  /* 数据事实：数字滚到目标值，然后是说明 */
  gsap.utils.toArray(".fact").forEach(function (fact) {
    var numEl = fact.querySelector(".fact-num");
    var txt = numEl ? numEl.firstChild : null;
    gsap.from(fact, {
      x: -14,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: fact, start: "top bottom" }
    });
    if (numEl && txt && txt.nodeType === 3) {
      var raw = txt.textContent.trim();
      var p = splitNum(raw);
      if (p.value > 0) {
        ScrollTrigger.create({
          trigger: numEl,
          start: "top bottom",
          once: true,
          onEnter: function () {
            var probe = { v: 0 };
            txt.textContent = "0" + (p.digits ? "." + "0".repeat(p.digits) : "");
            gsap.to(probe, {
              v: p.value,
              duration: 1.1,
              ease: "power2.out",
              onUpdate: function () {
                txt.textContent = probe.v.toLocaleString("zh-CN", {
                  minimumFractionDigits: p.digits,
                  maximumFractionDigits: p.digits
                });
              },
              onComplete: function () {
                txt.textContent = raw;
              }
            });
          }
        });
      }
    }
  });

  /* 阶梯报价：沿阅读方向依次展开（表格是列表，逐行落位） */
  gsap.from(".tier-row", {
    opacity: 0,
    y: 14,
    duration: 0.5,
    stagger: 0.07,
    ease: "power2.out",
    scrollTrigger: { trigger: ".tier-table", start: "top bottom" }
  });

  /* 阶梯价数字：滚到目标值 */
  gsap.utils.toArray(".tier-price").forEach(function (el) {
    var p = splitNum(el.dataset.count || el.textContent);
    var target = el.textContent;
    ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      once: true,
      onEnter: function () {
        countUp(el, p.value, 3, 1.1);
        el.textContent = el.textContent; // 由 countUp 接管
      }
    });
    el.textContent = target;
  });

  /* 渠道卡片：带重量落下后稳住，后一张被前一张带出 */
  gsap.from(".chen-card", {
    y: -34,
    opacity: 0,
    duration: 0.72,
    stagger: 0.09,
    ease: "back.out(1.25)",
    scrollTrigger: { trigger: ".chen-row", start: "top bottom" }
  });

  gsap.from(".fx-strip > *", {
    opacity: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: "none",
    scrollTrigger: { trigger: ".fx-strip", start: "top bottom" }
  });

  /* 适合谁：列表沿阅读方向展开，分隔线先画出 */
  gsap.utils.toArray(".scope-col").forEach(function (col) {
    var items = col.querySelectorAll(".scope-list li");
    gsap.from(items, {
      opacity: 0,
      x: -10,
      duration: 0.45,
      stagger: 0.06,
      ease: "power2.out",
      scrollTrigger: { trigger: col, start: "top bottom" }
    });
  });

  gsap.from(".trust", {
    opacity: 0,
    y: 12,
    duration: 0.5,
    stagger: 0.07,
    ease: "power2.out",
    scrollTrigger: { trigger: ".trust-row", start: "top bottom" }
  });

  /* CTA */
  gsap.from(".get-h", {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: ".wrap-get", start: "top bottom" }
  });
  gsap.from([".get-lead", ".get-cta .btn", ".get-note"], {
    y: 14,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: { trigger: ".wrap-get", start: "top bottom" }
  });

  /* ---------------------------------------------------------------- 收尾 */

  // 字体加载完再算一次，避免中文回退字体造成的位置偏差
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();

/* ------------------------------------------------------------ 页脚复制链接 */
(function () {
  var btn = document.getElementById("copy-link");
  if (!btn) return;
  var url = "https://product-cost-calculator.pages.dev/";
  var label = btn.textContent;

  function done(ok) {
    btn.textContent = ok ? "已复制" : "复制失败，请手动选中地址栏";
    btn.classList.toggle("done", ok);
    setTimeout(function () {
      btn.textContent = label;
      btn.classList.remove("done");
    }, 1800);
  }

  btn.addEventListener("click", function () {
    // navigator.clipboard 只在安全上下文可用；file:// 或 http 预览会失败，退回 execCommand
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    done(ok);
  });
})();
