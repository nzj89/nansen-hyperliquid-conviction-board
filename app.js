const state = {
  dashboard: null,
  filters: {
    query: "",
    side: "all",
    sort: "signal",
    minConfluence: 3
  }
};

function fmtUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function fmtPct(value) {
  return `${((value || 0) * 100).toFixed(0)}%`;
}

function fmtSignedPct(value, digits = 0) {
  const numeric = (value || 0) * 100;
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(digits)}%`;
}

function fmtDays(value) {
  return `${(value || 0).toFixed(1)}d`;
}

function fmtDate(value) {
  if (!value) return "n/a";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function explorerUrl(address, mode = "hyperliquid") {
  if (mode === "debank") return `https://debank.com/profile/${address}`;
  return `https://app.hyperliquid.xyz/explorer/address/${address}`;
}

function walletToolsHtml(address) {
  return `
    <div class="wallet-tools">
      <code class="wallet-address">${address}</code>
      <button class="mini-button" type="button" data-copy-text="${address}">Copy</button>
      <a class="mini-link" href="${explorerUrl(address)}" target="_blank" rel="noreferrer">Hyperliquid</a>
      <a class="mini-link" href="${explorerUrl(address, "debank")}" target="_blank" rel="noreferrer">DeBank</a>
    </div>
  `;
}

function trendToneClass(label = "") {
  return label
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/gi, "")
    .toLowerCase();
}

function trendBarsHtml(values, tone = "holding") {
  const numeric = (values || []).filter((value) => Number.isFinite(value));
  if (!numeric.length) return '<span class="trend-empty">No trend</span>';
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const spread = max - min || 1;
  return `
    <span class="trend-bars tone-${trendToneClass(tone)}" aria-hidden="true">
      ${numeric
        .map((value) => {
          const height = 28 + Math.round(((value - min) / spread) * 72);
          return `<span style="height:${height}%"></span>`;
        })
        .join("")}
    </span>
  `;
}

function statItem(label, value, accent = false) {
  const item = document.createElement("div");
  item.className = `stat ${accent ? "stat-accent" : ""}`;
  item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return item;
}

function getTrader(address) {
  return state.dashboard?.traders?.find((trader) => trader.address === address) || null;
}

function getTrade(key) {
  return state.dashboard?.interestingTrades?.find((trade) => trade.key === key) || null;
}

function getOpportunity(key) {
  return state.dashboard?.opportunities?.find((item) => item.key === key) || null;
}

function getRiskWarning(key) {
  return state.dashboard?.riskWarnings?.find((item) => item.key === key) || null;
}

function getTopRecommendationKeys() {
  return new Set((state.dashboard?.topRecommendations || []).map((item) => item.key));
}

function openDrawer({ eyebrow, title, html }) {
  const drawer = document.querySelector("#detail-drawer");
  drawer.hidden = false;
  document.querySelector("#drawer-eyebrow").textContent = eyebrow;
  document.querySelector("#drawer-title").textContent = title;
  document.querySelector("#drawer-content").innerHTML = html;
}

function closeDrawer() {
  document.querySelector("#detail-drawer").hidden = true;
}

function openOpportunityDrawer(item) {
  if (!item) return;
  const html = `
    <div class="drawer-grid">
      <div class="drawer-metrics">
        <div class="drawer-stat"><span>Setup</span><strong>${item.setupType}</strong></div>
        <div class="drawer-stat"><span>Action</span><strong>${item.actionBias}</strong></div>
        <div class="drawer-stat"><span>Score</span><strong>${item.score}</strong></div>
        <div class="drawer-stat"><span>Risk</span><strong>${item.riskTier}</strong></div>
        <div class="drawer-stat"><span>Entry Window</span><strong>${item.entryWindowLabel}</strong></div>
        <div class="drawer-stat"><span>Trend</span><strong>${item.trendLabel}</strong></div>
        <div class="drawer-stat"><span>Market</span><strong>${item.marketRegimeLabel}</strong></div>
        <div class="drawer-stat"><span>Market Support</span><strong>${item.marketSupportScore}</strong></div>
        <div class="drawer-stat"><span>Market Crowding</span><strong>${item.marketCrowdingRiskPct}%</strong></div>
        <div class="drawer-stat"><span>Same-Asset Edge</span><strong>${Math.round((item.symbolTrustedWinRateBlend || 0) * 100)}</strong></div>
        <div class="drawer-stat"><span>Same-Asset Evidence</span><strong>${item.symbolEvidenceCount}</strong></div>
        <div class="drawer-stat"><span>Hold Window</span><strong>${item.targetHoldWindow}</strong></div>
        <div class="drawer-stat"><span>Recheck</span><strong>${item.nextCheckLabel}</strong></div>
        <div class="drawer-stat"><span>Live PnL</span><strong>${item.averageUnrealizedPnlPct >= 0 ? "+" : ""}${Math.round((item.averageUnrealizedPnlPct || 0) * 100)}%</strong></div>
        <div class="drawer-stat"><span>Exit Pressure</span><strong>${Math.round((item.exitPressurePct || 0) * 100)}%</strong></div>
        <div class="drawer-stat"><span>Fresh Adds 24H</span><strong>${item.recentAdds24hCount}</strong></div>
        <div class="drawer-stat"><span>Fresh Risk Share</span><strong>${item.recentAddRiskSharePct}%</strong></div>
      </div>
      <div class="drawer-block">
        <h3>Why It Matters</h3>
        <p>${item.why}</p>
        <p><strong>Entry plan:</strong> ${item.entryPlan}</p>
        <p><strong>Invalidation:</strong> ${item.invalidationHint}</p>
        <p><strong>Trend:</strong> ${item.trendRead}</p>
        <p><strong>Timing:</strong> ${item.timingRead}</p>
        <p><strong>Duration:</strong> ${item.durationRead}</p>
        <p><strong>Same-asset read:</strong> ${item.sameAssetRead}</p>
        <p><strong>Market read:</strong> ${item.marketStateRead}</p>
        <p><strong>Live cluster read:</strong> ${item.positionStateRead}</p>
        <p><strong>Flow read:</strong> ${item.flowStateRead}</p>
        <p><a class="chart-link" href="${item.chartUrl}" target="_blank" rel="noreferrer">Open chart</a></p>
      </div>
      <div class="drawer-block">
        <h3>Setup Shape</h3>
        <p>Average trader hold: ${fmtDays(item.averageHoldDays)}. Average winning hold: ${fmtDays(item.averageWinningHoldDays)}.</p>
        <p>Lead position share: ${fmtPct(item.leadPositionShare)}. Underwater share: ${fmtPct(item.underwaterShare)}.</p>
        <p>One-shot share: ${fmtPct(item.oneShotShare)}. Average DCA per trader: ${item.dcaPerTrader.toFixed(1)}.</p>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Caution Flags</h3>
        <div class="badge-list">
          ${(item.cautionFlags || []).length
            ? item.cautionFlags.map((flag) => `<span class="badge">${flag}</span>`).join("")
            : '<span class="empty">No caution flags.</span>'}
        </div>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Open Live Cluster</h3>
        <div class="drawer-list">
          <button class="drawer-item drawer-item-button" data-trade-key="${item.key}">
            <div>
              <strong>${item.label}</strong>
              <span>Open the live trade cluster with participants and PnL states</span>
            </div>
            <div class="drawer-item-right">
              <span>${item.setupType}</span>
              <span>signal detail</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
  openDrawer({
    eyebrow: "Opportunity Detail",
    title: item.label,
    html
  });
  bindDrawerTradeButtons();
}

function renderSummary(summary, mode) {
  const summaryRoot = document.querySelector("#summary");
  summaryRoot.innerHTML = "";
  summaryRoot.append(
    statItem("Mode", mode === "live" ? "Live CLI" : "Sample", true),
    statItem("Filtered Traders", String(summary.topTraderCount), true),
    statItem("Interesting Trades", String(summary.interestingTradeCount)),
    statItem("Abnormal Setups", String(summary.abnormalTradeCount)),
    statItem("Strongest Signal", summary.strongestSignal || "None"),
    statItem("Top Opportunity", summary.topOpportunity || "None"),
    statItem("Tracked Risk", fmtUsd(summary.totalTrackedRiskUsd || 0)),
    statItem("Changes", String(summary.changeCount || 0)),
    statItem("New Signals", String(summary.newSignalCount || 0)),
    statItem("Crowded Risks", String(summary.crowdedRiskCount || 0)),
    statItem("Best Long", summary.bestLong || "None"),
    statItem("Suggested Risk", `${summary.suggestedRiskPct || 0}%`),
    statItem("Traders To Stalk", String(summary.stalkerCount || 0)),
    statItem("Market Mood", summary.marketMood || "mixed")
  );
}

function buildDeskSnapshot() {
  const dashboard = state.dashboard;
  if (!dashboard) return [];
  const topIdea = dashboard.topRecommendations?.[0];
  const topCapital = dashboard.capitalPlan?.topIdeas?.[0];
  const topWarning = dashboard.riskWarnings?.[0];
  const topTrader = dashboard.traderStalkBoard?.[0];

  return [
    topIdea
      ? {
          key: `snapshot-best-${topIdea.key}`,
          title: "Best Setup Right Now",
          label: topIdea.label,
          tone: "accent",
          summary: `${topIdea.verdict}. Alpha ${topIdea.alphaScore}, late risk ${topIdea.lateProbabilityPct}%, hold left ${topIdea.holdLeftDays}d.`,
          detail: `${topIdea.followWindowRead} ${topIdea.marketStateRead}`,
          targetType: "trade",
          targetKey: topIdea.key
        }
      : null,
    topCapital
      ? {
          key: `snapshot-capital-${topCapital.key}`,
          title: "Best Use Of Risk",
          label: topCapital.label,
          tone: "soft",
          summary: `${topCapital.planLabel}. Starter ${topCapital.starterRiskPct}% and max ${topCapital.maxRiskPct}%.`,
          detail: `${topCapital.reason}`,
          targetType: "opportunity",
          targetKey: topCapital.key
        }
      : null,
    topWarning
      ? {
          key: `snapshot-warning-${topWarning.key}`,
          title: "Main Thing To Avoid",
          label: topWarning.label,
          tone: "danger",
          summary: `${topWarning.warningType}. ${topWarning.action}.`,
          detail: `${topWarning.summary}`,
          targetType: "trade",
          targetKey: topWarning.key
        }
      : null,
    topTrader
      ? {
          key: `snapshot-trader-${topTrader.key}`,
          title: "Trader To Watch",
          label: topTrader.shortAddress,
          tone: "neutral",
          summary: `${topTrader.copyabilityScore} copyability. ${topTrader.stalkingReason}`,
          detail: `Focus: ${(topTrader.focusSymbols || []).join(", ") || "none"} | consistency ${topTrader.consistencyScore}`,
          targetType: "trader",
          targetKey: topTrader.address
        }
      : null
  ].filter(Boolean);
}

function renderDeskSnapshot(items) {
  const root = document.querySelector("#desk-snapshot-list");
  if (!root) return;
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No quick desk snapshot yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = `snapshot-card clickable-card snapshot-${item.tone || "neutral"}`;
    card.innerHTML = `
      <p class="watch-rank">${item.title}</p>
      <h3>${item.label}</h3>
      <p class="watch-reason">${item.summary}</p>
      <p class="watch-reason">${item.detail}</p>
    `;
    card.addEventListener("click", () => openPlaybookTarget(item));
    root.appendChild(card);
  }
}

function renderTopRecommendations(items) {
  const root = document.querySelector("#top-recommendation-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No top recommendations yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card alpha-card";
    const trendTone = trendToneClass(item.trendLabel);
    const recentExitHtml = (item.recentExitedTraders || []).length
      ? `
        <div class="participant-preview">
          ${(item.recentExitedTraders || []).map((exit) => `
            <div class="participant-preview-row">
              <div>
                <strong>${exit.shortAddress}</strong>
                <span>${fmtDate(exit.closedAt)}</span>
              </div>
              <span>${exit.realizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(exit.realizedPnlUsd)}</span>
            </div>
          `).join("")}
        </div>
      `
      : '<p class="watch-reason">No tracked exits yet. The current cluster is still broadly intact.</p>';
    card.innerHTML = `
      <p class="watch-rank">${item.verdict}</p>
      <h3>${item.label}</h3>
      <div class="badge-list">
        <span class="badge">${item.actionLabel}</span>
        <span class="badge badge-tone-${trendTone}">${item.trendLabel}</span>
        <span class="badge">${item.marketRegimeLabel}</span>
        <span class="badge">same-asset edge ${item.sameAssetEdgeScore}</span>
        <span class="badge">${item.freshAdds24hCount} adds / 24h</span>
        <span class="badge">exit pressure ${item.exitPressurePct}%</span>
      </div>
      <p class="watch-reason">${item.headline}</p>
      <div class="watch-stats">
        <span>alpha ${item.alphaScore}</span>
        <span>confidence ${item.clusterConfidenceScore}</span>
        <span>evidence ${item.clusterEvidenceCount}</span>
        <span>same-asset ${item.sameAssetEvidenceCount}</span>
        <span>trend ${item.trendScore}</span>
        <span>market ${item.marketSupportScore}</span>
        <span>crowding ${item.marketCrowdingRiskPct}%</span>
        <span>fresh risk ${item.recentAddRiskSharePct}%</span>
        <span>late risk ${item.lateProbabilityPct}%</span>
        <span>${fmtUsd(item.moneyAtRisk)}</span>
        <span>${item.clusterAgeDays}d live</span>
        <span>${item.holdLeftDays}d left</span>
        <span>live pnl ${item.livePnlPct}%</span>
        <span>${item.inProfitCount} green / ${item.underwaterCount} red</span>
      </div>
      <div class="trend-row">
        <div class="trend-card">
          <span class="trend-label">Signal trend</span>
          ${trendBarsHtml(item.signalSeries, item.trendLabel)}
        </div>
        <div class="trend-card">
          <span class="trend-label">Risk trend</span>
          ${trendBarsHtml(item.riskSeries, item.trendLabel)}
        </div>
        <div class="trend-card">
          <span class="trend-label">Confluence trend</span>
          ${trendBarsHtml(item.confluenceSeries, item.trendLabel)}
        </div>
      </div>
      <p class="watch-reason"><strong>${item.followWindowRead}</strong></p>
      <p class="watch-reason">${item.trendRead}</p>
      <p class="watch-reason">${item.summary}</p>
      <p class="watch-reason">${item.sameAssetRead}</p>
      <p class="watch-reason">${item.marketStateRead}</p>
      <p class="watch-reason">${item.flowStateRead}</p>
      <p class="watch-reason">${item.riskStateRead}</p>
      <p class="watch-reason">${item.positionStateRead}</p>
      <div class="participant-preview">
        ${item.topParticipants.map((participant) => `
          <div class="participant-preview-row">
            <div>
              <strong>${participant.shortAddress}</strong>
              <span>${participant.unrealizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(participant.unrealizedPnlUsd)} / ${fmtSignedPct(participant.unrealizedPnlPct)}</span>
            </div>
            <span>${fmtUsd(participant.positionValueUsd)} | ${participant.dcaCount} adds | edge ${Math.round((participant.symbolTrustedWinRate || 0) * 100)} on ${participant.symbolCampaignCount || 0}</span>
          </div>
        `).join("")}
      </div>
      ${recentExitHtml}
    `;
    card.addEventListener("click", () => openTradeDrawer(getTrade(item.key)));
    root.appendChild(card);
  }
}

function renderMarketPulse(items) {
  const root = document.querySelector("#market-pulse-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No screener-backed market context yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">${item.regimeLabel}</p>
      <h3>${item.label}</h3>
      <div class="watch-stats">
        <span>support ${item.supportScore}</span>
        <span>crowding ${item.crowdingRiskPct}%</span>
        <span>funding ${item.fundingRatePct == null ? "n/a" : `${item.fundingRatePct.toFixed(2)}%`}</span>
        <span>OI ${item.oiChange24hPct == null ? "n/a" : `${item.oiChange24hPct.toFixed(1)}%`}</span>
        <span>${fmtUsd(item.volume24hUsd || 0)} vol</span>
      </div>
      <p class="watch-reason">${item.read}</p>
      <a class="chart-link" href="${item.chartUrl}" target="_blank" rel="noreferrer">Chart</a>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openTradeDrawer(getTrade(item.key));
    });
    root.appendChild(card);
  }
}

function openPlaybookTarget(item) {
  if (!item) return;
  if (item.targetType === "trade") {
    openTradeDrawer(getTrade(item.targetKey));
    return;
  }
  if (item.targetType === "opportunity") {
    openOpportunityDrawer(getOpportunity(item.targetKey));
    return;
  }
  if (item.targetType === "trader") {
    openTraderDrawer(getTrader(item.targetKey));
  }
}

function openTradeDrawer(trade) {
  if (!trade) return;
  const linkedOpportunity = getOpportunity(trade.key);
  const linkedWarning = getRiskWarning(trade.key);
  const recentExitsHtml = trade.recentExitedTraders?.length
    ? trade.recentExitedTraders.map((exit) => `
        <div class="drawer-item">
          <div>
            <strong>${exit.shortAddress}</strong>
            ${walletToolsHtml(exit.address)}
            <span>Exited ${fmtDate(exit.closedAt)} after ${exit.steps} entries</span>
          </div>
          <div class="drawer-item-right">
            <span>${fmtUsd(exit.totalValueUsd)}</span>
            <span>${exit.realizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(exit.realizedPnlUsd)}</span>
          </div>
        </div>
      `).join("")
    : '<p class="empty">No recent exits from tracked traders.</p>';
  const html = `
    <div class="drawer-grid">
      <div class="drawer-metrics">
        <div class="drawer-stat"><span>Signal</span><strong>${trade.signalStrength}</strong></div>
        <div class="drawer-stat"><span>Confluence</span><strong>${trade.confluenceCount}</strong></div>
        <div class="drawer-stat"><span>Money At Risk</span><strong>${fmtUsd(trade.totalMoneyAtRisk)}</strong></div>
        <div class="drawer-stat"><span>Late Probability</span><strong>${trade.lateProbabilityPct}%</strong></div>
        <div class="drawer-stat"><span>Trend</span><strong>${trade.trendLabel}</strong></div>
        <div class="drawer-stat"><span>Trend Score</span><strong>${trade.trendScore}</strong></div>
        <div class="drawer-stat"><span>Market</span><strong>${trade.marketRegimeLabel}</strong></div>
        <div class="drawer-stat"><span>Market Support</span><strong>${trade.marketSupportScore}</strong></div>
        <div class="drawer-stat"><span>Market Crowding</span><strong>${trade.marketCrowdingRiskPct}%</strong></div>
        <div class="drawer-stat"><span>Clique Strength</span><strong>${trade.cliqueStrength.toFixed(1)}</strong></div>
        <div class="drawer-stat"><span>Quality Blend</span><strong>${Math.round(trade.qualityBlend)}</strong></div>
        <div class="drawer-stat"><span>Abnormality</span><strong>${trade.abnormalScore.toFixed(2)}x</strong></div>
        <div class="drawer-stat"><span>Persistence</span><strong>${trade.persistenceLabel}</strong></div>
        <div class="drawer-stat"><span>Recent Appearances</span><strong>${trade.recentAppearances}</strong></div>
        <div class="drawer-stat"><span>Entry Window</span><strong>${trade.entryWindowLabel}</strong></div>
        <div class="drawer-stat"><span>Hold Window</span><strong>${trade.holdWindowLabel}</strong></div>
        <div class="drawer-stat"><span>Same-Asset Edge</span><strong>${Math.round((trade.symbolTrustedWinRateBlend || 0) * 100)}</strong></div>
        <div class="drawer-stat"><span>Same-Asset Evidence</span><strong>${trade.symbolEvidenceCount}</strong></div>
        <div class="drawer-stat"><span>Cluster Live Age</span><strong>${trade.clusterAgeDays.toFixed(1)}d</strong></div>
        <div class="drawer-stat"><span>Total Buys/Adds</span><strong>${trade.totalDcaCount}</strong></div>
        <div class="drawer-stat"><span>Fresh Adds 24H</span><strong>${trade.recentAdds24hCount}</strong></div>
        <div class="drawer-stat"><span>Fresh Adds 72H</span><strong>${trade.recentAdds72hCount}</strong></div>
        <div class="drawer-stat"><span>Fresh Risk Share</span><strong>${Math.round((trade.recentAddRiskShare || 0) * 100)}%</strong></div>
        <div class="drawer-stat"><span>Green Risk Share</span><strong>${Math.round((trade.greenRiskShare || 0) * 100)}%</strong></div>
        <div class="drawer-stat"><span>Recent Exits</span><strong>${trade.recentExitedCount}</strong></div>
        <div class="drawer-stat"><span>Live PnL</span><strong>${trade.totalUnrealizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(trade.totalUnrealizedPnlUsd)}</strong></div>
        <div class="drawer-stat"><span>Avg Live PnL</span><strong>${trade.averageUnrealizedPnlPct >= 0 ? "+" : ""}${Math.round((trade.averageUnrealizedPnlPct || 0) * 100)}%</strong></div>
        <div class="drawer-stat"><span>Exit Pressure</span><strong>${Math.round((trade.exitPressurePct || 0) * 100)}%</strong></div>
      </div>
      <div class="drawer-block">
        <h3>Timing Read</h3>
        <p>${trade.trendRead}</p>
        <p>${trade.timingRead}</p>
        <p>${trade.durationRead}</p>
        <p>${trade.sameAssetRead}</p>
        <p>${trade.marketStateRead}</p>
        <p>${trade.flowStateRead}</p>
        <p>${trade.riskStateRead}</p>
        <p>${trade.positionStateRead}</p>
        <p>${trade.exitRead}</p>
        <p>${trade.tradeExplanation}</p>
      </div>
      ${linkedOpportunity ? `
        <div class="drawer-block">
          <h3>Action Plan</h3>
          <p><strong>${linkedOpportunity.setupType}</strong> / ${linkedOpportunity.actionBias} / risk ${linkedOpportunity.riskTier}</p>
          <p>${linkedOpportunity.entryPlan}</p>
          <p><strong>Invalidation:</strong> ${linkedOpportunity.invalidationHint}</p>
          <p><strong>Recheck:</strong> ${linkedOpportunity.nextCheckLabel} | hold ${linkedOpportunity.targetHoldWindow}</p>
        </div>
      ` : `
        <div class="drawer-block">
          <h3>Action Plan</h3>
          <p>No explicit opportunity card right now. Treat this as a raw signal cluster and wait for more reinforcement.</p>
        </div>
      `}
      ${linkedWarning ? `
        <div class="drawer-block">
          <h3>Risk Warning</h3>
          <p><strong>${linkedWarning.warningType}</strong> / ${linkedWarning.action}</p>
          <p>${linkedWarning.summary}</p>
        </div>
      ` : `
        <div class="drawer-block">
          <h3>Risk Read</h3>
          <p>Current tone is ${trade.clusterTone}. The cluster is ${trade.abnormalScore >= 2 ? "crowded" : "not especially crowded"} and ${trade.underwaterCount > trade.inProfitCount ? "more traders are underwater than green." : "most traders are still green or balanced."}</p>
        </div>
      `}
      <div class="drawer-block">
        <h3>Signal Read</h3>
        <p>${trade.symbol} ${trade.side.toUpperCase()} is currently ${trade.clusterTone}. Lead trader: ${trade.leadTrader || "n/a"}.</p>
        <p>${trade.inProfitCount} traders are green, ${trade.underwaterCount} are underwater, and ${trade.totalDcaCount} buys/adds are live inside the cluster.</p>
        <p>Versus the last appearance, signal changed by ${trade.signalDeltaFromLast >= 0 ? "+" : ""}${Math.round(trade.signalDeltaFromLast)} and risk changed by ${trade.riskDeltaFromLast >= 0 ? "+" : ""}${fmtUsd(trade.riskDeltaFromLast)}.</p>
        <p><a class="chart-link" href="${trade.chartUrl}" target="_blank" rel="noreferrer">Open chart</a></p>
      </div>
      <div class="drawer-block">
        <h3>Trend Snapshot</h3>
        <div class="trend-stack">
          <div>
            <span class="trend-label">Signal</span>
            ${trendBarsHtml(trade.signalSeries, trade.trendLabel)}
          </div>
          <div>
            <span class="trend-label">Risk</span>
            ${trendBarsHtml(trade.riskSeries, trade.trendLabel)}
          </div>
          <div>
            <span class="trend-label">Confluence</span>
            ${trendBarsHtml(trade.confluenceSeries, trade.trendLabel)}
          </div>
        </div>
      </div>
      <div class="drawer-block">
        <h3>Recent Exits</h3>
        <div class="drawer-list">${recentExitsHtml}</div>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Participants</h3>
        <div class="drawer-list">
          ${trade.traders.map((participant) => `
            <div class="drawer-item clickable-card" data-trader-address="${participant.address}">
              <div>
                <strong>${participant.shortAddress}</strong>
                ${walletToolsHtml(participant.address)}
                <span>#${participant.traderRank} - quality ${Math.round(participant.traderQuality)} - conviction ${Math.round(participant.traderConviction)}</span>
                <span>Same-asset edge ${Math.round((participant.traderSymbolTrustedWinRate || 0) * 100)} on ${participant.traderSymbolCampaignCount || 0} campaigns</span>
                <span>Opened ${fmtDate(participant.openedAt)} | last add ${fmtDate(participant.lastAddedAt)} | ${participant.dcaCount} entries</span>
              </div>
              <div class="drawer-item-right">
                <span>${fmtUsd(participant.positionValueUsd)}</span>
                <span>${participant.unrealizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(participant.unrealizedPnlUsd)}</span>
                <span>${fmtSignedPct(participant.unrealizedPnlPct)}</span>
                <span>${participant.pnlState}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  openDrawer({
    eyebrow: "Signal Detail",
    title: `${trade.symbol} ${trade.side.toUpperCase()}`,
    html
  });
  bindDrawerTraderButtons();
}

function openTraderDrawer(trader) {
  if (!trader) return;
  const positionsHtml = trader.currentPositions.length
    ? trader.currentPositions.map((position) => `
        <div class="drawer-item">
          <div>
            <strong>${position.symbol} ${position.side.toUpperCase()}</strong>
            <span>${fmtDate(position.openedAt)} open - last add ${fmtDate(position.lastAddedAt)}</span>
          </div>
          <div class="drawer-item-right">
            <span>${fmtUsd(position.valueUsd)}</span>
            <span>${position.unrealizedPnlUsd >= 0 ? "+" : ""}${fmtUsd(position.unrealizedPnlUsd)}</span>
          </div>
        </div>
      `).join("")
    : '<p class="empty">No live positions.</p>';

  const peersHtml = trader.overlapPeers.length
    ? trader.overlapPeers.map((peer) => `
        <div class="drawer-item">
          <div>
            <strong>${peer.peerShortAddress}</strong>
            <span>${peer.symbols.join(", ")}</span>
          </div>
          <div class="drawer-item-right">
            <span>${peer.sharedSignals} shared signals</span>
            <span>${fmtUsd(peer.sharedRiskUsd)}</span>
          </div>
        </div>
      `).join("")
    : '<p class="empty">No recurring overlap peers yet.</p>';

  const activeSignalsHtml = trader.activeSignals.length
    ? trader.activeSignals.map((signal) => `
        <button class="drawer-item drawer-item-button" data-trade-key="${signal.key}">
          <div>
            <strong>${signal.symbol} ${signal.side.toUpperCase()}</strong>
            <span>${signal.pnlState}</span>
          </div>
          <div class="drawer-item-right">
            <span>${fmtUsd(signal.positionValueUsd)}</span>
            <span>signal ${signal.signalStrength}</span>
          </div>
        </button>
      `).join("")
    : '<p class="empty">No active signals yet.</p>';

  const html = `
    <div class="drawer-grid">
      <div class="drawer-metrics">
        <div class="drawer-stat"><span>Quality</span><strong>${trader.qualityScore}</strong></div>
        <div class="drawer-stat"><span>Conviction</span><strong>${trader.convictionScore}</strong></div>
        <div class="drawer-stat"><span>Patience</span><strong>${trader.patienceScore}</strong></div>
        <div class="drawer-stat"><span>Consistency</span><strong>${trader.consistencyScore}</strong></div>
        <div class="drawer-stat"><span>Downside</span><strong>${trader.downsideScore}</strong></div>
        <div class="drawer-stat"><span>Heat</span><strong>${trader.currentHeat.toFixed(1)}x</strong></div>
        <div class="drawer-stat"><span>Avg Hold</span><strong>${fmtDays(trader.avgHoldDays)}</strong></div>
        <div class="drawer-stat"><span>One-Shot Share</span><strong>${fmtPct(trader.oneShotShare)}</strong></div>
        <div class="drawer-stat"><span>Recent Top Count</span><strong>${trader.recentTopCount}</strong></div>
        <div class="drawer-stat"><span>Top Streak</span><strong>${trader.recentTopStreak}</strong></div>
      </div>
      <div class="drawer-block">
        <h3>Profile</h3>
        <p>${trader.shortAddress} is a ${trader.style} trader with ${fmtPct(trader.winRate365)} 12-month win rate and ${fmtUsd(trader.noticeableExposureUsd)} in notable open exposure.</p>
        <p>Position concentration is ${fmtPct(trader.positionConcentration)} and current exposure is ${fmtUsd(trader.currentExposureUsd)}.</p>
        ${walletToolsHtml(trader.address)}
        <p>Verified win rates: 12m ${fmtPct(trader.winRate365)} on ${trader.winRate365Count} trades, 6m ${fmtPct(trader.winRate180)} on ${trader.winRate180Count}, 3m ${fmtPct(trader.winRate90)} on ${trader.winRate90Count}, 30d ${fmtPct(trader.winRate30)} on ${trader.winRate30Count}.</p>
        <p>Daily edge: ${fmtPct(trader.profitableDaysPct)} profitable days across ${trader.activeDays} active days, average ${fmtUsd(trader.avgDailyPnlUsd)} per active day, best day ${fmtUsd(trader.bestDayUsd)}, worst day ${fmtUsd(trader.worstDayUsd)}.</p>
      </div>
      <div class="drawer-block">
        <h3>Recurring Peers</h3>
        <div class="drawer-list">${peersHtml}</div>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Current Positions</h3>
        <div class="drawer-list">${positionsHtml}</div>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Active Signals</h3>
        <div class="drawer-list">${activeSignalsHtml}</div>
      </div>
    </div>
  `;
  openDrawer({
    eyebrow: "Trader Detail",
    title: trader.shortAddress,
    html
  });
  bindDrawerTradeButtons();
}

function openCliqueDrawer(pair) {
  if (!pair) return;
  const firstTrader = getTrader(pair.addresses[0]);
  const secondTrader = getTrader(pair.addresses[1]);
  const html = `
    <div class="drawer-grid">
      <div class="drawer-metrics">
        <div class="drawer-stat"><span>Shared Signals</span><strong>${pair.sharedSignals}</strong></div>
        <div class="drawer-stat"><span>Shared Risk</span><strong>${fmtUsd(pair.sharedRiskUsd)}</strong></div>
        <div class="drawer-stat"><span>Symbols</span><strong>${pair.symbols.length}</strong></div>
      </div>
      <div class="drawer-block">
        <h3>Pair Read</h3>
        <p>${pair.label} keep appearing together across ${pair.sharedSignals} active signals.</p>
        <p>Symbols seen together: ${pair.symbols.join(", ")}</p>
      </div>
      <div class="drawer-block drawer-block-wide">
        <h3>Open Trader Profiles</h3>
        <div class="drawer-list">
          ${[firstTrader, secondTrader].filter(Boolean).map((trader) => `
            <button class="drawer-item drawer-item-button" data-trader-address="${trader.address}">
              <div>
                <strong>${trader.shortAddress}</strong>
                <span>${trader.style} - quality ${trader.qualityScore}</span>
              </div>
              <div class="drawer-item-right">
                <span>${fmtUsd(trader.noticeableExposureUsd)}</span>
                <span>${trader.currentPositionCount} positions</span>
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  openDrawer({
    eyebrow: "Clique Detail",
    title: pair.label,
    html
  });
  bindDrawerTraderButtons();
}

function bindDrawerTradeButtons() {
  document.querySelectorAll("[data-trade-key]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("a,[data-copy-text]")) return;
      openTradeDrawer(getTrade(button.dataset.tradeKey));
    });
  });
}

function bindDrawerTraderButtons() {
  document.querySelectorAll("[data-trader-address]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("a,[data-copy-text]")) return;
      openTraderDrawer(getTrader(button.dataset.traderAddress));
    });
  });
}

function renderWatchlist(items) {
  const root = document.querySelector("#watchlist");
  root.innerHTML = "";
  const topKeys = getTopRecommendationKeys();
  const filteredItems = items.filter((item) => !topKeys.has(item.key));
  const renderItems = filteredItems.length ? filteredItems : items;

  if (!renderItems.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No watchlist items yet. Refresh after collecting a fresh snapshot.";
    root.appendChild(empty);
    return;
  }

  for (const item of renderItems) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">Watch ${item.rank}</p>
      <h3>${item.label}</h3>
      <div class="watch-stats">
        <span>Signal ${item.signalStrength}</span>
        <span>${item.confluenceCount} traders</span>
        <span>${fmtUsd(item.totalMoneyAtRisk)}</span>
        <span>${item.persistenceLabel} / clique ${item.cliqueStrength.toFixed(1)}</span>
      </div>
      <p class="watch-reason">${item.reason}</p>
    `;
    card.addEventListener("click", () => openTradeDrawer(getTrade(item.key)));
    root.appendChild(card);
  }
}

function renderStickySetups(items) {
  const root = document.querySelector("#sticky-setups");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Sticky setups will appear once you have a few archived refreshes.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">Sticky ${item.rank}</p>
      <h3>${item.label}</h3>
      <div class="watch-stats">
        <span>${item.persistenceLabel}</span>
        <span>${item.recentAppearances} appearances</span>
        <span>${fmtUsd(item.totalMoneyAtRisk)}</span>
        <span>${item.signalDeltaFromLast >= 0 ? "+" : ""}${Math.round(item.signalDeltaFromLast)} signal</span>
      </div>
    `;
    card.addEventListener("click", () => openTradeDrawer(getTrade(item.key)));
    root.appendChild(card);
  }
}

function renderOpportunities(items) {
  const root = document.querySelector("#opportunity-list");
  root.innerHTML = "";
  const topKeys = getTopRecommendationKeys();
  const filteredItems = items.filter((item) => !topKeys.has(item.key));
  const renderItems = filteredItems.length ? filteredItems : items;

  if (!renderItems.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No opportunities yet. Refresh after the next snapshot.";
    root.appendChild(empty);
    return;
  }

  for (const item of renderItems) {
    const card = document.createElement("article");
    card.className = `change-card clickable-card opportunity-card risk-${item.riskTier.toLowerCase()}`;
    card.innerHTML = `
      <p class="change-type">${item.setupType}</p>
      <h3>${item.label}</h3>
      <p class="change-summary">${item.why}</p>
      <div class="change-metrics">
        <span>${item.actionBias}</span>
        <span>score ${item.score}</span>
        <span>trust ${Math.round(item.reliabilityBlend || 0)}</span>
        <span>trend ${item.trendLabel}</span>
        <span>market ${item.marketRegimeLabel}</span>
        <span>support ${item.marketSupportScore}</span>
        <span>same-asset ${Math.round((item.symbolTrustedWinRateBlend || 0) * 100)}</span>
        <span>risk ${item.riskTier}</span>
        <span>check ${item.nextCheckLabel}</span>
        <span>hold ${item.targetHoldWindow}</span>
        <span>${item.entryWindowLabel}</span>
        <span>late ${item.lateProbabilityPct}%</span>
        <span>${item.recentAdds24hCount} adds / 24h</span>
        <span>live pnl ${Math.round((item.averageUnrealizedPnlPct || 0) * 100)}%</span>
        <span>exit pressure ${Math.round((item.exitPressurePct || 0) * 100)}%</span>
      </div>
      <p class="change-summary"><strong>Entry:</strong> ${item.entryPlan}</p>
      <p class="change-summary"><strong>Trend:</strong> ${item.trendRead}</p>
      <p class="change-summary"><strong>Timing:</strong> ${item.timingRead}</p>
      <p class="change-summary"><strong>Duration:</strong> ${item.durationRead}</p>
      <p class="change-summary"><strong>Same-asset:</strong> ${item.sameAssetRead}</p>
      <p class="change-summary"><strong>Market:</strong> ${item.marketStateRead}</p>
      <p class="change-summary"><strong>Flow:</strong> ${item.flowStateRead}</p>
      <div class="badge-list">
        ${(item.cautionFlags || []).map((flag) => `<span class="badge">${flag}</span>`).join("")}
      </div>
      <a class="chart-link" href="${item.chartUrl}" target="_blank" rel="noreferrer">Chart</a>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openOpportunityDrawer(item);
    });
    root.appendChild(card);
  }
}

function renderLongIdeas(items) {
  const root = document.querySelector("#long-ideas-list");
  root.innerHTML = "";
  const topKeys = getTopRecommendationKeys();
  const filteredItems = items.filter((item) => !topKeys.has(item.key));
  const renderItems = filteredItems.length ? filteredItems : items;

  if (!renderItems.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No long ideas yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of renderItems) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">Long score ${item.score}</p>
      <h3>${item.label}</h3>
      <div class="watch-stats">
        <span>${item.actionLabel}</span>
        <span>${item.trendLabel}</span>
        <span>${item.marketRegimeLabel}</span>
        <span>${item.entryWindowLabel}</span>
        <span>${item.expectedHoldLeftDays}d left</span>
        <span>hold ${item.holdWindowLabel}</span>
        <span>same-asset ${item.symbolEdgeScore}</span>
        <span>support ${item.marketSupportScore}</span>
        <span>${item.recentAdds24hCount} adds / 24h</span>
        <span>late ${item.lateProbabilityPct}%</span>
        <span>live pnl ${item.livePnlPct}%</span>
        <span>exit pressure ${item.exitPressurePct}%</span>
      </div>
      <p class="watch-reason">${item.trendRead}</p>
      <p class="watch-reason">${item.marketStateRead}</p>
      <p class="watch-reason">${item.timingRead}</p>
      <p class="watch-reason">${item.durationRead}</p>
      <p class="watch-reason">${item.explanation}</p>
    `;
    card.addEventListener("click", () => openTradeDrawer(getTrade(item.key)));
    root.appendChild(card);
  }
}

function renderDailyPlaybook(items) {
  const root = document.querySelector("#daily-playbook-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No playbook cards yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">${item.title}</p>
      <h3>${item.label}</h3>
      <p class="watch-reason">${item.summary}</p>
      <p class="watch-reason">${item.detail}</p>
    `;
    card.addEventListener("click", () => openPlaybookTarget(item));
    root.appendChild(card);
  }
}

function renderCliUsageGuide(items) {
  const root = document.querySelector("#cli-usage-list");
  root.innerHTML = "";

  if (!items.length) return;

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "about-card";
    card.innerHTML = `
      <p class="change-type">${item.title}</p>
      <h3><code>${item.command}</code></h3>
      <p class="change-summary">${item.reason}</p>
    `;
    root.appendChild(card);
  }
}

function renderRiskWarnings(items) {
  const root = document.querySelector("#risk-warning-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No obvious avoid-list setups right now.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = `change-card clickable-card severity-${item.severity === "high" ? "3" : "2"}`;
    card.innerHTML = `
      <p class="change-type">${item.warningType}</p>
      <h3>${item.label}</h3>
      <p class="change-summary">${item.summary}</p>
      <div class="change-metrics">
        <span>${item.action}</span>
        <span>check ${item.nextCheckLabel}</span>
      </div>
      <a class="chart-link" href="${item.chartUrl}" target="_blank" rel="noreferrer">Chart</a>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openTradeDrawer(getTrade(item.key));
    });
    root.appendChild(card);
  }
}

function renderCapitalPlan(plan) {
  const root = document.querySelector("#capital-plan-list");
  const meta = document.querySelector("#capital-plan-meta");
  root.innerHTML = "";
  meta.textContent = plan?.topIdeas?.length
    ? `Starter sleeve ${plan.totalSuggestedRiskPct}% | max sleeve ${plan.maxSuggestedRiskPct}%`
    : "No capital plan yet.";

  if (!plan?.topIdeas?.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No capital plan yet. Refresh after the next snapshot.";
    root.appendChild(empty);
    return;
  }

  for (const item of plan.topIdeas) {
    const card = document.createElement("article");
    card.className = "watch-card clickable-card";
    card.innerHTML = `
      <p class="watch-rank">Tier ${item.attentionTier}</p>
      <h3>${item.label}</h3>
      <div class="watch-stats">
        <span>${item.planLabel}</span>
        <span>${item.checkCadence}</span>
        <span>starter ${item.starterRiskPct}%</span>
        <span>max ${item.maxRiskPct}%</span>
        <span>${item.setupType}</span>
        <span>hold ${item.targetHoldWindow}</span>
      </div>
      <p class="watch-reason">${item.reason}</p>
    `;
    card.addEventListener("click", () => openOpportunityDrawer(getOpportunity(item.key)));
    root.appendChild(card);
  }
}

function renderTraderStalkBoard(items) {
  const root = document.querySelector("#stalk-trader-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No trader stalk board yet.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "change-card clickable-card";
    card.innerHTML = `
      <p class="change-type">Copyability ${item.copyabilityScore}</p>
      <h3>${item.shortAddress}</h3>
      ${walletToolsHtml(item.address)}
      <p class="change-summary">${item.stalkingReason}</p>
      <div class="change-metrics">
        <span>${item.style}</span>
        <span>consistency ${item.consistencyScore}</span>
        <span>profit days ${Math.round((item.profitableDaysPct || 0) * 100)}%</span>
        <span>heat ${item.currentHeat.toFixed(1)}x</span>
        <span>streak ${item.recentTopStreak}</span>
        <span>${(item.focusSymbols || []).join(", ") || "No focus symbols"}</span>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a,button")) return;
      openTraderDrawer(getTrader(item.address));
    });
    root.appendChild(card);
  }
}

function renderChanges(changes, summary) {
  const root = document.querySelector("#changes-list");
  const meta = document.querySelector("#change-meta");
  meta.textContent = summary.changeWindowFrom
    ? `Compared with ${fmtDate(summary.changeWindowFrom)}`
    : "No previous snapshot yet. Run another refresh to start seeing deltas.";
  root.innerHTML = "";

  if (!changes.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No notable changes yet. Refresh again after the next market move.";
    root.appendChild(empty);
    return;
  }

  for (const change of changes) {
    const card = document.createElement("article");
    card.className = `change-card severity-${change.severity} clickable-card`;
    card.innerHTML = `
      <p class="change-type">${change.type}</p>
      <h3>${change.label}</h3>
      <p class="change-summary">${change.summary}</p>
      <div class="change-metrics">
        <span>${change.deltaConfluence >= 0 ? "+" : ""}${change.deltaConfluence || 0} traders</span>
        <span>${fmtUsd(change.deltaMoneyAtRisk || 0)} delta</span>
        <span>${change.deltaSignalStrength >= 0 ? "+" : ""}${Math.round(change.deltaSignalStrength || 0)} signal</span>
      </div>
      <a class="chart-link" href="${change.chartUrl}" target="_blank" rel="noreferrer">Chart</a>
    `;
    const relatedTrade =
      state.dashboard?.interestingTrades?.find((trade) => trade.symbol === change.symbol && trade.side === change.side) || null;
    if (relatedTrade) {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        openTradeDrawer(relatedTrade);
      });
    }
    root.appendChild(card);
  }
}

function renderTimeline(items) {
  const root = document.querySelector("#timeline-list");
  root.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "The timeline fills up as archived snapshots accumulate.";
    root.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "change-card";
    card.innerHTML = `
      <p class="change-type">${fmtDate(item.generatedAt)}</p>
      <h3>${item.strongestSignal}</h3>
      <p class="change-summary">${item.interestingTradeCount} interesting trades with ${fmtUsd(item.totalTrackedRiskUsd)} tracked risk.</p>
      <div class="change-metrics">
        <span>${item.changeCount} changes</span>
        <span>${item.interestingTradeCount} signals</span>
      </div>
    `;
    root.appendChild(card);
  }
}

function renderCliques(pairs) {
  const root = document.querySelector("#clique-list");
  root.innerHTML = "";

  if (!pairs.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No recurring trader overlap pairs yet.";
    root.appendChild(empty);
    return;
  }

  for (const pair of pairs) {
    const card = document.createElement("article");
    card.className = "change-card clickable-card";
    card.innerHTML = `
      <p class="change-type">Clique Pair</p>
      <h3>${pair.label}</h3>
      <p class="change-summary">They currently share ${pair.sharedSignals} live signals across ${pair.symbols.join(", ")}.</p>
      <div class="change-metrics">
        <span>${pair.sharedSignals} shared signals</span>
        <span>${fmtUsd(pair.sharedRiskUsd)}</span>
        <span>${pair.symbols.length} symbols</span>
      </div>
    `;
    card.addEventListener("click", () => openCliqueDrawer(pair));
    root.appendChild(card);
  }
}

function renderTraders(traders) {
  const tbody = document.querySelector("#trader-rows");
  tbody.innerHTML = "";

  for (const trader of traders) {
    const row = document.createElement("tr");
    row.className = "clickable-row";
    row.innerHTML = `
      <td>${trader.rank}</td>
      <td>
        <div class="trader-cell">
          <strong>${trader.shortAddress}</strong>
          ${walletToolsHtml(trader.address)}
          <span>${trader.label}</span>
          <span>12m ${fmtPct(trader.winRate365)} on ${trader.winRate365Count} trades | trust ${trader.reliabilityScore} | consistency ${trader.consistencyScore}</span>
        </div>
      </td>
      <td>${trader.qualityScore}</td>
      <td>${trader.convictionScore}</td>
      <td>${fmtPct(trader.winRate365)}</td>
      <td>${fmtPct(trader.winRate180)}</td>
      <td>${fmtPct(trader.winRate90)}</td>
      <td>${fmtPct(trader.winRate30)}</td>
      <td>${fmtDays(trader.avgHoldDays)}</td>
      <td>${trader.style}</td>
      <td>${trader.currentHeat.toFixed(1)}x</td>
      <td>${trader.currentPositionCount}</td>
      <td>${fmtUsd(trader.noticeableExposureUsd)}</td>
      <td>${fmtUsd(trader.totalPnl)}</td>
    `;
    row.addEventListener("click", (event) => {
      if (event.target.closest("a,button")) return;
      openTraderDrawer(trader);
    });
    tbody.appendChild(row);
  }
}

function populateStats(container, trade) {
  container.innerHTML = "";
  container.append(
    statItem("Confluence", String(trade.confluenceCount), true),
    statItem("Money At Risk", fmtUsd(trade.totalMoneyAtRisk), true),
    statItem("Signal", `${trade.signalStrength}`, true),
    statItem("Quality Blend", `${Math.round(trade.qualityBlend)}`),
    statItem("Clique Strength", `${trade.cliqueStrength.toFixed(1)}`),
    statItem("Abnormality", `${trade.abnormalScore.toFixed(2)}x`),
    statItem("Avg Entry Age", fmtDays(trade.averageEntryAgeDays)),
    statItem("In Profit", String(trade.inProfitCount)),
    statItem("Underwater", String(trade.underwaterCount)),
    statItem("One-Shot", String(trade.oneShotCount)),
    statItem("Total DCA", String(trade.totalDcaCount)),
    statItem("Last Add", fmtDate(trade.lastAddAt))
  );
}

function populateParticipants(container, trade) {
  container.innerHTML = "";
  for (const trader of trade.traders) {
    const item = document.createElement("li");
    item.innerHTML = `
      <div>
        <strong>${trader.shortAddress}</strong>
        <span>#${trader.traderRank} - quality ${Math.round(trader.traderQuality)} - conviction ${Math.round(trader.traderConviction)}</span>
      </div>
      <div class="participant-right">
        <span>${fmtUsd(trader.positionValueUsd)}</span>
        <span class="${trader.pnlState === "profit" ? "pill-green" : "pill-red"}">${trader.pnlState}</span>
      </div>
    `;
    container.appendChild(item);
  }
}

function tradeCard(trade) {
  const template = document.querySelector("#trade-card-template");
  const fragment = template.content.cloneNode(true);
  const article = fragment.querySelector(".trade-card");
  article.classList.add("clickable-card");
  fragment.querySelector(".trade-symbol").textContent = trade.symbol;
  fragment.querySelector(".trade-side").textContent = `${trade.side.toUpperCase()} - ${trade.clusterTone}`;
  fragment.querySelector(".chart-link").href = trade.chartUrl;
  populateStats(fragment.querySelector(".stats-grid"), trade);
  populateParticipants(fragment.querySelector(".participant-list"), trade);
  article.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    openTradeDrawer(trade);
  });
  return fragment;
}

function getFilteredInterestingTrades() {
  const { dashboard, filters } = state;
  if (!dashboard) return [];

  const query = filters.query.trim().toLowerCase();
  const filtered = dashboard.interestingTrades.filter((trade) => {
    const queryMatch = !query || trade.symbol.toLowerCase().includes(query);
    const sideMatch = filters.side === "all" || trade.side === filters.side;
    const confluenceMatch = trade.confluenceCount >= filters.minConfluence;
    return queryMatch && sideMatch && confluenceMatch;
  });

  const sorters = {
    signal: (a, b) => b.signalStrength - a.signalStrength,
    risk: (a, b) => b.totalMoneyAtRisk - a.totalMoneyAtRisk,
    abnormal: (a, b) => b.abnormalScore - a.abnormalScore,
    newest: (a, b) => Date.parse(b.lastAddAt) - Date.parse(a.lastAddAt)
  };

  return [...filtered].sort(sorters[filters.sort] || sorters.signal);
}

function renderTradeSection(selector, trades, emptyMessage) {
  const root = document.querySelector(selector);
  root.innerHTML = "";

  if (!trades.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = emptyMessage;
    root.appendChild(empty);
    return;
  }

  for (const trade of trades) {
    root.appendChild(tradeCard(trade));
  }
}

function renderTradeViews() {
  const interestingTrades = getFilteredInterestingTrades();
  const abnormalTrades = interestingTrades.filter((trade) => trade.abnormalScore >= 1.75);

  renderTradeSection(
    "#interesting-trades",
    interestingTrades,
    "No confluence trades match the current filters."
  );
  renderTradeSection(
    "#abnormal-trades",
    abnormalTrades,
    "No abnormal setups match the current filters."
  );
}

function setupControls(dashboard) {
  const sideFilter = document.querySelector("#side-filter");
  const symbolSearch = document.querySelector("#symbol-search");
  const sortFilter = document.querySelector("#sort-filter");
  const confluenceFilter = document.querySelector("#confluence-filter");

  sideFilter.innerHTML = '<option value="all">All</option>';
  for (const side of dashboard.filters.sides || []) {
    const option = document.createElement("option");
    option.value = side;
    option.textContent = side.toUpperCase();
    sideFilter.appendChild(option);
  }

  symbolSearch.addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    renderTradeViews();
  });

  sideFilter.addEventListener("change", (event) => {
    state.filters.side = event.target.value;
    renderTradeViews();
  });

  sortFilter.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderTradeViews();
  });

  confluenceFilter.addEventListener("change", (event) => {
    state.filters.minConfluence = Number(event.target.value);
    renderTradeViews();
  });
}

function setupDrawerControls() {
  document.querySelector("#drawer-close").addEventListener("click", closeDrawer);
  document.querySelector("#drawer-backdrop").addEventListener("click", closeDrawer);
}

function setupNavHighlight() {
  const links = [...document.querySelectorAll(".nav-chips a[href^='#']")];
  if (!links.length) return;
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const linkById = new Map(
    links.map((link) => [link.getAttribute("href").slice(1), link])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible?.target?.id) return;
      for (const link of links) link.classList.remove("active");
      linkById.get(visible.target.id)?.classList.add("active");
    },
    {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0.15, 0.35, 0.6]
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setExportStatus(message) {
  const node = document.querySelector("#export-status");
  if (!node) return;
  node.textContent = message;
  window.clearTimeout(setExportStatus.timeoutId);
  setExportStatus.timeoutId = window.setTimeout(() => {
    node.textContent = "";
  }, 2600);
}

async function loadTextAsset(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.text();
}

async function copyTextAsset(path, successMessage) {
  const text = await loadTextAsset(path);
  await navigator.clipboard.writeText(text);
  setExportStatus(successMessage);
}

async function downloadTextAsset(path, filename, successMessage) {
  const text = await loadTextAsset(path);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setExportStatus(successMessage);
}

function setupExportActions() {
  document.querySelector("#copy-brief").addEventListener("click", async () => {
    try {
      await copyTextAsset("./data/action-brief.md", "Brief copied");
    } catch (error) {
      setExportStatus(error.message);
    }
  });

  document.querySelector("#download-brief").addEventListener("click", async () => {
    try {
      await downloadTextAsset("./data/action-brief.md", "hyperliquid-conviction-brief.md", "Brief downloaded");
    } catch (error) {
      setExportStatus(error.message);
    }
  });

  document.querySelector("#copy-share-post").addEventListener("click", async () => {
    try {
      await copyTextAsset("./data/share-post.txt", "Share post copied");
    } catch (error) {
      setExportStatus(error.message);
    }
  });
}

function setupCopyActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-text]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(button.dataset.copyText || "");
      setExportStatus("Copied");
    } catch (error) {
      setExportStatus(error.message);
    }
  });
}

async function main() {
  const response = await fetch("./data/dashboard.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load dashboard.json (${response.status})`);
  state.dashboard = await response.json();

  document.querySelector("#meta").textContent =
    `Last refresh: ${fmtDate(state.dashboard.generatedAt)} - ${state.dashboard.mode.toUpperCase()}`;

  renderSummary(state.dashboard.summary, state.dashboard.mode);
  renderDeskSnapshot(buildDeskSnapshot());
  renderTopRecommendations(state.dashboard.topRecommendations || []);
  renderMarketPulse(state.dashboard.marketPulse || []);
  renderCliUsageGuide(state.dashboard.cliUsageGuide || []);
  renderDailyPlaybook(state.dashboard.dailyPlaybook || []);
  renderWatchlist(state.dashboard.watchlist || []);
  renderStickySetups(state.dashboard.stickySetups || []);
  renderOpportunities(state.dashboard.opportunities || []);
  renderLongIdeas(state.dashboard.longIdeas || []);
  renderRiskWarnings(state.dashboard.riskWarnings || []);
  renderCapitalPlan(state.dashboard.capitalPlan || null);
  renderTraderStalkBoard(state.dashboard.traderStalkBoard || []);
  renderChanges(state.dashboard.changes || [], state.dashboard.summary);
  renderTimeline(state.dashboard.timeline || []);
  renderCliques(state.dashboard.topCliques || []);
  renderTraders(state.dashboard.traders);
  setupControls(state.dashboard);
  setupDrawerControls();
  setupNavHighlight();
  setupExportActions();
  setupCopyActions();
  renderTradeViews();
}

main().catch((error) => {
  document.body.innerHTML = `<main class="shell"><section class="panel"><h1>Dashboard error</h1><p>${error.message}</p></section></main>`;
});
