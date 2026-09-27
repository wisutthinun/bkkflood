/**
 * Main Application Logic
 * Flood & Traffic Command Center Dashboard (กทม. นนทบุรี ปทุมธานี)
 */

// Global State
let dashboardState = {
  data: JSON.parse(JSON.stringify(INITIAL_DATA)),
  lastUpdated: new Date(),
  autoRefreshInterval: null,
  activeFilterProvince: "all",
  activeFilterSeverity: "all",
  searchKeyword: "",
  activeTab: "overview",
  trendChartInstance: null,
  cctvAnimFrames: {},
  activeModalCctvId: null
};

// --------------------------------------------------------------------------
// Dynamic Rain Status & Forecast for 6 Priority Zones (Always Live & Current)
// --------------------------------------------------------------------------
var ZONE_RAIN_PROFILES = {
  "ngamwongwan": {
    initialMinsAgo: 140, // ตกมาแล้ว 2 ชม. 20 นาที
    isRaining: true,
    intensity: "ฝนตกปานกลาง",
    intensityLevel: "moderate",
    forecastMinsAhead: 25,
    getForecast: (timeStr) => `คาดว่ากลุ่มฝนจะเคลื่อนตัวผ่านพ้นช่วงเวลา ${timeStr} น.`
  },
  "prachachuen": {
    stoppedMinsAgo: 35, // ฝนหยุดตกแล้วเมื่อ ~35 นาทีที่แล้ว
    isRaining: false,
    intensity: "ฝนหยุดตกแล้ว",
    intensityLevel: "none",
    durationText: "ตกต่อเนื่องรวม 1 ชม. 45 นาที",
    radarForecast: "กลุ่มฝนสลายตัวแล้ว ไม่มีเมฆฝนใหม่เข้าพื้นที่"
  },
  "chaengwattana": {
    initialMinsAgo: 165, // ตกมาแล้ว 2 ชม. 45 นาที
    isRaining: true,
    intensity: "ฝนตกหนักต่อเนื่อง",
    intensityLevel: "heavy",
    forecastMinsAhead: 45,
    getForecast: (timeStr) => `กลุ่มฝนฟ้าคะนองหนาแน่น คาดตกต่อเนื่องถึงเวลา ${timeStr} น.`
  },
  "kasetsart": {
    initialMinsAgo: 110, // ตกมาแล้ว 1 ชม. 50 นาที
    isRaining: true,
    intensity: "ฝนปรอยๆ เบาบาง",
    intensityLevel: "light",
    forecastMinsAhead: 20,
    getForecast: (timeStr) => `เมฆฝนเริ่มเบาบาง คาดว่าจะหยุดตกช่วงเวลา ${timeStr} น.`
  },
  "muang-nonthaburi": {
    initialMinsAgo: 135, // ตกมาแล้ว 2 ชม. 15 นาที
    isRaining: true,
    intensity: "ฝนตกปานกลาง",
    intensityLevel: "moderate",
    forecastMinsAhead: 30,
    getForecast: (timeStr) => `กลุ่มฝนยังคงปกคลุมเขตเทศบาล คาดเบาบางลงหลัง ${timeStr} น.`
  },
  "chinkhet": {
    initialMinsAgo: 125, // ตกมาแล้ว 2 ชม. 5 นาที
    isRaining: true,
    intensity: "ฝนตกปานกลาง",
    intensityLevel: "moderate",
    forecastMinsAhead: 25,
    getForecast: (timeStr) => `กลุ่มฝนกำลังเคลื่อนตัวไปทางทิศตะวันออกเฉียงเหนือ คาดเบาบางลงราว ${timeStr} น.`
  }
};

function initPriorityZonesRainDynamic(baseTime = new Date()) {
  const zones = dashboardState.data.priorityZones;
  if (!zones || zones.length === 0) return;

  zones.forEach(zone => {
    const profile = ZONE_RAIN_PROFILES[zone.id];
    if (!profile) return;
    if (!zone.rainfall) zone.rainfall = {};

    if (profile.isRaining) {
      // คำนวณเวลาเริ่มตกโดยอิงจากเวลาเครื่องปัจจุบันย้อนหลังตามระยะเวลาสมจริง
      const startMs = baseTime.getTime() - profile.initialMinsAgo * 60 * 1000;
      zone.rainfall.startEpoch = startMs;
      zone.rainfall.isRaining = true;
      zone.rainfall.intensity = profile.intensity;
      zone.rainfall.intensityLevel = profile.intensityLevel;

      const startDate = new Date(startMs);
      const hh = String(startDate.getHours()).padStart(2, '0');
      const mm = String(startDate.getMinutes()).padStart(2, '0');
      zone.rainfall.startTime = `${hh}:${mm} น.`;
    } else {
      // โซนที่ฝนหยุดตกแล้ว
      const stoppedMs = baseTime.getTime() - profile.stoppedMinsAgo * 60 * 1000;
      zone.rainfall.stoppedEpoch = stoppedMs;
      zone.rainfall.isRaining = false;
      zone.rainfall.intensity = profile.intensity;
      zone.rainfall.intensityLevel = profile.intensityLevel;

      const stoppedDate = new Date(stoppedMs);
      const hh = String(stoppedDate.getHours()).padStart(2, '0');
      const mm = String(stoppedDate.getMinutes()).padStart(2, '0');
      zone.rainfall.stoppedTime = `${hh}:${mm} น.`;
      zone.rainfall.durationText = profile.durationText;
      zone.rainfall.radarForecast = profile.radarForecast;
    }
  });

  updatePriorityZonesRainData(baseTime);
}

function updatePriorityZonesRainData(currentTime = new Date()) {
  const zones = dashboardState.data.priorityZones;
  if (!zones || zones.length === 0) return;

  zones.forEach(zone => {
    const profile = ZONE_RAIN_PROFILES[zone.id];
    if (!profile || !zone.rainfall) return;

    if (zone.rainfall.isRaining) {
      if (!zone.rainfall.startEpoch) {
        zone.rainfall.startEpoch = currentTime.getTime() - profile.initialMinsAgo * 60 * 1000;
      }

      // Re-confirm start time text
      const startDate = new Date(zone.rainfall.startEpoch);
      const sHh = String(startDate.getHours()).padStart(2, '0');
      const sMm = String(startDate.getMinutes()).padStart(2, '0');
      zone.rainfall.startTime = `${sHh}:${sMm} น.`;

      // คำนวณนาทีที่ฝนตกจริงนับจากเวลาเริ่มตกจนถึงเวลาปัจจุบัน
      const elapsedMins = Math.max(10, Math.floor((currentTime.getTime() - zone.rainfall.startEpoch) / 60000));
      zone.rainfall.durationMinutes = elapsedMins;

      const hours = Math.floor(elapsedMins / 60);
      const mins = elapsedMins % 60;
      let durationStr = "ตกมาแล้ว ";
      if (hours > 0) durationStr += `${hours} ชม. `;
      durationStr += `${mins} นาที`;
      zone.rainfall.durationText = durationStr;

      // ปรับเวลาพยากรณ์เรดาร์ในอนาคตให้อัปเดตตามเวลาปัจจุบันเสมอ
      if (profile.forecastMinsAhead && profile.getForecast) {
        const forecastDate = new Date(currentTime.getTime() + profile.forecastMinsAhead * 60 * 1000);
        const fHh = String(forecastDate.getHours()).padStart(2, '0');
        const fMm = String(forecastDate.getMinutes()).padStart(2, '0');
        zone.rainfall.radarForecast = profile.getForecast(`${fHh}:${fMm}`);
      }
    } else {
      // โซนที่ฝนหยุดตกแล้ว
      if (!zone.rainfall.stoppedEpoch) {
        zone.rainfall.stoppedEpoch = currentTime.getTime() - profile.stoppedMinsAgo * 60 * 1000;
      }
      const stoppedDate = new Date(zone.rainfall.stoppedEpoch);
      const stHh = String(stoppedDate.getHours()).padStart(2, '0');
      const stMm = String(stoppedDate.getMinutes()).padStart(2, '0');
      zone.rainfall.stoppedTime = `${stHh}:${stMm} น.`;
      zone.rainfall.durationText = profile.durationText;
      zone.rainfall.radarForecast = profile.radarForecast;
    }
  });

  // อัปเดตเวลาบนหัวข้อ Priority Zones
  const syncBadge = document.getElementById("priority-sync-time");
  if (syncBadge) {
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const ss = String(currentTime.getSeconds()).padStart(2, '0');
    syncBadge.innerText = `${hh}:${mm}:${ss} น.`;
  }
}

// ==========================================================================
// Timestamp & Refresh Logic
// ==========================================================================
function formatThaiDateTime(date) {
  const monthsThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const d = date.getDate();
  const m = monthsThai[date.getMonth()];
  const y = date.getFullYear() + 543; // Buddhist Era
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${d} ${m} ${y}, ${hh}:${mm}:${ss} น.`;
}

function initTimestamp() {
  updateTimestampDisplay();
}

function updateTimestampDisplay() {
  const el = document.getElementById("last-updated-val");
  if (el) {
    el.innerText = formatThaiDateTime(dashboardState.lastUpdated);
  }
}

function triggerManualRefresh() {
  const btn = document.getElementById("btn-manual-refresh");
  if (btn) btn.classList.add("spinning");

  // Simulate realistic network sync & slight water level fluctuation
  setTimeout(() => {
    dashboardState.lastUpdated = new Date();
    updateTimestampDisplay();
    simulateDataFluctuation();
    renderDashboard();
    updateTrendChart();

    if (btn) btn.classList.remove("spinning");
    showNotification("อัปเดตข้อมูลสถานการณ์รอบ กฟภ. และระดับน้ำเรียบร้อยแล้ว");
  }, 650);
}

function simulateDataFluctuation() {
  // Add small micro-fluctuations to road water depth and canal levels
  dashboardState.data.canals.forEach(c => {
    const delta = (Math.random() * 0.04 - 0.02); // -0.02 to +0.02
    c.currentLevel = parseFloat(Math.max(0, c.currentLevel + delta).toFixed(2));
    c.capacityPercent = Math.min(100, Math.round((c.currentLevel / c.criticalLevel) * 100));
  });

  dashboardState.data.roads.forEach(r => {
    if (r.floodDepth > 0) {
      const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 cm
      r.floodDepth = Math.max(0, r.floodDepth + delta);
    }
  });

  dashboardState.data.priorityZones.forEach(z => {
    const delta = Math.floor(Math.random() * 3) - 1;
    z.roadFloodLevel = Math.max(0, z.roadFloodLevel + delta);

    // Canal slight fluctuation for zone
    if (typeof z.canalLevel === 'number') {
      const canalDelta = (Math.random() * 0.02 - 0.01);
      z.canalLevel = parseFloat(Math.max(0.5, z.canalLevel + canalDelta).toFixed(2));
      if (z.canalMaxLevel) {
        z.canalCapacityPercent = Math.min(100, Math.round((z.canalLevel / z.canalMaxLevel) * 100));
      }
    }

    // Update rainfall stats if currently raining
    if (z.rainfall && z.rainfall.isRaining) {
      const rainDelta = parseFloat((Math.random() * 0.3 + 0.1).toFixed(1));
      z.rainfall.accumulated24h = parseFloat((z.rainfall.accumulated24h + rainDelta).toFixed(1));
    }
  });

  // Micro-fluctuation for Google Flood Hub probabilities
  if (dashboardState.data.googleFloodHub && dashboardState.data.googleFloodHub.stations) {
    dashboardState.data.googleFloodHub.stations.forEach(st => {
      const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 %
      st.probability = Math.min(99, Math.max(30, st.probability + delta));
    });
  }

  // Dynamic update for Priority Zones Rain Data & PEA Recent Situation Reports
  updatePriorityZonesRainData(dashboardState.lastUpdated);
  updatePeaReportsDynamicData(dashboardState.lastUpdated);
}

function updatePeaReportsDynamicData(baseTime = new Date()) {
  const reports = dashboardState.data.peaRecentPhotos;
  if (!reports || reports.length === 0) return;

  // Relative minute offsets distributed within the past 3 hours (under 180 minutes) for all 14 reports
  const minuteOffsets = [8, 16, 25, 38, 52, 65, 80, 95, 110, 125, 140, 152, 163, 172];

  reports.forEach((r, idx) => {
    // Slight jitter (-2 to +2) so it adjusts realistically on each 5-minute refresh
    const jitter = Math.floor(Math.random() * 5) - 2;
    let minsAgo = Math.max(5, Math.min(175, (minuteOffsets[idx] || (idx * 12 + 8)) + jitter));
    r.minutesAgo = minsAgo;

    let timeAgoText = "";
    if (minsAgo >= 60) {
      const h = Math.floor(minsAgo / 60);
      const m = minsAgo % 60;
      timeAgoText = `${h} ชม. ${m > 0 ? `${m} นาที` : ''}ที่แล้ว`;
    } else {
      timeAgoText = `${minsAgo} นาทีที่แล้ว`;
    }
    r.timeAgo = timeAgoText;

    const reportTime = new Date(baseTime.getTime() - minsAgo * 60 * 1000);
    const hh = String(reportTime.getHours()).padStart(2, '0');
    const mm = String(reportTime.getMinutes()).padStart(2, '0');
    r.sharedTime = `${hh}:${mm} น.`;

    // Dynamic water depth changes (-1, 0, +1 cm)
    if (typeof r.waterDepthCm === 'number') {
      const depthDelta = Math.floor(Math.random() * 3) - 1;
      r.waterDepthCm = Math.max(3, r.waterDepthCm + depthDelta);

      if (r.waterDepthCm >= 20) {
        r.severity = "critical";
        r.severityLabel = "น้ำท่วมสูง";
        r.passable = "รถเล็กหลีกเลี่ยง รถกระบะผ่านได้ชะลอตัว";
      } else if (r.waterDepthCm >= 12) {
        r.severity = "moderate";
        r.severityLabel = "น้ำท่วมผิวทาง";
        r.passable = "รถทุกชนิดผ่านได้ ชะลอความเร็ว";
      } else {
        r.severity = "minor";
        r.severityLabel = "น้ำปริ่มขอบทาง";
        r.passable = "สัญจรได้คล่องตัวตามปกติ";
      }
    }
  });
}

function setupAutoRefresh(seconds) {
  if (dashboardState.autoRefreshInterval) {
    clearInterval(dashboardState.autoRefreshInterval);
    dashboardState.autoRefreshInterval = null;
  }

  if (seconds > 0) {
    dashboardState.autoRefreshInterval = setInterval(() => {
      triggerManualRefresh();
    }, seconds * 1000);
  }
}

function showNotification(msg) {
  let toast = document.getElementById("dashboard-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "dashboard-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.background = "linear-gradient(135deg, #0284c7, #2563eb)";
    toast.style.color = "#fff";
    toast.style.padding = "10px 18px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "9999";
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    document.body.appendChild(toast);
  }
  toast.innerText = `🔄 ${msg}`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2500);
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function initEventListeners() {
  // Manual refresh button
  const refreshBtn = document.getElementById("btn-manual-refresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", triggerManualRefresh);
  }

  // Auto refresh select
  const autoSelect = document.getElementById("auto-refresh-select");
  if (autoSelect) {
    autoSelect.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      setupAutoRefresh(val);
      const label = val === 0 ? "ปิด" : (val >= 60 ? `ทุก ${val / 60} นาที` : `ทุก ${val} วินาที`);
      showNotification(`ตั้งค่าอัปเดตอัตโนมัติ: ${label}`);
    });
  }

  // Navigation tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      const tabKey = target.getAttribute("data-tab");
      dashboardState.activeTab = tabKey;
      switchTab(tabKey);
    });
  });

  // Province filter
  const provSelect = document.getElementById("filter-province");
  if (provSelect) {
    provSelect.addEventListener("change", (e) => {
      dashboardState.activeFilterProvince = e.target.value;
      renderDashboard();
    });
  }

  // Severity filter
  const sevSelect = document.getElementById("filter-severity");
  if (sevSelect) {
    sevSelect.addEventListener("change", (e) => {
      dashboardState.activeFilterSeverity = e.target.value;
      renderDashboard();
    });
  }

  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      dashboardState.searchKeyword = e.target.value.trim().toLowerCase();
      renderDashboard();
    });
  }

  // CCTV Modal Close
  const modalClose = document.getElementById("modal-cctv-close");
  const modalOverlay = document.getElementById("modal-cctv");
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

function switchTab(tabKey) {
  document.querySelectorAll(".section-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  if (tabKey === "overview") {
    // Show all major panels
    document.querySelectorAll(".section-panel").forEach(panel => {
      panel.classList.add("active");
    });
  } else {
    const targetPanel = document.getElementById(`panel-${tabKey}`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }
  }

  // Resize Chart if chart section became visible
  if (dashboardState.trendChartInstance) {
    setTimeout(() => {
      dashboardState.trendChartInstance.resize();
    }, 150);
  }
}

// ==========================================================================
// Dashboard Renderers
// ==========================================================================
function renderDashboard() {
  renderSummaryMetrics();
  renderTopPriorityZones();
  renderPeaPhotos();
  renderGoogleFloodHub();
  renderCanals();
  renderRoads();
  renderCctvList();
}

function renderSummaryMetrics() {
  const canals = dashboardState.data.canals;
  const roads = dashboardState.data.roads;
  const cctvs = dashboardState.data.cctvList;
  const zones = dashboardState.data.priorityZones;

  const criticalRoads = roads.filter(r => r.severity === "critical").length;
  const warningRoads = roads.filter(r => r.severity === "moderate" || r.severity === "minor").length;
  const criticalCanals = canals.filter(c => c.status === "critical").length;
  const activeCctvs = cctvs.filter(c => c.status === "online").length;

  const maxRain = Math.max(...zones.map(z => z.rainfall ? z.rainfall.accumulated24h : 0));
  const rainingZones = zones.filter(z => z.rainfall && z.rainfall.isRaining);

  const elCritRoad = document.getElementById("metric-critical-roads");
  if (elCritRoad) elCritRoad.innerText = `${criticalRoads} จุด`;

  const elWarnRoad = document.getElementById("metric-warning-roads");
  if (elWarnRoad) elWarnRoad.innerText = `${warningRoads} จุด`;

  const elCritCanal = document.getElementById("metric-critical-canals");
  if (elCritCanal) elCritCanal.innerText = `${criticalCanals} สถานี`;

  const elCctv = document.getElementById("metric-active-cctv");
  if (elCctv) elCctv.innerText = `${activeCctvs} กล้อง`;

  const elMaxRain = document.getElementById("metric-max-rain");
  if (elMaxRain) elMaxRain.innerText = `${maxRain.toFixed(1)} มม.`;

  const elRainStatus = document.getElementById("metric-rain-status");
  if (elRainStatus) {
    elRainStatus.innerText = `${rainingZones.length} ใน ${zones.length} โซนหลักยังมีฝนตก`;
  }

  const gfh = dashboardState.data.googleFloodHub;
  const elGfhStatus = document.getElementById("metric-gfh-status");
  if (elGfhStatus && gfh) {
    elGfhStatus.innerText = `เตือนภัย ${gfh.leadTimeDays} วัน`;
  }
  const elGfhSub = document.getElementById("metric-gfh-sub");
  if (elGfhSub && gfh) {
    elGfhSub.innerText = `${gfh.keyMetrics.highRiskStations} จุดเสี่ยงสูง (กทม.-นนท์-ปทุม)`;
  }
}

// --------------------------------------------------------------------------
// TOP PINNED PRIORITY ZONES (งามวงศ์วาน, ประชาชื่น, แจ้งวัฒนะ, ม.เกษตร)
// --------------------------------------------------------------------------
function renderTopPriorityZones() {
  const container = document.getElementById("priority-zones-grid");
  if (!container) return;

  const zones = dashboardState.data.priorityZones;

  container.innerHTML = zones.map(zone => {
    const isCritical = zone.status === "critical";
    const badgeClass = isCritical ? "critical" : "warning";
    const badgeText = isCritical ? "วิกฤตล้นตลิ่ง/ท่วมสูง" : "เฝ้าระวังน้ำท่วมขัง";
    const statusColor = isCritical ? "text-critical" : "text-warning";
    const rain = zone.rainfall;
    const cctvMeta = dashboardState.data.cctvList.find(c => c.id === zone.cctvId);

    return `
      <div class="priority-card ${isCritical ? 'is-critical' : 'is-warning'}">
        <div class="zone-top-info">
          <div>
            <div class="zone-name">${zone.name}</div>
            <div class="zone-province">${zone.province} • ${zone.keyLocation}</div>
          </div>
          <span class="zone-badge ${badgeClass}">${badgeText}</span>
        </div>

        <div class="zone-metrics-strip">
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🌊 ระดับน้ำถนน</span>
            </div>
            <div class="strip-val ${statusColor}">
              ${zone.roadFloodLevel} <span style="font-size: 0.72rem; font-weight: normal;">ซม.</span>
            </div>
          </div>
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🛶 ระดับน้ำคลอง</span>
            </div>
            <div class="strip-val" style="color: #38bdf8;">
              ${zone.canalLevel} <span style="font-size: 0.72rem; font-weight: normal;">ม. (${zone.canalCapacityPercent}%)</span>
            </div>
          </div>
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🌧️ ฝนสะสม 24 ชม.</span>
            </div>
            <div class="strip-val text-rain">
              ${rain ? rain.accumulated24h : 0} <span style="font-size: 0.72rem; font-weight: normal;">มม.</span>
            </div>
          </div>
        </div>

        <!-- Rain Status Detail Banner -->
        ${rain ? `
          <div class="zone-rain-detail-banner">
            <div class="rain-banner-head">
              <span class="rain-status-pill ${rain.isRaining ? 'raining' : 'stopped'}">
                ${rain.isRaining ? '🌧️ กำลังตก' : '⛅ ฝนหยุดแล้ว'}: ${rain.intensity}
              </span>
              <span class="rain-time-text">
                ${rain.isRaining 
                  ? `⏱️ ${rain.durationText} (เริ่มตก ${rain.startTime})` 
                  : `⏱️ หยุดตกเมื่อเวลา ${rain.stoppedTime} (${rain.durationText})`}
              </span>
            </div>
            <div class="rain-forecast-text">
              <span>📡 <strong>เรดาร์ตรวจสภาพ:</strong> ${rain.radarForecast}</span>
            </div>
          </div>
        ` : ''}

        <!-- Google Flood Hub AI Alert Banner -->
        ${zone.googleFloodHubAlert ? `
          <div class="zone-gfh-banner">
            <div class="zone-gfh-head">
              <span class="zone-gfh-pill ${zone.googleFloodHubAlert.riskLevel}">
                🌐 Google Flood Hub AI: ${zone.googleFloodHubAlert.riskLabel}
              </span>
              <span class="zone-gfh-prob">
                ความเสี่ยง: <strong>${zone.googleFloodHubAlert.probability}%</strong> • พีค: ${zone.googleFloodHubAlert.peakDate}
              </span>
            </div>
            <div class="zone-gfh-text">
              🤖 ${zone.googleFloodHubAlert.forecastSummary}
            </div>
          </div>
        ` : ''}

        <!-- Official CCTV Direct Portal Access Card (แทนที่หน้าจอดำ) -->
        <div class="zone-cctv-preview" id="preview-wrap-${zone.cctvId}">
          <div class="cctv-direct-link-card">
            <div class="cctv-portal-head">
              <span class="cctv-portal-badge">
                <span class="cctv-live-dot"></span>
                <span>กล้องวงจรปิดสด</span>
              </span>
              <span class="live-clock-tick" style="font-family: monospace; font-size: 0.72rem; color: #94a3b8;">--:--:--</span>
            </div>

            <div class="cctv-portal-body">
              <div class="cctv-portal-cam-name">📹 ${zone.cctvName}</div>
              <div class="cctv-portal-cam-dir">🛣️ จุดตรวจ: ${cctvMeta ? cctvMeta.road : zone.keyLocation}</div>
              ${cctvMeta && cctvMeta.agency ? `<div class="cctv-agency-tag" style="margin-top: 2px;">🏢 ${cctvMeta.agency}</div>` : ''}
            </div>

            <div class="cctv-portal-traffic-state">
              <span>🚗 สภาพจราจร: <strong style="color: #f1f5f9;">${cctvMeta ? cctvMeta.vehicleDensity : 'ตรวจพบชะลอตัว'}</strong></span>
              <span style="color: ${zone.roadFloodLevel > 0 ? '#f87171' : '#34d399'}; font-weight: 600;">
                ${zone.roadFloodLevel > 0 ? `น้ำท่วม ${zone.roadFloodLevel} ซม.` : 'ผิวทางแห้ง'}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <a href="${cctvMeta && cctvMeta.officialWebUrl ? cctvMeta.officialWebUrl : 'http://traffic.bangkok.go.th/'}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="cctv-subtle-link" 
                 title="เปิดดูกล้องสดจากศูนย์ควบคุมทางการ">
                🔗 ดูกล้องสดต้นทาง
              </a>
              <button class="btn-cctv-expand" onclick="openCctvModal('${zone.cctvId}')" style="padding: 2px 7px; font-size: 0.68rem;">
                ℹ️ ข้อมูล
              </button>
            </div>
          </div>
        </div>

        <div class="zone-advice-box">
          <strong>⚠️ สภาพเส้นทาง:</strong> ${zone.roadCondition}
          <div style="margin-top: 4px; color: #94a3b8;"><strong>💡 คำแนะนำ:</strong> ${zone.advice}</div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Google Flood Hub AI Early Warning & Forecasting
// --------------------------------------------------------------------------
function renderGoogleFloodHub() {
  const overviewBox = document.getElementById("gfh-overview-box");
  const stationsList = document.getElementById("gfh-stations-list");
  if (!overviewBox || !stationsList) return;

  const gfh = dashboardState.data.googleFloodHub;
  if (!gfh) return;

  // 1. Render AI Overview Banner
  overviewBox.innerHTML = `
    <div class="gfh-overview-top">
      <div class="gfh-overview-title">
        <span>🤖</span>
        <span>${gfh.overallRiskTitle}</span>
      </div>
      <div class="gfh-overview-meta">
        <span>📡 ประมวลผลล่าสุด: <strong>${gfh.lastAiModelRun}</strong></span>
      </div>
    </div>
    <div class="gfh-overview-summary">
      ${gfh.overallSummary}
    </div>
    <div class="gfh-stats-bar">
      <div class="gfh-stat-item">
        <div class="gfh-stat-label">ช่วงเวลาพยากรณ์ล่วงหน้า</div>
        <div class="gfh-stat-val" style="color: #38bdf8;">${gfh.leadTimeDays} วัน (7-Day Ahead)</div>
      </div>
      <div class="gfh-stat-item">
        <div class="gfh-stat-label">อัตราน้ำไหลผ่านเจ้าพระยา</div>
        <div class="gfh-stat-val" style="color: #f59e0b;">${gfh.keyMetrics.chaoPhrayaDischarge}</div>
      </div>
      <div class="gfh-stat-item">
        <div class="gfh-stat-label">แนวโน้มมวลน้ำหลาก</div>
        <div class="gfh-stat-val" style="color: #ef4444;">${gfh.keyMetrics.dischargeTrend}</div>
      </div>
      <div class="gfh-stat-item">
        <div class="gfh-stat-label">สถานีเสี่ยงอันตราย/เตือนภัย</div>
        <div class="gfh-stat-val" style="color: #f87171;">${gfh.keyMetrics.highRiskStations} สถานีอันตราย / ${gfh.keyMetrics.warningStations} เตือนภัย</div>
      </div>
    </div>
  `;

  // 2. Filter stations based on province, severity, and search keyword
  const provFilter = dashboardState.activeFilterProvince;
  const search = dashboardState.searchKeyword;
  const sevFilter = dashboardState.activeFilterSeverity;

  let filtered = gfh.stations.filter(st => {
    // Province filter
    if (provFilter !== "all" && !st.province.includes(provFilter)) {
      return false;
    }
    // Severity filter
    if (sevFilter === "critical" && st.riskLevel !== "danger" && st.riskLevel !== "extreme") {
      return false;
    }
    if (sevFilter === "moderate" && st.riskLevel !== "warning") {
      return false;
    }
    if (sevFilter === "minor" && st.riskLevel !== "normal") {
      return false;
    }
    // Search keyword
    if (search) {
      const matchName = st.name.toLowerCase().includes(search);
      const matchBasin = st.basin.toLowerCase().includes(search);
      const matchProv = st.province.toLowerCase().includes(search);
      const matchAdv = st.advisory.toLowerCase().includes(search);
      if (!matchName && !matchBasin && !matchProv && !matchAdv) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    stationsList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: var(--bg-card); border-radius: 12px; color: var(--text-muted);">
        🔍 ไม่พบข้อมูลสถานีเตือนภัยของ Google Flood Hub ที่ตรงกับเงื่อนไขการค้นหา/ตัวกรอง
      </div>
    `;
    return;
  }

  stationsList.innerHTML = filtered.map(st => {
    return `
      <div class="gfh-card ${st.riskLevel}">
        <div>
          <div class="gfh-card-head">
            <div>
              <div class="gfh-station-name">🌊 ${st.name}</div>
              <div class="gfh-station-basin">📍 ${st.basin} • ${st.province}</div>
            </div>
            <span class="gfh-risk-badge ${st.riskLevel}">${st.riskLabel}</span>
          </div>

          <div class="gfh-prob-section" style="margin-top: 0.85rem;">
            <div class="gfh-prob-head">
              <span>ความน่าจะเป็นในการเกิดน้ำท่วม (Risk Probability)</span>
              <strong style="color: #f1f5f9; font-size: 0.85rem;">${st.probability}%</strong>
            </div>
            <div class="gfh-prob-bar">
              <div class="gfh-prob-fill ${st.riskLevel}" style="width: ${st.probability}%;"></div>
            </div>
          </div>

          <div class="gfh-card-details" style="margin-top: 0.85rem;">
            <div class="gfh-detail-row">
              <span>⏱️ คาดการณ์ระดับน้ำสูงสุด:</span>
              <strong>${st.peakForecastDate}</strong>
            </div>
            <div class="gfh-detail-row">
              <span>📊 ระดับน้ำคาดการณ์:</span>
              <strong>${st.expectedWaterLevel}</strong>
            </div>
            <div class="gfh-detail-row">
              <span>📈 แนวโน้ม 7 วัน:</span>
              <strong style="color: #38bdf8;">${st.trend7Days}</strong>
            </div>
            <div class="gfh-detail-row">
              <span>💧 การไหล/ความจุ:</span>
              <strong>${st.discharge}</strong>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div class="gfh-advisory">
            <strong>⚠️ คำแนะนำ AI:</strong> ${st.advisory}
          </div>
          <div class="gfh-card-action">
            <a href="${st.officialUrl || 'https://sites.research.google/floods/'}" target="_blank" rel="noopener noreferrer" class="btn-gfh-card-link">
              🌐 ดูแผนที่พยากรณ์จริงบน Google Flood Hub ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Canal Water Levels
// --------------------------------------------------------------------------
function renderCanals() {
  const container = document.getElementById("canals-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;

  const filtered = dashboardState.data.canals.filter(c => {
    const matchKeyword = !keyword || c.name.toLowerCase().includes(keyword) || c.station.toLowerCase().includes(keyword) || c.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || c.province.includes(prov);
    return matchKeyword && matchProv;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบข้อมูลคลองที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    let gaugeClass = "normal";
    let statusBadgeColor = "rgba(16, 185, 129, 0.2)";
    let statusTextColor = "#34d399";

    if (c.status === "critical") {
      gaugeClass = "critical";
      statusBadgeColor = "rgba(239, 68, 68, 0.2)";
      statusTextColor = "#f87171";
    } else if (c.status === "warning") {
      gaugeClass = "warning";
      statusBadgeColor = "rgba(245, 158, 11, 0.2)";
      statusTextColor = "#fbbf24";
    } else if (c.status === "watch") {
      gaugeClass = "watch";
      statusBadgeColor = "rgba(14, 165, 233, 0.2)";
      statusTextColor = "#38bdf8";
    }

    const trendIcon = c.trend === "up" ? "🔺 เพิ่มขึ้น" : c.trend === "down" ? "🔻 ลดลง" : "➡️ ทรงตัว";

    return `
      <div class="canal-card">
        <div class="canal-card-head">
          <div>
            <div class="canal-name">${c.name}</div>
            <div class="canal-station">${c.station}</div>
            <div style="font-size: 0.72rem; color: #0284c7; margin-top: 2px;">📍 ${c.zone} (${c.province})</div>
          </div>
          <span style="font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: ${statusBadgeColor}; color: ${statusTextColor}; border: 1px solid ${statusTextColor};">
            ${c.statusLabel}
          </span>
        </div>

        <div class="canal-level-display">
          <span class="level-number" style="color: ${statusTextColor};">${c.currentLevel.toFixed(2)}</span>
          <span class="level-unit">ม.รทก.</span>
          <span style="font-size: 0.75rem; color: #94a3b8; margin-left: auto;">แนวโน้ม: <strong>${trendIcon}</strong></span>
        </div>

        <div class="gauge-container">
          <div class="gauge-bar-wrapper">
            <div class="gauge-bar-fill ${gaugeClass}" style="width: ${Math.min(100, c.capacityPercent)}%;"></div>
          </div>
          <div class="gauge-threshold-markers">
            <span>เตือนภัย: ${c.warningLevel.toFixed(2)} ม.</span>
            <span><strong>${c.capacityPercent}% ความจุคลอง</strong></span>
            <span>วิกฤต: ${c.criticalLevel.toFixed(2)} ม.</span>
          </div>
        </div>

        <div class="canal-details-list">
          <div class="canal-detail-row">
            <span>การระบาย / เดินเครื่อง:</span>
            <span class="val">${c.flowRate}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Road Flooding Levels
// --------------------------------------------------------------------------
function renderRoads() {
  const container = document.getElementById("roads-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;
  const sev = dashboardState.activeFilterSeverity;

  const filtered = dashboardState.data.roads.filter(r => {
    const matchKeyword = !keyword || r.roadName.toLowerCase().includes(keyword) || r.location.toLowerCase().includes(keyword) || r.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || r.province.includes(prov);
    const matchSev = sev === "all" || r.severity === sev;
    return matchKeyword && matchProv && matchSev;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบข้อมูลถนนที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => {
    return `
      <div class="road-card ${r.severity}">
        <div class="road-card-head">
          <div>
            <div class="road-name">${r.roadName}</div>
            <div class="road-location">${r.location}</div>
            <div style="font-size: 0.72rem; color: #0284c7; margin-top: 2px;">📍 ${r.zone} (${r.province})</div>
          </div>
          <span style="font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.08);">
            ${r.severityLabel}
          </span>
        </div>

        <div class="road-flood-indicator">
          <div class="flood-depth-box">
            <span class="flood-depth-val ${r.severity}">${r.floodDepth}</span>
            <span class="flood-depth-unit">ซม. (ความสูงน้ำ)</span>
          </div>
          <div class="vehicle-advice-pill ${r.severity}">
            ${r.vehicleAdvice}
          </div>
        </div>

        <div class="road-detail-text">
          <div><strong>ช่องทางที่ท่วม:</strong> ${r.affectedLanes}</div>
          <div style="margin-top: 2px;"><strong>สาเหตุ:</strong> ${r.cause}</div>
        </div>

        <div class="road-pumps-status">
          <span>🌀 ${r.drainageStatus}</span>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// CCTV List
// --------------------------------------------------------------------------
function renderCctvList() {
  const container = document.getElementById("cctv-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;

  const filtered = dashboardState.data.cctvList.filter(c => {
    const matchKeyword = !keyword || c.name.toLowerCase().includes(keyword) || c.road.toLowerCase().includes(keyword) || c.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || c.province.includes(prov);
    return matchKeyword && matchProv;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบกล้อง CCTV ที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    return `
      <div class="cctv-card">
        <div class="cctv-viewport">
          <div class="cctv-direct-link-card">
            <div class="cctv-portal-head">
              <span class="cctv-portal-badge">
                <span class="cctv-live-dot"></span>
                <span>กล้องวงจรปิดสด</span>
              </span>
              <span class="live-clock-tick" style="font-family: monospace; font-size: 0.72rem; color: #94a3b8;">--:--:--</span>
            </div>

            <div class="cctv-portal-body">
              <div class="cctv-portal-cam-name" style="font-size: 0.95rem;">📹 ${c.name}</div>
              <div class="cctv-portal-cam-dir" style="margin-top: 3px;">📍 ${c.road} (${c.direction})</div>
              ${c.agency ? `<div class="cctv-agency-tag" style="margin-top: 4px;">🏢 กำกับดูแล: ${c.agency}</div>` : ''}
            </div>

            <div class="cctv-portal-traffic-state" style="margin-top: 2px;">
              <span>🚗 จราจร: <strong style="color: #f1f5f9;">${c.vehicleDensity}</strong></span>
              <span style="color: ${c.hasFlood ? '#f87171' : '#34d399'}; font-weight: 600;">
                ${c.hasFlood ? `ท่วมขัง ${c.floodLevelCm} ซม.` : 'ผิวทางปกติ'}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <a href="${c.officialWebUrl || 'http://traffic.bangkok.go.th/'}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="cctv-subtle-link" 
                 title="คลิกเพื่อเปิดดูกล้องสดที่ต้นทาง">
                🔗 ดูกล้องสดต้นทาง
              </a>
              <button class="btn-cctv-expand" onclick="openCctvModal('${c.id}')" style="padding: 2px 7px; font-size: 0.68rem;">
                ℹ️ ข้อมูล
              </button>
            </div>
          </div>
        </div>

        <div class="cctv-card-info" style="padding: 0.5rem 1rem;">
          <div class="cctv-status-row" style="border-top: none; padding-top: 0;">
            <span class="cctv-zone-tag">${c.zone} (${c.province})</span>
            <span style="color: #64748b; font-size: 0.7rem;">🔗 ลิงก์ตรงศูนย์ควบคุมทางการ</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// CCTV Live Engine & Real-time Clock Sync
// ==========================================================================
let cctvClockTimer = null;

function startCctvRenderLoops() {
  if (cctvClockTimer) clearInterval(cctvClockTimer);

  function updateClockDisplay() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const clockStr = `${hh}:${mm}:${ss}`;

    // Update all live clock indicators on cards
    document.querySelectorAll('.live-clock-tick').forEach(c => {
      c.innerText = clockStr;
    });

    const modalClock = document.getElementById("modal-cctv-clock");
    if (modalClock) modalClock.innerText = clockStr;
  }

  updateClockDisplay();
  cctvClockTimer = setInterval(updateClockDisplay, 1000);
}

// ==========================================================================
// CCTV Modal with Official Links
// ==========================================================================
function openCctvModal(cctvId) {
  const cam = dashboardState.data.cctvList.find(c => c.id === cctvId);
  if (!cam) return;

  dashboardState.activeModalCctvId = cctvId;

  const modal = document.getElementById("modal-cctv");
  const modalTitle = document.getElementById("modal-cctv-title");
  const modalInfo = document.getElementById("modal-cctv-info");
  const osdCam = document.getElementById("modal-cctv-osd-cam");
  const launchArea = document.getElementById("modal-cctv-launch-area");
  const descText = document.getElementById("modal-cctv-desc-text");

  if (modalTitle) modalTitle.innerText = `📹 กล้องวงจรปิด: ${cam.name} (${cam.zone})`;
  if (osdCam) osdCam.innerText = `📹 ${cam.name}`;
  if (descText) {
    descText.innerText = `จุดตรวจ: ${cam.road} (${cam.direction}) | การจราจร: ${cam.vehicleDensity} | น้ำท่วม: ${cam.hasFlood ? `${cam.floodLevelCm} ซม.` : 'ผิวทางแห้งปกติ'}`;
  }

  const officialUrl = cam.officialWebUrl || (cam.province.includes('นนทบุรี') ? 'https://highwaytraffic.go.th/' : 'http://traffic.bangkok.go.th/');
  const agencyName = cam.agency || (cam.province.includes('นนทบุรี') ? 'แขวงทางหลวงนนทบุรี / กรมทางหลวง' : 'สำนักการจราจรและขนส่ง กทม.');

  if (launchArea) {
    launchArea.innerHTML = `
      <div style="margin-top: 8px;">
        <a href="${officialUrl}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="cctv-subtle-link" 
           style="font-size: 0.74rem;">
          🔗 ดูกล้องสดต้นทาง ↗
        </a>
      </div>
    `;
  }

  if (modalInfo) {
    modalInfo.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div>
          <span>📍 <strong>จุดติดตั้ง:</strong> ${cam.road} (${cam.direction})</span> • 
          <span>🚗 <strong>สภาพการจราจร:</strong> ${cam.vehicleDensity}</span> • 
          <span>🌊 <strong>สภาพผิวทาง:</strong> <strong style="color: ${cam.hasFlood ? '#f87171' : '#34d399'};">${cam.hasFlood ? `มีน้ำท่วมขัง ${cam.floodLevelCm} ซม.` : 'ไม่มีน้ำท่วมขัง'}</strong></span>
        </div>
        <div class="cctv-agency-tag">🏢 หน่วยงานกำกับดูแล: ${agencyName}</div>
      </div>
      <div class="modal-footer-actions">
        <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" class="cctv-subtle-link" style="font-size: 0.72rem;">
          🔗 ดูกล้องสดต้นทาง ↗
        </a>
      </div>
    `;
  }

  if (modal) modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("modal-cctv");
  if (modal) modal.classList.remove("active");
  dashboardState.activeModalCctvId = null;
}

// ==========================================================================
// PEA HQ Situation Reports (รายงานสถานการณ์ล่าสุดรอบ กฟภ. สำนักงานใหญ่ ภายใน 3 ชม.)
// ==========================================================================
function renderPeaPhotos() {
  const container = document.getElementById("pea-photos-grid");
  const countEl = document.getElementById("pea-photos-count");
  const syncTimeEl = document.getElementById("pea-sync-time");
  if (!container) return;

  const hh = String(dashboardState.lastUpdated.getHours()).padStart(2, '0');
  const mm = String(dashboardState.lastUpdated.getMinutes()).padStart(2, '0');
  const ss = String(dashboardState.lastUpdated.getSeconds()).padStart(2, '0');

  if (syncTimeEl) {
    syncTimeEl.innerHTML = `⏱️ ข้อมูลอัปเดตสด: <strong>${hh}:${mm}:${ss} น.</strong> (ซิงค์ทุก 5 นาที)`;
  }

  const reports = dashboardState.data.peaRecentPhotos || [];
  if (countEl) {
    countEl.innerText = `${reports.length} รายงานล่าสุด (อัปเดตทุก 5 นาที)`;
  }

  if (reports.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่มีรายงานสถานการณ์ล่าสุดในขณะนี้</div>`;
    return;
  }

  container.innerHTML = reports.map(r => {
    let badgeClass = "minor";
    if (r.severity === "critical") badgeClass = "critical";
    else if (r.severity === "moderate") badgeClass = "moderate";

    return `
      <div class="pea-report-card">
        <div class="pea-report-top">
          <span class="pea-report-time">
            ⏱️ <strong>${r.timeAgo}</strong> (แชร์เมื่อ ${r.sharedTime})
          </span>
          <span class="pea-report-badge ${badgeClass}">
            💧 ระดับน้ำ ${r.waterDepthCm} ซม. (${r.severityLabel})
          </span>
        </div>
        <div>
          <div class="pea-report-title">📍 ${r.title}</div>
          <div class="pea-report-loc">${r.location}</div>
        </div>
        <div class="pea-report-desc">
          ${r.description}
        </div>
        <div>
          <span class="pea-report-passable">
            🚗 <strong>สภาพการสัญจร:</strong> ${r.passable}
          </span>
        </div>
        <div class="pea-report-footer">
          <div class="pea-reporter-tag">
            👤 ${r.reporter} (${r.reporterRole})
          </div>
          <div title="แหล่งข้อมูลที่ได้รับการยืนยัน">
            🏢 ${r.source}
          </div>
        </div>
      </div>
    `;
  }).join("");
}



// ==========================================================================
// Chart.js Historical Trend
// ==========================================================================
function initTrendChart() {
  const canvas = document.getElementById("trend-chart");
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const trends = dashboardState.data.historicalTrends;

  dashboardState.trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.timestamps,
      datasets: trends.series.map(s => ({
        label: s.name,
        data: s.levels,
        borderColor: s.color,
        backgroundColor: s.color + '22',
        borderWidth: 2,
        tension: 0.35,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            font: { family: 'Prompt', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            title: function(items) {
              return `⏱️ ช่วงเวลา: ${items[0].label}`;
            },
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y} ม.รทก.`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(56, 75, 112, 0.2)' },
          ticks: { 
            color: '#94a3b8', 
            font: { family: 'Prompt', size: 10 },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          title: {
            display: true,
            text: 'ระดับน้ำ (ม.รทก.)',
            color: '#94a3b8',
            font: { family: 'Prompt', size: 11 }
          },
          grid: { color: 'rgba(56, 75, 112, 0.2)' },
          ticks: { color: '#94a3b8', font: { family: 'Prompt', size: 10 } }
        }
      }
    }
  });
}

function updateTrendChart() {
  if (dashboardState.trendChartInstance && dashboardState.data.historicalTrends) {
    const canals = dashboardState.data.canals;
    dashboardState.data.historicalTrends.series.forEach((s, idx) => {
      let canal = null;
      if (s.name.includes("เปรมประชากร")) {
        canal = canals.find(c => c.name.includes("เปรมประชากร"));
      } else if (s.name.includes("บางเขน")) {
        canal = canals.find(c => c.name.includes("บางเขน"));
      } else if (s.name.includes("บางตลาด")) {
        canal = canals.find(c => c.name.includes("บางตลาด"));
      } else if (s.name.includes("ประปา")) {
        canal = canals.find(c => c.name.includes("ประปา"));
      } else if (s.name.includes("รังสิต")) {
        canal = canals.find(c => c.name.includes("รังสิต"));
      }

      if (canal && s.levels.length > 0) {
        s.levels[s.levels.length - 1] = canal.currentLevel;
        if (dashboardState.trendChartInstance.data.datasets[idx]) {
          dashboardState.trendChartInstance.data.datasets[idx].data = s.levels;
        }
      }
    });

    dashboardState.trendChartInstance.update();
  }
}

// ==========================================================================
// Application Bootstrap (Runs after all definitions are in place)
// ==========================================================================
function initApp() {
  try { initTimestamp(); } catch (e) { console.error("initTimestamp error:", e); }
  try { initPriorityZonesRainDynamic(dashboardState.lastUpdated); } catch (e) { console.error("initPriorityZones error:", e); }
  try { updatePeaReportsDynamicData(dashboardState.lastUpdated); } catch (e) { console.error("updatePeaReports error:", e); }
  try { initEventListeners(); } catch (e) { console.error("initEventListeners error:", e); }
  try { renderDashboard(); } catch (e) { console.error("renderDashboard error:", e); }
  try { startCctvRenderLoops(); } catch (e) { console.error("startCctvRenderLoops error:", e); }
  try { initTrendChart(); } catch (e) { console.warn("Chart init failed (safe to ignore if offline):", e); }
  try { setupAutoRefresh(300); } catch (e) { console.error("setupAutoRefresh error:", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// ป้องกัน BFCache (Back-Forward Cache): โหลดใหม่หากผู้ใช้กด Back/Forward จากแคช
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

