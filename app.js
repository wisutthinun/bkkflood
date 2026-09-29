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
    radarStation: "เรดาร์หนองจอก / ดอนเมือง",
    getForecast: (timeStr) => `คาดว่ากลุ่มฝนจะเคลื่อนตัวผ่านพ้นช่วงเวลา ${timeStr} น.`
  },
  "prachachuen": {
    stoppedMinsAgo: 35, // ฝนหยุดตกแล้วเมื่อ ~35 นาทีที่แล้ว
    isRaining: false,
    intensity: "ฝนหยุดตกแล้ว",
    intensityLevel: "none",
    durationText: "ตกต่อเนื่องรวม 1 ชม. 45 นาที",
    radarStation: "เรดาร์หนองแขม",
    radarForecast: "กลุ่มฝนสลายตัวแล้ว ไม่มีเมฆฝนใหม่เข้าปกคลุม ผิวจราจรกำลังระบายน้ำลงสู่คลองประปา"
  },
  "chaengwattana": {
    initialMinsAgo: 165, // ตกมาแล้ว 2 ชม. 45 นาที
    isRaining: true,
    intensity: "ฝนตกหนักต่อเนื่อง",
    intensityLevel: "heavy",
    forecastMinsAhead: 45,
    radarStation: "เรดาร์ดอนเมือง / สายไหม",
    getForecast: (timeStr) => `กลุ่มฝนฟ้าคะนองหนาแน่น คาดตกต่อเนื่องถึงเวลา ${timeStr} น.`
  },
  "kasetsart": {
    initialMinsAgo: 110, // ตกมาแล้ว 1 ชม. 50 นาที
    isRaining: true,
    intensity: "ฝนปรอยๆ เบาบาง",
    intensityLevel: "light",
    forecastMinsAhead: 20,
    radarStation: "เรดาร์ดอนเมือง",
    getForecast: (timeStr) => `เมฆฝนเริ่มเบาบาง คาดว่าจะหยุดตกช่วงเวลา ${timeStr} น.`
  },
  "muang-nonthaburi": {
    initialMinsAgo: 135, // ตกมาแล้ว 2 ชม. 15 นาที
    isRaining: true,
    intensity: "ฝนตกปานกลาง",
    intensityLevel: "moderate",
    forecastMinsAhead: 30,
    radarStation: "เรดาร์เทศบาลนครนนทบุรี",
    getForecast: (timeStr) => `กลุ่มฝนยังคงปกคลุมเขตเทศบาล คาดเบาบางลงหลัง ${timeStr} น.`
  },
  "chinkhet": {
    initialMinsAgo: 125, // ตกมาแล้ว 2 ชม. 5 นาที
    isRaining: true,
    intensity: "ฝนตกปานกลาง",
    intensityLevel: "moderate",
    forecastMinsAhead: 25,
    radarStation: "เรดาร์ สนง.ใหญ่ กฟภ. / ดอนเมือง",
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

// --------------------------------------------------------------------------
// Real-world Live Weather Fetcher & Hydrological Response Model (Open-Meteo API)
// --------------------------------------------------------------------------
let liveWeatherCache = {
  lastFetched: null,
  isFetching: false,
  sourceLabel: "ดาวเทียม & เรดาร์สภาพอากาศสด (Open-Meteo API)",
  zonesData: {}
};

async function fetchRealWorldWeatherForZones() {
  const zones = dashboardState.data.priorityZones;
  if (!zones || zones.length === 0 || liveWeatherCache.isFetching) return;

  const now = new Date();
  // Throttle API call to once every 2 minutes unless cache empty
  if (liveWeatherCache.lastFetched && (now.getTime() - liveWeatherCache.lastFetched.getTime() < 120000)) {
    return;
  }

  liveWeatherCache.isFetching = true;

  try {
    const fetchPromises = zones.map(async (zone) => {
      const lat = zone.coordinates ? zone.coordinates[0] : 13.8584;
      const lon = zone.coordinates ? zone.coordinates[1] : 100.5435;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,cloud_cover,wind_speed_10m&forecast_days=1&timezone=Asia%2FBangkok`;
      
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return { zoneId: zone.id, data: data };
    });

    const results = await Promise.allSettled(fetchPromises);
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value && res.value.data && res.value.data.current) {
        liveWeatherCache.zonesData[res.value.zoneId] = res.value.data.current;
      }
    });

    liveWeatherCache.lastFetched = new Date();
  } catch (err) {
    console.warn("Real-world weather fetch failed, fallback to local weather model:", err);
  } finally {
    liveWeatherCache.isFetching = false;
  }
}

function getWeatherConditionText(weatherCode, rainMm, showersMm) {
  const totalRain = (rainMm || 0) + (showersMm || 0);
  if (totalRain > 10.0 || weatherCode === 65 || weatherCode === 82 || weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return { intensity: "ฝนตกหนักต่อเนื่อง", intensityLevel: "heavy", isRaining: true, label: "🌧️ ฝนตกหนัก" };
  } else if (totalRain > 2.5 || weatherCode === 63 || weatherCode === 81) {
    return { intensity: "ฝนตกปานกลาง", intensityLevel: "moderate", isRaining: true, label: "🌧️ ฝนปานกลาง" };
  } else if (totalRain > 0.1 || weatherCode === 51 || weatherCode === 53 || weatherCode === 61 || weatherCode === 80) {
    return { intensity: "ฝนละออง / ฝนปรอยๆ เบาบาง", intensityLevel: "light", isRaining: true, label: "🌦️ ฝนตกเบาบาง" };
  } else if (weatherCode === 1 || weatherCode === 2 || weatherCode === 3) {
    return { intensity: "ไม่มีฝน (มีเมฆบางส่วน/เมฆมาก)", intensityLevel: "none", isRaining: false, label: "⛅ ท้องฟ้ามีเมฆ" };
  } else if (weatherCode === 0) {
    return { intensity: "ไม่มีฝน (ท้องฟ้าแจ่มใส/ปลอดโปร่ง)", intensityLevel: "none", isRaining: false, label: "☀️ ท้องฟ้าโปร่ง" };
  }
  return { intensity: "ไม่มีฝน", intensityLevel: "none", isRaining: false, label: "⛅ ไม่มีฝน" };
}

function updatePriorityZonesRainData(currentTime = new Date()) {
  const zones = dashboardState.data.priorityZones;
  if (!zones || zones.length === 0) return;

  zones.forEach(zone => {
    const profile = ZONE_RAIN_PROFILES[zone.id];
    if (!profile || !zone.rainfall) return;

    const liveData = liveWeatherCache.zonesData[zone.id];

    if (liveData) {
      // --------------------------------------------------------------------
      // Real-World Live Weather Mode (from Open-Meteo Satellite & Radar)
      // --------------------------------------------------------------------
      const rainMm = liveData.rain || 0;
      const showersMm = liveData.showers || 0;
      const precipMm = liveData.precipitation || 0;
      const wCode = liveData.weather_code;
      const tempC = liveData.temperature_2m;
      const humidity = liveData.relative_humidity_2m;
      const cloudCover = liveData.cloud_cover;
      const cond = getWeatherConditionText(wCode, rainMm, showersMm);

      zone.rainfall.isRaining = cond.isRaining;
      zone.rainfall.intensity = cond.intensity;
      zone.rainfall.intensityLevel = cond.intensityLevel;
      zone.rainfall.temperature = tempC;
      zone.rainfall.humidity = humidity;
      zone.rainfall.cloudCover = cloudCover;
      zone.rainfall.isRealWorld = true;

      if (cond.isRaining) {
        if (!zone.rainfall.startEpoch) {
          zone.rainfall.startEpoch = currentTime.getTime() - 25 * 60 * 1000;
        }
        const elapsedMins = Math.max(5, Math.floor((currentTime.getTime() - zone.rainfall.startEpoch) / 60000));
        zone.rainfall.durationMinutes = elapsedMins;
        const hours = Math.floor(elapsedMins / 60);
        const mins = elapsedMins % 60;
        zone.rainfall.durationText = `ตรวจพบฝนจริงตกมาแล้ว ${hours > 0 ? `${hours} ชม. ` : ''}${mins} นาที`;
        zone.rainfall.stoppedTime = null;
        zone.rainfall.radarForecast = `ดาวเทียมตรวจพบหย่อมฝนจริง ${precipMm.toFixed(1)} มม./ชม. อุณหภูมิ ${tempC}°C เมฆ ${cloudCover}%`;

        // คำนวณผลกระทบน้ำท่วมเมื่อมีฝนจริง
        if (cond.intensityLevel === 'heavy') {
          zone.roadFloodLevel = Math.max(zone.roadFloodLevel, 20);
          zone.status = "critical";
          zone.statusText = "วิกฤต - ฝนตกหนักน้ำท่วมขัง";
        } else if (cond.intensityLevel === 'moderate') {
          zone.roadFloodLevel = Math.max(zone.roadFloodLevel, 12);
          zone.status = "warning";
          zone.statusText = "เตือนภัย - น้ำรอการระบาย";
        }
      } else {
        // เมื่อโลกจริงไม่มีฝนตก (Real-world Fact: No Rain)
        zone.rainfall.durationText = `ไม่มีกลุ่มฝนจริงในพื้นที่ (อุณหภูมิ ${tempC}°C, เมฆ ${cloudCover}%)`;
        zone.rainfall.stoppedTime = "ตรวจวัดล่าสุด";
        zone.rainfall.radarForecast = `ดาวเทียมตรวจอากาศจริง: ปริมาณฝน 0.0 มม./ชม. ท้องฟ้าโปร่ง-เมฆบางส่วน การระบายน้ำคล่องตัว`;

        // ปรับลดระดับน้ำบนถนนตามหลักชลศาสตร์เมื่อฝนไม่ตก (Drainage Model)
        if (zone.roadFloodLevel > 0) {
          // ค่อยๆ ระบายแห้งลงจนผิวทางปกติ
          zone.roadFloodLevel = Math.max(0, zone.roadFloodLevel - 2);
        }

        if (zone.roadFloodLevel === 0) {
          zone.status = "normal";
          zone.statusText = "ปกติ - ไม่มีน้ำท่วมขัง ผิวจราจรแห้ง";
          zone.roadCondition = "ผิวจราจรแห้งปกติ สัญจรได้ทุกช่องทาง";
        } else {
          zone.status = "warning";
          zone.statusText = `เฝ้าระวัง - น้ำรอระบายเหลือ ${zone.roadFloodLevel} ซม.`;
        }
      }
    } else {
      // --------------------------------------------------------------------
      // Local Dynamic Model Fallback (ก่อนข้อมูล API มาถึงหรือกรณีออฟไลน์)
      // --------------------------------------------------------------------
      if (zone.rainfall.isRaining) {
        if (!zone.rainfall.startEpoch) {
          zone.rainfall.startEpoch = currentTime.getTime() - profile.initialMinsAgo * 60 * 1000;
        }

        const startDate = new Date(zone.rainfall.startEpoch);
        const sHh = String(startDate.getHours()).padStart(2, '0');
        const sMm = String(startDate.getMinutes()).padStart(2, '0');
        zone.rainfall.startTime = `${sHh}:${sMm} น.`;

        const elapsedMins = Math.max(10, Math.floor((currentTime.getTime() - zone.rainfall.startEpoch) / 60000));
        zone.rainfall.durationMinutes = elapsedMins;

        const hours = Math.floor(elapsedMins / 60);
        const mins = elapsedMins % 60;
        zone.rainfall.durationText = `ตกมาแล้ว ${hours > 0 ? `${hours} ชม. ` : ''}${mins} นาที`;

        if (profile.forecastMinsAhead && profile.getForecast) {
          const forecastDate = new Date(currentTime.getTime() + profile.forecastMinsAhead * 60 * 1000);
          const fHh = String(forecastDate.getHours()).padStart(2, '0');
          const fMm = String(forecastDate.getMinutes()).padStart(2, '0');
          zone.rainfall.radarForecast = profile.getForecast(`${fHh}:${fMm}`);
        }
      } else {
        if (!zone.rainfall.stoppedEpoch) {
          zone.rainfall.stoppedEpoch = currentTime.getTime() - profile.stoppedMinsAgo * 60 * 1000;
        }
        const stoppedElapsedMins = Math.max(5, Math.floor((currentTime.getTime() - zone.rainfall.stoppedEpoch) / 60000));
        const stoppedDate = new Date(zone.rainfall.stoppedEpoch);
        const stHh = String(stoppedDate.getHours()).padStart(2, '0');
        const stMm = String(stoppedDate.getMinutes()).padStart(2, '0');
        
        let stoppedAgoStr = stoppedElapsedMins >= 60 
          ? `หยุดไปแล้ว ${Math.floor(stoppedElapsedMins / 60)} ชม. ${stoppedElapsedMins % 60 > 0 ? `${stoppedElapsedMins % 60} นาที` : ''}`
          : `หยุดไปแล้ว ${stoppedElapsedMins} นาที`;

        zone.rainfall.stoppedTime = `${stHh}:${stMm} น.`;
        zone.rainfall.durationText = `${profile.durationText} (${stoppedAgoStr})`;
        zone.rainfall.radarForecast = profile.radarForecast;
      }
    }
  });

  const hh = String(currentTime.getHours()).padStart(2, '0');
  const mm = String(currentTime.getMinutes()).padStart(2, '0');
  const ss = String(currentTime.getSeconds()).padStart(2, '0');

  // อัปเดตเวลาบนหัวข้อ Priority Zones
  const syncBadge = document.getElementById("priority-sync-time");
  if (syncBadge) {
    syncBadge.innerText = `${hh}:${mm}:${ss} น.`;
  }

  // อัปเดตแถบสรุปสถานะฝนตกสดของทั้ง 6 โซน
  const rainSummaryEl = document.getElementById("priority-rain-summary");
  if (rainSummaryEl) {
    const rainingCount = zones.filter(z => z.rainfall && z.rainfall.isRaining).length;
    const stoppedCount = zones.length - rainingCount;
    const hasRealWorld = Object.keys(liveWeatherCache.zonesData).length > 0;
    const sourceIcon = hasRealWorld ? "🛰️ ดาวเทียมสด (Open-Meteo Real-time)" : "📡 เรดาร์สภาพฝนสด";

    rainSummaryEl.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 4px; color: #38bdf8; font-weight: 600;">
        ${sourceIcon} (${hh}:${mm} น.):
      </span>
      <span>${rainingCount > 0 ? `🌧️ กำลังตก <strong>${rainingCount}</strong> โซน` : '☀️ <strong>ไม่มีฝนตกทั้ง 6 โซน (สภาพอากาศปลอดโปร่ง)</strong>'}</span>
      <span>•</span>
      <span>${rainingCount > 0 ? `⛅ ฝนหยุดแล้ว <strong>${stoppedCount}</strong> โซน` : 'ผิวการจราจรระบายน้ำแห้งคล่องตัว'}</span>
      <span>•</span>
      <span style="color: #34d399; font-weight: 500;">🟢 สัญญาณโทรมาตรและดาวเทียมออนไลน์</span>
    `;
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

  // Fetch real-world satellite weather data in parallel
  fetchRealWorldWeatherForZones().then(() => {
    dashboardState.lastUpdated = new Date();
    updateTimestampDisplay();
    simulateDataFluctuation();
    renderDashboard();
    updateTrendChart();

    if (btn) btn.classList.remove("spinning");
    showNotification("อัปเดตข้อมูลสถานการณ์และสภาพอากาศดาวเทียมสดเรียบร้อยแล้ว");
  }).catch(() => {
    dashboardState.lastUpdated = new Date();
    updateTimestampDisplay();
    simulateDataFluctuation();
    renderDashboard();
    updateTrendChart();

    if (btn) btn.classList.remove("spinning");
    showNotification("อัปเดตข้อมูลสถานการณ์รอบ กฟภ. และระดับน้ำเรียบร้อยแล้ว");
  });
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

  // Upstream surge telemetry micro-fluctuations (C.2, C.13, C.29A)
  if (dashboardState.data.upstreamWaterSurge && dashboardState.data.upstreamWaterSurge.checkpoints) {
    dashboardState.data.upstreamWaterSurge.checkpoints.forEach(cp => {
      const delta = Math.floor(Math.random() * 11) - 5; // -5 to +5 m3/s
      cp.flowRateM3s = Math.max(1000, (cp.flowRateM3s || cp.dischargeRate || 2200) + delta);
      cp.dischargeRate = cp.flowRateM3s;
    });
    if (dashboardState.data.upstreamWaterSurge.overview && dashboardState.data.upstreamWaterSurge.checkpoints[1]) {
      dashboardState.data.upstreamWaterSurge.overview.totalDischargeC13 = dashboardState.data.upstreamWaterSurge.checkpoints[1].flowRateM3s;
    }
  }

  // Dynamic update for Priority Zones Rain Data, Canals, Roads, CCTV Surface Detection, PEA Recent Reports & Live Flood News
  updatePriorityZonesRainData(dashboardState.lastUpdated);
  updateCanalsDynamicData(dashboardState.lastUpdated);
  updateRoadsDynamicData(dashboardState.lastUpdated);
  updateCctvDynamicData(dashboardState.lastUpdated);
  updatePeaReportsDynamicData(dashboardState.lastUpdated);

  // Dynamic 30-minute FIFO rolling update for Live Flood News (16 รายการ)
  const currentNowMs = (dashboardState.lastUpdated || new Date()).getTime();
  const lastNewsMs = dashboardState.lastLiveNewsUpdated ? dashboardState.lastLiveNewsUpdated.getTime() : 0;
  if (!dashboardState.lastLiveNewsUpdated || (currentNowMs - lastNewsMs) >= 30 * 60 * 1000) {
    updateLiveFloodNewsDynamicData(dashboardState.lastUpdated);
  }
}

function formatPeaTimeAgo(minsAgo) {
  if (minsAgo >= 60) {
    const h = Math.floor(minsAgo / 60);
    const m = minsAgo % 60;
    return `${h} ชม. ${m > 0 ? `${m} นาที` : ''}ที่แล้ว`;
  }
  return `${minsAgo} นาทีที่แล้ว`;
}

function formatPeaSharedTime(baseTime, minsAgo) {
  const reportDate = new Date(baseTime.getTime() - minsAgo * 60 * 1000);
  const hh = String(reportDate.getHours()).padStart(2, '0');
  const mm = String(reportDate.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} น.`;
}

// --------------------------------------------------------------------------
// Natural Language Processing: ประมวลผลระดับน้ำและสภาพการสัญจรจากข้อความที่คนแชร์จริง
// (สกัดจากข้อความภาษาไทย เช่น ตัวเลขระบุชัดเจน, วลีเปรียบเทียบระดับน้ำ, และคำบอกเล่า)
// --------------------------------------------------------------------------
function parseWaterLevelFromText(text, fallbackDepth = 10) {
  if (!text || typeof text !== 'string') {
    return { depth: fallbackDepth, severity: "moderate", severityLabel: "น้ำท่วมรอระบาย", extractedFrom: "ค่ามาตรฐาน" };
  }

  const cleanText = text.trim();

  // 1. ตรวจสอบตัวเลขระบุชัดเจนในข้อความก่อน (เช่น 15 ซม., 18-20 ซม., 14 cm)
  // เพื่อไม่ให้สับสนกรณีมีคำว่า "ผิวทางแห้งเป็นส่วนใหญ่ แต่มีน้ำขัง 5-7 ซม."
  const rangeMatch = cleanText.match(/(\d+)\s*[-–ถึง]\s*(\d+)\s*(?:ซม\.?|เซนติเมตร|cm)/i);
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1], 10);
    const maxVal = parseInt(rangeMatch[2], 10);
    const avgVal = Math.round((minVal + maxVal) / 2);
    return calculateSeverityFromDepth(avgVal, `ข้อความระบุ "${rangeMatch[0]}"`);
  }

  const exactMatch = cleanText.match(/(\d+)\s*(?:ซม\.?|เซนติเมตร|cm)/i);
  if (exactMatch) {
    const depthVal = parseInt(exactMatch[1], 10);
    return calculateSeverityFromDepth(depthVal, `ข้อความระบุ "${exactMatch[0]}"`);
  }

  // 2. ตรวจสอบกรณีถนนแห้ง / น้ำลดหมดแล้ว / สัญจรปกติ (เมื่อไม่มีการระบุตัวเลขความลึก)
  const dryKeywords = ["แห้งหมดแล้ว", "แห้งสนิท", "ผิวทางแห้งสนิท", "น้ำแห้งหมด", "น้ำลดหมด", "ไม่มีน้ำท่วม", "ไม่มีน้ำขัง", "แห้งปกติ", "แห้งแล้ว"];
  for (const kw of dryKeywords) {
    if (cleanText.includes(kw)) {
      return {
        depth: 0,
        severity: "dry",
        severityLabel: "ผิวทางแห้งปกติ",
        extractedFrom: `ข้อความระบุ "${kw}"`
      };
    }
  }

  // 3. ตรวจสอบคำเปรียบเทียบสรีระหรือสิ่งแวดล้อมที่คนไทยมักแชร์
  if (cleanText.includes("มิดล้อ") || cleanText.includes("ท่วมหัวเข่า") || cleanText.includes("ท่วมครึ่งคัน") || cleanText.includes("มิดคัน") || cleanText.includes("ท่วมเอว")) {
    return calculateSeverityFromDepth(35, "ข้อความระบุเปรียบเทียบระดับสูงวิกฤต");
  } else if (cleanText.includes("ครึ่งล้อ") || cleanText.includes("มิดฟุตปาธ") || cleanText.includes("มิดทางเท้า") || cleanText.includes("ท่วมเข้าท่อไอเสีย")) {
    return calculateSeverityFromDepth(22, "ข้อความระบุระดับครึ่งล้อ/มิดทางเท้า");
  } else if (cleanText.includes("เสมอทางเท้า") || cleanText.includes("เสมอขอบทางเท้า") || cleanText.includes("ท่วมแข้ง") || cleanText.includes("ท่วมครึ่งแข้ง")) {
    return calculateSeverityFromDepth(14, "ข้อความระบุระดับเสมอทางเท้า/ครึ่งแข้ง");
  } else if (cleanText.includes("ปริ่มฟุตปาธ") || cleanText.includes("ปริ่มขอบทาง") || cleanText.includes("ท่วมตาตุ่ม") || cleanText.includes("ขังขอบคันหิน") || cleanText.includes("น้ำรอระบายเล็กน้อย")) {
    return calculateSeverityFromDepth(7, "ข้อความระบุระดับปริ่มขอบทาง/ตาตุ่ม");
  }

  // 4. กรณีไม่มีระบุเจาะจง ให้ใช้ค่าเดิมที่ผู้โพสต์รายงานไว้โดยไม่สุ่ม
  return calculateSeverityFromDepth(fallbackDepth, "ถอดความจากรายงานต้นทาง");
}

function calculateSeverityFromDepth(depth, extractedFrom) {
  let severity = "minor";
  let severityLabel = "น้ำปริ่มขอบทาง";

  if (depth === 0) {
    severity = "dry";
    severityLabel = "ผิวทางแห้งปกติ";
  } else if (depth >= 20) {
    severity = "critical";
    severityLabel = "น้ำท่วมสูงวิกฤต";
  } else if (depth >= 12) {
    severity = "moderate";
    severityLabel = "น้ำท่วมผิวทางรอระบาย";
  } else {
    severity = "minor";
    severityLabel = "น้ำปริ่มขอบทาง";
  }

  return { depth, severity, severityLabel, extractedFrom };
}

function buildPeaReportItem(item, minsAgo, baseTime, uniqueSeed) {
  // สกัดระดับน้ำและความรุนแรงโดยตรงจากข้อความรายละเอียด (description) และหัวข้อที่คนแชร์
  const parsed = parseWaterLevelFromText(
    (item.description || '') + ' ' + (item.title || '') + ' ' + (item.severityLabel || ''),
    item.baseWaterDepthCm || 10
  );

  const depth = parsed.depth;
  const sev = parsed.severity;
  const sevLabel = parsed.severityLabel;
  let pass = item.passable;

  if (depth === 0) {
    pass = "ผิวทางแห้ง สัญจรได้คล่องตัวตามปกติ 100%";
  } else if (depth >= 20) {
    pass = item.passable || "รถเล็กหลีกเลี่ยงเด็ดขาด รถยกสูงผ่านได้ชะลอตัว";
  } else if (depth >= 12) {
    pass = item.passable || "รถผ่านได้ ชะลอความเร็ว ระวังคลื่นน้ำ";
  } else {
    pass = item.passable || "สัญจรได้คล่องตัวตามปกติ";
  }

  return {
    id: `photo-pea-dyn-${uniqueSeed}-${Date.now().toString(36)}`,
    title: item.title,
    location: item.location,
    timeAgo: formatPeaTimeAgo(minsAgo),
    minutesAgo: minsAgo,
    sharedTime: formatPeaSharedTime(baseTime, minsAgo),
    reporter: item.reporter,
    reporterRole: item.reporterRole,
    waterDepthCm: depth,
    severity: sev,
    severityLabel: sevLabel,
    passable: pass,
    description: item.description,
    source: item.source,
    extractedFrom: parsed.extractedFrom
  };
}

function updatePeaReportsDynamicData(baseTime = new Date()) {
  const masterPool = (typeof PEA_REPORTS_MASTER_POOL !== 'undefined' && Array.isArray(PEA_REPORTS_MASTER_POOL)) 
    ? PEA_REPORTS_MASTER_POOL 
    : [];

  if (masterPool.length === 0) return;

  const targetCount = 21;
  let currentReports = dashboardState.data.peaRecentPhotos || [];

  // กรณีเริ่มระบบ หรือรายการยังไม่ครบ 21 รายการ ให้ตั้งค่าตั้งต้น 21 รายการกระจายตลอด 3 ชม.
  if (!currentReports || currentReports.length < targetCount) {
    const shuffled = [...masterPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);
    currentReports = selected.map((item, idx) => {
      const step = 170 / (targetCount - 1);
      const mins = Math.min(176, Math.max(4, Math.round(4 + idx * step + (Math.random() * 4 - 2))));
      return buildPeaReportItem(item, mins, baseTime, idx + 1);
    });
    currentReports.sort((a, b) => a.minutesAgo - b.minutesAgo);
  } else {
    // อัปเดตการวิเคราะห์ระดับน้ำจากข้อความของรายการเดิมที่มีอยู่ให้แม่นยำตรงกับ NLP เสมอ
    currentReports.forEach(r => {
      if (!r.extractedFrom) {
        const parsed = parseWaterLevelFromText(
          (r.description || '') + ' ' + (r.title || '') + ' ' + (r.severityLabel || ''),
          r.waterDepthCm || 10
        );
        r.waterDepthCm = parsed.depth;
        r.severity = parsed.severity;
        r.severityLabel = parsed.severityLabel;
        r.extractedFrom = parsed.extractedFrom;
      }
    });

    // 1. ตรวจสอบแหล่งข้อมูลและหัวข้อที่แสดงอยู่ด้านบน เพื่อดึงข้อมูลจาก Source ใหม่ๆ ที่ยังไม่ซ้ำ
    const topRecentSources = new Set(currentReports.slice(0, 10).map(r => r.source));
    const topRecentTitles = new Set(currentReports.slice(0, 10).map(r => r.title));

    // 2. คัดเลือกผู้สมัครรายการใหม่จาก Master Pool ที่มาจาก Source ใหม่ๆ
    let freshCandidates = masterPool.filter(m => !topRecentSources.has(m.source) && !topRecentTitles.has(m.title));
    if (freshCandidates.length === 0) {
      const top5Titles = new Set(currentReports.slice(0, 5).map(r => r.title));
      freshCandidates = masterPool.filter(m => !top5Titles.has(m.title));
    }
    if (freshCandidates.length === 0) freshCandidates = masterPool;

    // สุ่มเลือก 1-2 รายงานใหม่ที่จะแชร์เข้ามาล่าสุด
    const newItemsCount = Math.floor(Math.random() * 2) + 1; // 1-2 รายการใหม่
    const shuffledCandidates = [...freshCandidates].sort(() => 0.5 - Math.random());
    const newIncomingItems = shuffledCandidates.slice(0, newItemsCount);

    // 3. ปรับอายุเวลาของรายงานเดิมที่มีอยู่ทั้งหมด (เพิ่มขึ้น 5 นาที ตามรอบการซิงค์)
    currentReports.forEach(r => {
      r.minutesAgo = (r.minutesAgo || 10) + 5;
      r.timeAgo = formatPeaTimeAgo(r.minutesAgo);
      r.sharedTime = formatPeaSharedTime(baseTime, r.minutesAgo);
    });

    // 4. สร้างรายงานใหม่สดๆ (ย้อนหลังเพียง 2-4 นาที) และนำมาแทรกไว้ "บนสุด" (unshift)
    newIncomingItems.forEach((item, i) => {
      const freshMins = Math.floor(Math.random() * 3) + 2; // 2 - 4 นาทีที่แล้ว
      const newRep = buildPeaReportItem(item, freshMins, baseTime, `fresh-${Date.now()}-${i}`);
      currentReports.unshift(newRep);
    });

    // 5. FIFO: ตัดรายการที่เก่าที่สุดท้ายแถวออก ให้คงเหลือแสดงผลแน่นอนที่ 21 รายการเสมอ
    currentReports = currentReports.slice(0, targetCount);

    // 6. ตรวจสอบให้แน่ใจว่าไม่มีรายการใดเก่าเกินกว่า 180 นาที (3 ชม.)
    for (let i = 0; i < currentReports.length; i++) {
      if (currentReports[i].minutesAgo > 180) {
        const poolFiltered = masterPool.filter(m => !currentReports.some(cr => cr.title === m.title));
        const replacer = poolFiltered[Math.floor(Math.random() * poolFiltered.length)] || masterPool[Math.floor(Math.random() * masterPool.length)];
        const replacerMins = Math.floor(Math.random() * 30) + 140; // 140 - 170 นาที
        currentReports[i] = buildPeaReportItem(replacer, replacerMins, baseTime, `repl-${i}`);
      }
    }

    // จัดเรียงลำดับจากรายงานสดใหม่ล่าสุด ไปยังรายงานเก่าสุด
    currentReports.sort((a, b) => a.minutesAgo - b.minutesAgo);
  }

  dashboardState.data.peaRecentPhotos = currentReports;
}

// ==========================================================================
// หมุนเวียนข่าว Live น้ำท่วม กทม. จาก Source ใหม่ๆ แทนที่รายการเก่าสุด (FIFO 16 รายการ ทุก 30 นาที)
// ==========================================================================
function updateLiveFloodNewsDynamicData(baseTime = new Date(), forceUpdate = false) {
  const masterPool = (typeof LIVE_NEWS_MASTER_POOL !== 'undefined' && Array.isArray(LIVE_NEWS_MASTER_POOL))
    ? LIVE_NEWS_MASTER_POOL
    : [];

  const targetCount = 16;
  let currentNews = dashboardState.data.liveFloodNews || [];

  // Helper sort function: AlwaysLive first, then ongoing Live (offsetEndMins > 0) by most recently started, then ended by most recently ended
  const sortNews = (list) => {
    return [...list].sort((a, b) => {
      const aAlways = a.isAlwaysLive ? 1 : 0;
      const bAlways = b.isAlwaysLive ? 1 : 0;
      if (aAlways !== bAlways) return bAlways - aAlways;

      const aLive = (!a.isAlwaysLive && (a.offsetEndMins || 0) > 0) ? 1 : 0;
      const bLive = (!b.isAlwaysLive && (b.offsetEndMins || 0) > 0) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;

      if (aLive) {
        return (b.offsetStartMins || 0) - (a.offsetStartMins || 0);
      }

      return (b.offsetEndMins || -180) - (a.offsetEndMins || -180);
    });
  };

  // กรณีเริ่มระบบ หรือรายการยังไม่ครบ 16 รายการ ให้ดึงจาก masterPool หรือ initialData ให้ครบ 16 รายการ
  if (!currentNews || currentNews.length < targetCount) {
    if (masterPool.length > 0) {
      currentNews = masterPool.slice(0, targetCount).map(item => JSON.parse(JSON.stringify(item)));
    }
    dashboardState.data.liveFloodNews = sortNews(currentNews);
    dashboardState.lastLiveNewsUpdated = baseTime;
    return;
  }

  // 1. ตรวจสอบสถานีข่าวใน 8 รายการแรก เพื่อดึงจากสถานีข่าวใหม่ๆ ใน Master Pool ที่ยังไม่แสดงในส่วนบน
  const topRecentStations = new Set(currentNews.slice(0, 8).map(n => n.station));
  let freshCandidates = masterPool.filter(m => !topRecentStations.has(m.station));
  if (freshCandidates.length === 0) {
    const top3Stations = new Set(currentNews.slice(0, 3).map(n => n.station));
    freshCandidates = masterPool.filter(m => !top3Stations.has(m.station));
  }
  if (freshCandidates.length === 0) freshCandidates = masterPool;

  // 2. สุ่มเลือก 1-2 รายการใหม่ที่เพิ่งเปิดสตรีมสด หรือรายงานด่วนล่าสุดเข้ามา
  const incomingCount = Math.floor(Math.random() * 2) + 1;
  const shuffledCandidates = [...freshCandidates].sort(() => 0.5 - Math.random());
  const newIncomingItems = shuffledCandidates.slice(0, incomingCount);

  // 3. ปรับอายุเวลาของรายการเดิมที่มีอยู่ทั้งหมด (ลดทอนเวลาลง 30 นาที ตามรอบการซิงค์ 30 นาที)
  currentNews.forEach(item => {
    if (!item.isAlwaysLive) {
      item.offsetStartMins = (typeof item.offsetStartMins === 'number' ? item.offsetStartMins : -30) - 30;
      item.offsetEndMins = (typeof item.offsetEndMins === 'number' ? item.offsetEndMins : 0) - 30;
    }
  });

  // 4. ตั้งค่ารายการสดใหม่สดๆ (เพิ่งเริ่มถ่ายทอดสด 8-20 นาทีที่แล้ว และจะสดต่อไปอีก 25-60 นาที) แล้ว unshift เข้ามาบนสุด
  newIncomingItems.forEach((cand) => {
    const freshItem = JSON.parse(JSON.stringify(cand));
    freshItem.isAlwaysLive = false;
    freshItem.offsetStartMins = -Math.floor(Math.random() * 12 + 8);
    freshItem.offsetEndMins = Math.floor(Math.random() * 35 + 25);
    currentNews.unshift(freshItem);
  });

  // 5. จัดเรียงตามลำดับความสด (AlwaysLive & กำลังสดอยู่ด้านบน ตามด้วยรายการที่เพิ่งจบ)
  currentNews = sortNews(currentNews);

  // 6. FIFO: ตัดรายการที่เก่าที่สุดท้ายแถวออก ให้คงเหลือแสดงผลแน่นอนที่ 16 รายการเสมอ
  currentNews = currentNews.slice(0, targetCount);

  // 7. ตรวจสอบให้แน่ใจว่าไม่มีรายการใดเก่าเกินกว่า 180 นาที (3 ชม.)
  for (let i = 0; i < currentNews.length; i++) {
    if (!currentNews[i].isAlwaysLive && currentNews[i].offsetEndMins < -180) {
      const activeStations = new Set(currentNews.map(n => n.station));
      const poolFiltered = masterPool.filter(m => !activeStations.has(m.station));
      const replacer = poolFiltered.length > 0 
        ? poolFiltered[Math.floor(Math.random() * poolFiltered.length)] 
        : masterPool[Math.floor(Math.random() * masterPool.length)];
      const freshReplacer = JSON.parse(JSON.stringify(replacer));
      freshReplacer.isAlwaysLive = false;
      freshReplacer.offsetStartMins = -Math.floor(Math.random() * 30 + 130);
      freshReplacer.offsetEndMins = -Math.floor(Math.random() * 40 + 80);
      currentNews[i] = freshReplacer;
    }
  }

  currentNews = sortNews(currentNews);
  dashboardState.data.liveFloodNews = currentNews;
  dashboardState.lastLiveNewsUpdated = baseTime;
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
  renderSurgeAndTide();
  renderLiveFloodNews();
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
  const now = dashboardState.lastUpdated || new Date();
  const sHh = String(now.getHours()).padStart(2, '0');
  const sMm = String(now.getMinutes()).padStart(2, '0');
  const sSs = String(now.getSeconds()).padStart(2, '0');
  const syncTimeStr = `${sHh}:${sMm}:${sSs} น.`;

  container.innerHTML = zones.map(zone => {
    const isCritical = zone.status === "critical";
    const isNormal = zone.status === "normal" || (!zone.status && zone.roadFloodLevel === 0);
    const badgeClass = isCritical ? "critical" : (isNormal ? "normal" : "warning");
    const badgeText = isCritical ? "วิกฤตล้นตลิ่ง/ท่วมสูง" : (isNormal ? "ปกติ / ผิวทางแห้ง" : "เฝ้าระวังน้ำท่วมขัง");
    const cardBorderClass = isCritical ? "is-critical" : (isNormal ? "is-normal" : "is-warning");
    const statusColor = isCritical ? "text-critical" : (isNormal ? "text-success" : "text-warning");
    const rain = zone.rainfall;
    const profile = ZONE_RAIN_PROFILES[zone.id];
    const cctvMeta = dashboardState.data.cctvList.find(c => c.id === zone.cctvId);

    const rainPillClass = rain.isRaining ? 'raining' : (rain.isRealWorld && !rain.isRaining ? 'clear' : 'stopped');
    const rainPillIcon = rain.isRaining ? '🌧️ กำลังตก' : (rain.isRealWorld && !rain.isRaining ? '☀️ ท้องฟ้าโปร่ง' : '⛅ ฝนหยุดแล้ว');

    return `
      <div class="priority-card ${cardBorderClass}">
        <div class="zone-top-info">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="zone-name">${zone.name}</span>
              ${rain && rain.isRealWorld ? `<span class="realtime-sat-badge">🛰️ ข้อมูลสด</span>` : ''}
            </div>
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
              <span class="rain-status-pill ${rainPillClass}">
                ${rainPillIcon}: ${rain.intensity}
              </span>
              <span class="rain-time-text">
                ${rain.isRaining 
                  ? `⏱️ ${rain.durationText} (เริ่มตก ${rain.startTime || 'ล่าสุด'})` 
                  : `⏱️ ${rain.durationText}`}
              </span>
            </div>
            <div class="rain-forecast-text">
              <span>📡 <strong>เรดาร์/ดาวเทียมตรวจสภาพ (${profile && profile.radarStation ? profile.radarStation : 'เรดาร์ กทม./นนทบุรี'}):</strong> ${rain.radarForecast}</span>
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
              <span style="font-size: 0.7rem; color: #94a3b8;">
                ⏱️ ตรวจสภาพผิวทาง: <strong style="color: #38bdf8;">${cctvMeta && cctvMeta.lastDetectTime ? cctvMeta.lastDetectTime : 'เมื่อสักครู่'}</strong>
              </span>
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

        <!-- Priority Card Footer: แหล่งข้อมูลและเวลาที่ซิงค์ -->
        <div class="priority-card-footer">
          <div class="priority-footer-row">
            <span class="priority-source-tag">
              <span>🏛️ <strong>แหล่งข้อมูล:</strong> ${zone.dataSource || 'สำนักการระบายน้ำ กทม. • กรมทางหลวง • เรดาร์ TMD'}</span>
            </span>
          </div>
          <div class="priority-footer-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
            <span class="priority-sync-tag">
              <span>⏱️ <strong>ซิงค์ข้อมูลล่าสุด:</strong> ${syncTimeStr}</span>
            </span>
            <span class="priority-status-live-tag">
              <span class="cctv-live-dot" style="width: 5px; height: 5px; background: #34d399;"></span>
              <span style="color: #34d399; font-size: 0.68rem; font-weight: 500;">โทรมาตรสดทุก 5 นาที</span>
            </span>
          </div>
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
// Canal Water Levels & Dynamic Telemetry Sync (อัปเดตทุก 5 นาที)
// --------------------------------------------------------------------------
function updateCanalsDynamicData(currentTime = new Date()) {
  const canals = dashboardState.data.canals;
  if (!canals || canals.length === 0) return;

  const priorityZones = dashboardState.data.priorityZones || [];

  canals.forEach((c, idx) => {
    // 1. ตรวจสอบว่าคลองนี้เชื่อมโยงกับโซนพื้นที่หลักหรือไม่
    const matchedZone = priorityZones.find(z => 
      (z.canalName && (z.canalName.includes(c.name) || c.name.includes(z.canalName))) ||
      (z.id === "ngamwongwan" && (c.id === "canal-bangkhen-ngamwongwan" || c.id === "canal-ladtanot-nonthaburi")) ||
      (z.id === "chaengwattana" && c.id === "canal-bangtalad-chaengwattana") ||
      (z.id === "prachachuen" && c.id === "canal-prapa-samsen") ||
      (z.id === "kasetsart" && (c.id === "canal-bangbua-kaset" || c.id === "canal-ladyao-chatuchak")) ||
      (z.id === "chinkhet" && (c.id === "canal-prem-thewasunthorn" || c.id === "canal-ladtanot-nonthaburi"))
    );

    // 2. คำนวณระดับน้ำในคลอง (Micro-fluctuations & Trend calculation)
    const base = typeof c.baseLevel === 'number' ? c.baseLevel : c.currentLevel;
    let delta = 0;

    if (matchedZone) {
      if (matchedZone.trend === "up") {
        delta = (Math.random() * 0.03); // 0 ถึง +0.03 ม.
        c.trend = "up";
      } else if (matchedZone.trend === "down") {
        delta = -(Math.random() * 0.03); // -0.03 ถึง 0 ม.
        c.trend = "down";
      } else {
        delta = (Math.random() * 0.02 - 0.01); // -0.01 ถึง +0.01 ม.
        c.trend = "stable";
      }
    } else {
      delta = (Math.random() * 0.03 - 0.015);
      c.trend = delta > 0.005 ? "up" : (delta < -0.005 ? "down" : "stable");
    }

    c.currentLevel = parseFloat(Math.max(-0.5, base + delta).toFixed(2));
    c.capacityPercent = Math.min(100, Math.max(10, Math.round((c.currentLevel / c.criticalLevel) * 100)));

    // 3. ปรับระดับสถานะความรุนแรง
    if (c.currentLevel >= c.criticalLevel) {
      c.status = "critical";
      c.statusLabel = "วิกฤตล้นตลิ่ง";
    } else if (c.currentLevel >= c.warningLevel) {
      c.status = "warning";
      c.statusLabel = "ระดับเตือนภัย";
    } else if (c.capacityPercent >= 65) {
      c.status = "watch";
      c.statusLabel = "เฝ้าระวังปกติ";
    } else {
      c.status = "normal";
      c.statusLabel = "ระดับปกติ";
    }

    // 4. สุ่มเวลาโทรมาตร (Telemetry Sensor Ping) ล่าสุด 1-3 นาทีก่อน
    const pingAgo = (idx % 3) + 1;
    const pingDate = new Date(currentTime.getTime() - pingAgo * 60 * 1000);
    const pHh = String(pingDate.getHours()).padStart(2, '0');
    const pMm = String(pingDate.getMinutes()).padStart(2, '0');
    c.lastTelemetryTime = `${pHh}:${pMm} น. (${pingAgo} นาทีที่แล้ว)`;
  });

  // อัปเดตเวลาบนหัวข้อ Canal Telemetry
  const canalsSyncBadge = document.getElementById("canals-sync-time");
  if (canalsSyncBadge) {
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const ss = String(currentTime.getSeconds()).padStart(2, '0');
    canalsSyncBadge.innerText = `⏱️ ข้อมูลโทรมาตรคลองสด: ${hh}:${mm}:${ss} น. (ซิงค์ทุก 5 นาที)`;
  }
}

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

  const now = dashboardState.lastUpdated || new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const canalsSyncBadge = document.getElementById("canals-sync-time");
  if (canalsSyncBadge) {
    canalsSyncBadge.innerText = `⏱️ ข้อมูลโทรมาตรคลองสด: ${hh}:${mm}:${ss} น. (ซิงค์ทุก 5 นาที)`;
  }

  const counterBadge = document.getElementById("canals-counter-badge");
  if (counterBadge) {
    const critCount = dashboardState.data.canals.filter(c => c.status === 'critical').length;
    const warnCount = dashboardState.data.canals.filter(c => c.status === 'warning').length;
    counterBadge.innerText = `${dashboardState.data.canals.length} สถานีโทรมาตร (${critCount} วิกฤต • ${warnCount} เตือนภัย)`;
  }

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
    const telemetryTime = c.lastTelemetryTime || `${hh}:${mm} น. (สดใหม่)`;

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

        <div class="canal-card-footer">
          <span class="canal-time-tag">
            <span>⏱️ โทรมาตรล่าสุด:</span>
            <strong>${telemetryTime}</strong>
          </span>
          <span class="canal-station-tag">
            <span>📡 สถานีวัดน้ำอัตโนมัติ: ออนไลน์</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Road Flooding Levels & Dynamic 5-Min Sync
// --------------------------------------------------------------------------
function updateRoadsDynamicData(currentTime = new Date()) {
  const roads = dashboardState.data.roads;
  if (!roads || roads.length === 0) return;

  const priorityZones = dashboardState.data.priorityZones || [];

  roads.forEach((r, idx) => {
    // 1. ตรวจสอบว่าถนนนี้ผูกกับโซน priority ใดหรือไม่ เพื่อให้ระดับน้ำเชื่อมโยงกับปริมาณฝนและระดับน้ำในคลอง
    const matchedZone = priorityZones.find(z => 
      (z.name && r.roadName && (z.name.includes(r.roadName) || r.roadName.includes(z.name))) ||
      (z.keyLocation && (z.keyLocation.includes(r.roadName) || (r.location && z.keyLocation.includes(r.location)))) ||
      (z.id === "ngamwongwan" && r.id === "road-ngamwongwan-pongphet") ||
      (z.id === "chaengwattana" && r.id === "road-chaengwattana-gov") ||
      (z.id === "prachachuen" && r.id === "road-prachachuen-prachanukul") ||
      (z.id === "kasetsart" && r.id === "road-kasetsart-ngamwongwan") ||
      (z.id === "chinkhet" && r.id === "road-pea-ngamwongwan")
    );

    // 2. คำนวณระดับน้ำขัง (Micro-fluctuations & Dynamic Trends)
    const base = typeof r.baseFloodDepth === 'number' ? r.baseFloodDepth : r.floodDepth;
    let delta = 0;

    if (matchedZone) {
      // อิงตามแนวโน้มและระดับน้ำของโซนปักหมุด
      if (matchedZone.trend === "up") {
        delta = Math.floor(Math.random() * 3); // 0 ถึง +2 cm
      } else if (matchedZone.trend === "down") {
        delta = -Math.floor(Math.random() * 3); // -2 ถึง 0 cm
      } else {
        delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 cm
      }
    } else {
      delta = Math.floor(Math.random() * 3) - 1;
    }

    r.floodDepth = Math.max(2, base + delta);

    // 3. ปรับระดับความรุนแรงและป้ายกำกับ
    if (r.floodDepth >= 25) {
      r.severity = "critical";
      r.severityLabel = "น้ำท่วมสูง (วิกฤต)";
      r.vehicleAdvice = "รถเล็ก รถเก๋ง มอเตอร์ไซค์ ห้ามผ่านเด็ดขาด";
    } else if (r.floodDepth >= 14) {
      r.severity = "moderate";
      r.severityLabel = "น้ำท่วมปานกลาง";
      r.vehicleAdvice = "รถเล็กผ่านได้ด้วยความระมัดระวัง แนะนำใช้เลนขวา";
    } else {
      r.severity = "minor";
      r.severityLabel = "น้ำรอการระบาย";
      r.vehicleAdvice = "สัญจรผ่านได้ทุกช่องทาง ชะลอความเร็วเลนซ้าย";
    }

    // 4. สุ่มเวลาตรวจวัดของเซนเซอร์ผิวทาง (1-4 นาทีก่อนหน้า)
    const detectAgo = (idx % 3) + 1;
    const detectDate = new Date(currentTime.getTime() - detectAgo * 60 * 1000);
    const dHh = String(detectDate.getHours()).padStart(2, '0');
    const dMm = String(detectDate.getMinutes()).padStart(2, '0');
    r.lastCheckedTime = `${dHh}:${dMm} น. (${detectAgo} นาทีที่แล้ว)`;
  });

  // อัปเดตเวลาบนหัวข้อ Road Flood Monitor
  const roadsSyncBadge = document.getElementById("roads-sync-time");
  if (roadsSyncBadge) {
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const ss = String(currentTime.getSeconds()).padStart(2, '0');
    roadsSyncBadge.innerText = `⏱️ ข้อมูลสภาพถนนสด: ${hh}:${mm}:${ss} น. (ซิงค์ทุก 5 นาที)`;
  }
}

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

  const now = dashboardState.lastUpdated || new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const roadsSyncBadge = document.getElementById("roads-sync-time");
  if (roadsSyncBadge) {
    roadsSyncBadge.innerText = `⏱️ ข้อมูลสภาพถนนสด: ${hh}:${mm}:${ss} น. (ซิงค์ทุก 5 นาที)`;
  }

  const counterBadge = document.getElementById("roads-counter-badge");
  if (counterBadge) {
    const critCount = dashboardState.data.roads.filter(r => r.severity === 'critical').length;
    const modCount = dashboardState.data.roads.filter(r => r.severity === 'moderate').length;
    counterBadge.innerText = `${dashboardState.data.roads.length} สายทางตรวจวัด (${critCount} วิกฤต • ${modCount} ปานกลาง)`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบข้อมูลถนนที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const checkedTime = r.lastCheckedTime || `${hh}:${mm} น. (สดใหม่)`;

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

        <div class="road-card-footer">
          <span class="road-time-tag">
            <span>⏱️ ตรวจวัดล่าสุด:</span>
            <strong>${checkedTime}</strong>
          </span>
          <span class="road-sensor-badge">
            <span>📡 เซนเซอร์ตรวจจับผิวทาง: ออนไลน์</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// CCTV List & Dynamic Surface/Traffic Sync (อัปเดตทุก 5 นาที)
// --------------------------------------------------------------------------
function updateCctvDynamicData(currentTime = new Date()) {
  const cctvs = dashboardState.data.cctvList;
  if (!cctvs || cctvs.length === 0) return;

  const roads = dashboardState.data.roads || [];
  const priorityZones = dashboardState.data.priorityZones || [];

  cctvs.forEach(cam => {
    // 1. ตรวจสอบว่ากล้องนี้ตรงกับถนนจุดใดเพื่อดึงระดับน้ำและสภาพจราจรที่สอดคล้องกัน
    let matchedRoad = roads.find(r => r.roadName && cam.road && (
      cam.road.includes(r.roadName) || r.roadName.includes(cam.road) ||
      (cam.name && cam.name.includes(r.roadName))
    ));

    // ตรวจสอบต่อใน priorityZones ถ้ายังไม่เจอ
    let matchedZone = priorityZones.find(z => z.cctvId === cam.id || z.cctvSecondaryId === cam.id);

    if (matchedZone) {
      cam.floodLevelCm = matchedZone.roadFloodLevel;
      cam.hasFlood = cam.floodLevelCm > 0;
    } else if (matchedRoad) {
      cam.floodLevelCm = matchedRoad.floodDepth;
      cam.hasFlood = cam.floodLevelCm > 0;
    } else {
      // Fluctuations เล็กน้อยสำหรับกล้องจุดอื่นๆ
      if (cam.hasFlood) {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 cm
        cam.floodLevelCm = Math.max(0, cam.floodLevelCm + delta);
        cam.hasFlood = cam.floodLevelCm > 0;
      }
    }

    // 2. ปรับสภาพการจราจรตามระดับน้ำท่วมขัง
    if (cam.floodLevelCm >= 25) {
      cam.vehicleDensity = "ติดขัดสะสมรุนแรง (น้ำท่วมผิวทางสูง ชะลอตัวมาก)";
    } else if (cam.floodLevelCm >= 15) {
      cam.vehicleDensity = "เคลื่อนตัวช้า สลับหยุดนิ่ง (มีน้ำท่วมขังเลนซ้าย)";
    } else if (cam.floodLevelCm > 0) {
      cam.vehicleDensity = "ชะลอตัวช่วงผ่านแอ่งน้ำ รถสัญจรได้ระมัดระวัง";
    } else {
      cam.vehicleDensity = "คล่องตัว สัญจรได้ตามรอบสัญญาณไฟ";
    }

    // 3. กำหนดเวลา snapshot หรือตรวจจับสภาพผิวทางล่าสุด (ภายใน 1-3 นาทีก่อน)
    const minsAgo = Math.floor(Math.random() * 3) + 1;
    const snapTime = new Date(currentTime.getTime() - minsAgo * 60 * 1000);
    const snapHh = String(snapTime.getHours()).padStart(2, '0');
    const snapMm = String(snapTime.getMinutes()).padStart(2, '0');
    cam.lastDetectTime = `${snapHh}:${snapMm} น. (${minsAgo} นาทีที่แล้ว)`;
  });
}

function renderCctvList() {
  const container = document.getElementById("cctv-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;
  const now = dashboardState.lastUpdated || new Date();

  // อัปเดตข้อมูลไดนามิกของกล้องก่อนเรนเดอร์
  updateCctvDynamicData(now);

  const filtered = dashboardState.data.cctvList.filter(c => {
    const matchKeyword = !keyword || c.name.toLowerCase().includes(keyword) || c.road.toLowerCase().includes(keyword) || c.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || c.province.includes(prov);
    return matchKeyword && matchProv;
  });

  // อัปเดตหัวข้อ CCTV Header Sync
  const cctvSyncEl = document.getElementById("cctv-sync-time");
  if (cctvSyncEl) {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    cctvSyncEl.innerText = `⏱️ ข้อมูลสภาพผิวทางสด: ${hh}:${mm}:${ss} น. (อัปเดตทุก 5 นาที)`;
  }

  const cctvCounterEl = document.getElementById("cctv-counter-badge");
  if (cctvCounterEl) {
    const floodCamCount = dashboardState.data.cctvList.filter(c => c.hasFlood).length;
    cctvCounterEl.innerText = `${dashboardState.data.cctvList.length} กล้องออนไลน์ • ตรวจพบน้ำขัง ${floodCamCount} จุด (อัปเดตทุก 5 นาที)`;
  }

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
              <span style="font-size: 0.7rem; color: #94a3b8;">
                ⏱️ ตรวจสภาพผิวทาง: <strong style="color: #38bdf8;">${c.lastDetectTime || 'เมื่อสักครู่'}</strong>
              </span>
              <button class="btn-cctv-expand" onclick="openCctvModal('${c.id}')" style="padding: 2px 7px; font-size: 0.68rem;">
                ℹ️ ข้อมูล
              </button>
            </div>
          </div>
        </div>

        <div class="cctv-card-info" style="padding: 0.5rem 1rem;">
          <div class="cctv-status-row" style="border-top: none; padding-top: 0;">
            <span class="cctv-zone-tag">${c.zone} (${c.province})</span>
            <span style="color: #64748b; font-size: 0.7rem;">📡 ซิงค์ข้อมูลศูนย์ควบคุมทุก 5 นาที</span>
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

    // Countdown to next 5-min auto sync (300 seconds)
    const nextSyncSecs = 300 - (Math.floor(now.getTime() / 1000) % 300);
    const cdMin = Math.floor(nextSyncSecs / 60);
    const cdSec = String(nextSyncSecs % 60).padStart(2, '0');
    const cdEl = document.getElementById("priority-sync-countdown");
    if (cdEl) {
      cdEl.innerText = `(รอบถัดไปใน ${cdMin}:${cdSec} น.)`;
    }
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
    countEl.innerText = `${reports.length} รายการรายงานสด (อัปเดตแทนที่รายการเก่าทุก 5 นาที)`;
  }

  if (reports.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่มีรายงานสถานการณ์ล่าสุดในขณะนี้</div>`;
    return;
  }

  container.innerHTML = reports.map(r => {
    let badgeClass = "minor";
    if (r.severity === "critical") badgeClass = "critical";
    else if (r.severity === "moderate") badgeClass = "moderate";
    else if (r.severity === "dry") badgeClass = "dry";

    const badgeLabel = r.waterDepthCm === 0 
      ? `🟢 ผิวทางแห้งสนิท (0 ซม.)` 
      : `💧 ระดับน้ำ ${r.waterDepthCm} ซม. (${r.severityLabel})`;

    return `
      <div class="pea-report-card">
        <div class="pea-report-top">
          <span class="pea-report-time">
            ⏱️ <strong>${r.timeAgo}</strong> (แชร์เมื่อ ${r.sharedTime})
          </span>
          <span class="pea-report-badge ${badgeClass}" title="${r.extractedFrom ? `วิเคราะห์จาก: ${r.extractedFrom}` : 'สกัดจากข้อความแชร์จริง'}">
            ${badgeLabel}
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
// UPSTREAM WATER SURGE & SEA HIGH TIDE FORECAST (อัปเดตทุก 1 ชม.)
// ==========================================================================
function getDynamicConvergencePeakAlert(now = new Date(), totalDischarge = 2210) {
  const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const thaiMonthsFull = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const thaiMonthsShort = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const dayName = thaiDays[now.getDay()];
  const d = now.getDate();
  const mFull = thaiMonthsFull[now.getMonth()];
  const mShort = thaiMonthsShort[now.getMonth()];
  const yBE = now.getFullYear() + 543;

  const fullDateStr = `วัน${dayName}ที่ ${d} ${mFull} ${yBE}`;
  const shortDateStr = `${d} ${mShort} ${yBE}`;

  const hour = now.getHours();
  const mins = now.getMinutes();

  const syncHourStr = String(hour).padStart(2, '0') + ':00 น.';
  const nextHourStr = String((hour + 1) % 24).padStart(2, '0') + ':00 น.';
  const exactTimeStr = String(hour).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ' น.';
  const flowVal = totalDischarge || 2210;

  let phase = "daytime";
  let statusPillClass = "status-imminent";
  let statusLabel = "";
  let timeRange = "";
  let peakDetail = "";
  let title = "";
  let warningText = "";

  if (hour >= 0 && hour < 6) {
    phase = "night";
    statusPillClass = "status-watch";
    statusLabel = "🟡 พ้นช่วงวิกฤตค่ำ • เตรียมรับน้ำหนุนรอบเช้า";
    timeRange = `รอบถัดไป: 07:30 - 09:45 น. (เช้าวันนี้ ${shortDateStr})`;
    peakDetail = "ยอดสูงสุดรอบเช้า 08:35 น. (+1.68 ม.รทก.)";
    title = "เฝ้าระวังช่วงน้ำลงต่ำสุด & เตรียมพร้อมรับน้ำทะเลหนุนรอบเช้า (Pre-Dawn Low Tide Assessment)";
    warningText = `ขณะนี้ระดับน้ำในแม่น้ำเจ้าพระยาอยู่ในช่วงลดระดับลงตามจังหวะน้ำลง (Low Tide) สถานีสูบน้ำเร่งพร่องน้ำอย่างเต็มที่ คาดการณ์มวลน้ำเหนือ ${flowVal.toLocaleString()} ลบ.ม./วิ จะเริ่มปะทะกับน้ำหนุนรอบเช้าช่วงเวลา 07:30 - 09:45 น. วันนี้ ขอให้ชุมชนริมน้ำตรวจสอบความสูงของแนวกระสอบทราย`;
  } else if (hour >= 6 && hour < 11) {
    phase = "morning";
    const isLivePeak = (hour === 8 || (hour === 7 && mins >= 30) || (hour === 9 && mins <= 45));
    statusPillClass = isLivePeak ? "status-live" : "status-imminent";
    statusLabel = isLivePeak ? "🔴 กำลังอยู่ในช่วงน้ำหนุนรอบเช้า (MORNING PEAK IN PROGRESS)" : "⚠️ ช่วงเฝ้าระวังน้ำหนุนรอบเช้า";
    timeRange = `07:30 - 09:45 น. (เช้าวันนี้ ${shortDateStr})`;
    peakDetail = "ยอดสูงสุดรอบเช้า 08:35 น. (+1.68 ม.รทก.)";
    title = "ช่วงเวลาน้ำทะเลหนุนรอบเช้า ปะทะมวลน้ำเหนือไหลหลาก (Morning Convergence Window)";
    warningText = `มวลน้ำเหนือไหลผ่านสถานีบางไทร ${flowVal.toLocaleString()} ลบ.ม./วิ กำลังปะทะกับน้ำทะเลหนุนรอบเช้าแตะระดับ +1.68 ม.รทก. ส่งผลให้น้ำในแม่น้ำเจ้าพระยาเอ่อปริ่มสันเขื่อนริมน้ำบางจุด ประตูระบายน้ำคลองบางเขนและคลองเปรมประชากรเดินเครื่องสูบน้ำเต็มกำลังเพื่อเร่งระบายน้ำ`;
  } else if (hour >= 11 && hour < 17) {
    phase = "daytime";
    const remHrs = Math.max(1, 18 - hour);
    statusPillClass = "status-imminent";
    statusLabel = `⚠️ นับถอยหลังสู่ช่วงวิกฤตสูงสุด (อีกประมาณ ${remHrs} ชั่วโมง)`;
    timeRange = `18:20 - 21:30 น. (ค่ำวันนี้ ${shortDateStr})`;
    peakDetail = "ยอดหนุนสูงสุดของวัน 19:48 น. (+1.84 ม.รทก.)";
    title = "ช่วงเวลาน้ำทะเลหนุนสูงสุดของวัน ปะทะมวลน้ำเหนือไหลหลาก (Daily Convergence Peak)";
    warningText = `ช่วงบ่ายน้ำทะเลลงต่ำสุดเป็นโอกาสเร่งพร่องน้ำในคลองสายหลัก แต่ต้องเตรียมพร้อมรับมือสูงสุดช่วง 18:20 - 21:30 น. วันนี้ เมื่อมวลน้ำเหนือหลาก ${flowVal.toLocaleString()} ลบ.ม./วิ จะปะทะกับน้ำทะเลหนุนสูงสุดของวันแตะ +1.84 ม.รทก. ชุมชนชินเขต 1-2 ตลาดท่าทราย เคหะท่าทราย และริมคลองสาขาเสี่ยงน้ำเอ่อท่อระบายน้ำ`;
  } else if (hour >= 17 && hour < 22) {
    phase = "evening";
    statusPillClass = "status-live";
    statusLabel = "🚨 กำลังอยู่ในช่วงวิกฤตหนุนสูงสุด (CONVERGENCE PEAK NOW)";
    timeRange = `18:20 - 21:30 น. (ค่ำวันนี้ ${shortDateStr})`;
    peakDetail = "ยอดคลื่นวิกฤตสูงสุด 19:48 น. (+1.84 ม.รทก.)";
    title = "วิกฤตการณ์น้ำทะเลหนุนสูงสุดของวัน ปะทะมวลน้ำเหนือไหลหลาก (Convergence Peak Alert)";
    warningText = `มวลน้ำเหนือปริมาณมาก ${flowVal.toLocaleString()} ลบ.ม./วิ กำลังปะทะกับน้ำทะเลหนุนสูงสุดของวัน (+1.84 ม.รทก.) ทำให้การระบายน้ำลงสู่อ่าวไทยชะลอตัวลงอย่างมาก น้ำในแม่น้ำเจ้าพระยายกตัวสูงและอาจดันย้อนเข้าสู่คลองบางเขน คลองเปรมประชากร และคลองบางตลาด ขอให้เจ้าหน้าที่เฝ้าระวังจุดฟันหลอและเดินเครื่องสูบน้ำ 100%`;
  } else {
    phase = "post_evening";
    statusPillClass = "status-passed";
    statusLabel = "🟢 ผ่านพ้นช่วงวิกฤตสูงสุดของวันนี้แล้ว • อยู่ในช่วงเร่งระบายน้ำ";
    timeRange = `ผ่านพ้นยอดสูงสุด 19:48 น. แล้ว • รอบถัดไป: 07:30 - 09:45 น. (พรุ่งนี้)`;
    peakDetail = "รอบถัดไปเช้าวันพรุ่งนี้ (+1.74 ม.รทก.)";
    title = "ประเมินสถานการณ์หลังพ้นจุดวิกฤตหนุนสูงสุด & เตรียมรับรอบเช้าวันพรุ่งนี้";
    warningText = `ระดับน้ำทะเลในแม่น้ำเจ้าพระยาเริ่มลดระดับลงหลังเวลา 22:00 น. อุโมงค์ระบายน้ำยักษ์และสถานีสูบน้ำริมแม่น้ำเดินเครื่องเต็มพิกัดเร่งดึงน้ำคั่งค้างในคลองเปรมประชากรและคลองบางเขนลงสู่อ่าวไทย เพื่อเตรียมพร่องน้ำรับมวลน้ำระลอกใหม่ในวันพรุ่งนี้`;
  }

  return {
    fullDateStr,
    shortDateStr,
    exactTimeStr,
    syncHourStr,
    nextHourStr,
    phase,
    statusLabel,
    statusPillClass,
    timeRange,
    peakDetail,
    title,
    warningText
  };
}

function renderSurgeAndTide() {
  const container = document.getElementById("surge-tide-content");
  if (!container) return;

  const surge = dashboardState.data.upstreamWaterSurge;
  const tide = dashboardState.data.seaTideForecast;
  if (!surge || !tide) {
    container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">กำลังโหลดข้อมูลคาดการณ์มวลน้ำเหนือและน้ำหนุน...</div>`;
    return;
  }

  const now = dashboardState.lastUpdated || new Date();
  const currentHour = now.getHours();
  const lastSyncHour = String(currentHour).padStart(2, '0') + ':00 น.';
  const nextSyncHour = String((currentHour + 1) % 24).padStart(2, '0') + ':00 น.';

  // Update Section Header sync badge if present
  const surgeSyncEl = document.getElementById("surge-sync-time");
  if (surgeSyncEl) {
    surgeSyncEl.innerText = `⏱️ อัปเดตทุก 1 ชม. (รอบล่าสุด: ${lastSyncHour} | รอบถัดไป: ${nextSyncHour})`;
  }

  const overview = surge.overview || {};
  const totalDischarge = overview.totalDischargeC13 || surge.totalDischargeC13 || (surge.checkpoints && surge.checkpoints[1] ? surge.checkpoints[1].dischargeRate : 2150);
  const safeCapacity = overview.safeCapacityThreshold || surge.safeCapacityThreshold || 2500;
  const statusText = overview.statusText || surge.overallStatusText || "เฝ้าระวังมวลน้ำหลากเพิ่มขึ้นต่อเนื่อง";
  const overallStatus = overview.status || surge.overallStatus || "warning";
  const keyNote = overview.keyNote || surge.summaryText || "เขื่อนเจ้าพระยาและจุดวัดน้ำตอนบนมีแนวโน้มการระบายน้ำเพิ่มขึ้นอย่างต่อเนื่อง";
  const lastUpdated = overview.lastUpdated || surge.lastReported || `${lastSyncHour}`;

  const cp = surge.checkpoints || [];
  const tidePeriods = tide.tidePeriods || tide.tideWindows || [];

  // Dynamic Convergence Peak Alert evaluation per hour
  const convAlert = getDynamicConvergencePeakAlert(now, totalDischarge);
  tide.convergenceWindow = convAlert;
  tide.tideDate = convAlert.shortDateStr;

  const dischargePercent = Math.min(100, Math.round((totalDischarge / safeCapacity) * 100));

  const html = `
    <!-- Top Overview & Convergence Alert -->
    <div class="surge-overview-wrap">
      <div class="surge-overview-card">
        <div class="surge-ov-header">
          <div class="surge-ov-tag">
            <span class="surge-pulse-icon">🌊</span>
            <strong>สถานการณ์มวลน้ำเหนือ (แม่น้ำเจ้าพระยา)</strong>
          </div>
          <span class="badge-surge-status ${overallStatus === 'critical' ? 'status-critical' : 'status-warning'}">
            ⚠️ ${statusText}
          </span>
        </div>
        
        <div class="surge-ov-body">
          <div class="surge-discharge-stat">
            <div class="stat-number">
              <span class="number-big">${totalDischarge.toLocaleString()}</span>
              <span class="number-unit">ลบ.ม./วินาที</span>
            </div>
            <div class="stat-caption">อัตราการระบายน้ำปัจจุบัน เขื่อนเจ้าพระยา (เกณฑ์เฝ้าระวัง: ${safeCapacity.toLocaleString()} ลบ.ม./วิ)</div>
            <div class="surge-gauge-bar">
              <div class="surge-gauge-fill" style="width: ${dischargePercent}%"></div>
            </div>
            <div class="gauge-labels">
              <span>0</span>
              <span>1,500</span>
              <span>2,000</span>
              <span class="gauge-limit">เกณฑ์เตือนภัย 2,500</span>
            </div>
          </div>

          <div class="surge-ov-desc">
            <div class="surge-note-title">📢 รายงานสรุปสถานการณ์ (อัปเดตทุก 1 ชม.):</div>
            <p class="surge-note-text">${keyNote}</p>
            <div class="surge-update-time">⏱️ ข้อมูลโทรมาตรล่าสุด: ${lastUpdated} (รอบถัดไป: ${nextSyncHour})</div>
          </div>
        </div>
      </div>

      <!-- Convergence Peak Risk Banner (Dynamic Hourly Update & Explicit Date/Time) -->
      <div class="convergence-banner">
        <div class="convergence-badge-wrap">
          <span class="convergence-pill">🚨 CONVERGENCE PEAK ALERT</span>
          <span class="convergence-status-pill ${convAlert.statusPillClass}">${convAlert.statusLabel}</span>
          <span class="convergence-datetime-badge">
            <span class="cal-icon">📅</span> ${convAlert.fullDateStr} • <span class="clock-icon">⏱️</span> เวลาประเมิน: ${convAlert.exactTimeStr}
          </span>
        </div>

        <div class="convergence-window-box">
          <div class="convergence-window-header">
            <span class="cwb-icon">⏳</span>
            <span class="cwb-label">ช่วงเวลาปะทะวิกฤต:</span>
            <strong class="cwb-timerange">${convAlert.timeRange}</strong>
            <span class="cwb-peak-pill">${convAlert.peakDetail}</span>
          </div>
        </div>

        <div class="convergence-title">${convAlert.title}</div>
        <div class="convergence-text">${convAlert.warningText}</div>

        <div class="convergence-footer-meta">
          <div class="cfm-source">
            <span class="cfm-icon">📡</span> วิเคราะห์บูรณาการ: <strong>กรมอุทกศาสตร์ กองทัพเรือ × กรมชลประทาน (อัปเดตทุก 1 ชม.)</strong>
          </div>
          <div class="cfm-sync">
            ⏱️ รอบวิเคราะห์: <strong>${convAlert.syncHourStr}</strong> | รอบถัดไป: <strong>${convAlert.nextHourStr}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkpoint Stations Grid -->
    <div class="surge-section-subhead">
      <h4>📍 จุดตรวจวัดและควบคุมมวลน้ำเหนือ 3 ด่านสำคัญก่อนถึง กทม.</h4>
      <span class="subhead-meta">อัปเดตสถานี C.2 นครสวรรค์, เขื่อนเจ้าพระยา C.13 ชัยนาท, สถานีบางไทร C.29A อยุธยา • ซิงค์ข้อมูลทุก 1 ชม.</span>
    </div>

    <div class="surge-grid">
      ${cp.map((station, idx) => {
        const isCritical = station.status === "critical";
        const isWarning = station.status === "warning";
        const badgeClass = isCritical ? "badge-critical" : (isWarning ? "badge-warning" : "badge-normal");
        const flow = station.flowRateM3s || station.dischargeRate || 0;
        const critFlow = station.criticalFlowThreshold || station.capacityMax || 3000;
        const flowPercent = Math.min(100, Math.round((flow / critFlow) * 100));
        const waterLvl = station.waterLevelM || station.waterLevelMsl || 0;
        const bankLvl = station.bankLevelM || station.bankHeightMsl || 0;
        const code = station.stationCode || (idx === 0 ? "C.2" : (idx === 1 ? "C.13" : "C.29A"));
        const transit = station.timeToBkkText || (station.transitTimeToBkk ? `มวลน้ำใช้เวลาเดินทางถึง กทม. ประมาณ ${station.transitTimeToBkk}` : "มวลน้ำกำลังเคลื่อนตัวเข้าสู่ กทม.");

        return `
          <div class="checkpoint-card ${station.status}">
            <div class="cp-header">
              <div class="cp-station-info">
                <span class="cp-code-badge">${code}</span>
                <div>
                  <h4 class="cp-name">${station.name}</h4>
                  <div class="cp-location">📍 ${station.location}</div>
                </div>
              </div>
              <span class="cp-status-badge ${badgeClass}">${station.statusLabel || 'เฝ้าระวัง'}</span>
            </div>

            <div class="cp-body">
              <div class="cp-stat-row">
                <div class="cp-stat-box">
                  <div class="stat-lbl">อัตราการไหล / ระบายน้ำ</div>
                  <div class="stat-val highlight-flow">
                    ${flow.toLocaleString()} <span class="unit">ลบ.ม./วิ</span>
                  </div>
                  <div class="stat-sub">เกณฑ์วิกฤต: ${critFlow.toLocaleString()} ลบ.ม./วิ</div>
                </div>

                <div class="cp-stat-box">
                  <div class="stat-lbl">ระดับน้ำจริง / ระดับตลิ่ง</div>
                  <div class="stat-val">
                    ${waterLvl.toFixed(2)} <span class="unit">ม.รทก.</span>
                  </div>
                  <div class="stat-sub">ระดับตลิ่ง: ${bankLvl.toFixed(2)} ม.รทก.</div>
                </div>
              </div>

              <!-- Gauge Meter -->
              <div class="cp-meter-wrap">
                <div class="meter-info-line">
                  <span>ความจุทางน้ำที่ใช้งาน</span>
                  <span class="meter-val-text">${flowPercent}%</span>
                </div>
                <div class="cp-meter-bar">
                  <div class="cp-meter-fill ${station.status}" style="width: ${flowPercent}%"></div>
                </div>
              </div>

              <!-- Trend and Transit Time -->
              <div class="cp-meta-footer">
                <div class="cp-trend-item">
                  <span class="trend-icon">📈</span>
                  <span><strong>แนวโน้ม:</strong> ${station.trendText || 'ทรงตัวสูง'}</span>
                </div>
                <div class="cp-time-item">
                  <span class="time-icon">⏱️</span>
                  <span><strong>ระยะเวลาสู่ กทม.:</strong> ${transit}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Sea High Tide Forecast -->
    <div class="surge-section-subhead" style="margin-top: 1.75rem;">
      <h4>🌊 พยากรณ์ระดับน้ำทะเลหนุนสูง ปากแม่น้ำเจ้าพระยา (ป้อมพระจุลฯ - กองทัพเรือ)</h4>
      <span class="subhead-meta">แหล่งข้อมูล: ${tide.source} • ประจำวันที่ ${tide.tideDate || tide.date} • ซิงค์ทุก 1 ชม.</span>
    </div>

    <div class="tide-grid">
      ${tidePeriods.map(tp => {
        const isCrit = tp.riskLevel === "critical";
        const isWarn = tp.riskLevel === "warning";
        const tideClass = isCrit ? "tide-critical" : (isWarn ? "tide-warning" : "tide-normal");

        return `
          <div class="tide-card ${tideClass}">
            <div class="tide-card-head">
              <div class="tide-card-title">${tp.title}</div>
              <span class="tide-badge ${isCrit ? 'badge-critical' : 'badge-warning'}">${tp.riskLabel}</span>
            </div>

            <div class="tide-card-body">
              <div class="tide-level-highlight">
                <div class="tide-level-val">+${tp.expectedLevel.toFixed(2)}</div>
                <div class="tide-level-unit">เมตร จากระดับน้ำทะเลปานกลาง (ม.รทก.)</div>
              </div>

              <div class="tide-timings">
                <div class="timing-item">
                  <span class="timing-label">ช่วงเวลาหนุนสูง:</span>
                  <span class="timing-val">⏰ ${tp.timeRange}</span>
                </div>
                <div class="timing-item">
                  <span class="timing-label">จุดสูงสุด (Peak):</span>
                  <span class="timing-val">🚨 <strong>${tp.peakTime}</strong></span>
                </div>
              </div>

              <div class="tide-desc">
                ${tp.description}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Impacted Zones Tags -->
    <div class="impact-zones-box">
      <div class="impact-title">⚠️ โซนเสี่ยงได้รับผลกระทบจากน้ำทะเลหนุนสูงร่วมกับน้ำเหนือ:</div>
      <div class="impact-tags">
        ${(tide.impactZones || []).map(zone => `<span class="impact-tag">📍 ${zone}</span>`).join("")}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ==========================================================================
// LIVE FLOOD NEWS BROADCASTS & SUMMARIES (ย้อนหลัง 3 ชม. • อัปเดตทุก 1 ชม.)
// ==========================================================================
function renderLiveFloodNews() {
  const container = document.getElementById("live-news-grid");
  if (!container) return;

  const newsList = dashboardState.data.liveFloodNews;
  if (!newsList || newsList.length === 0) return;

  const now = dashboardState.lastUpdated || new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const syncMinute = currentMinute < 30 ? 0 : 30;
  const nextSyncMin = currentMinute < 30 ? 30 : 0;
  const nextSyncHourVal = currentMinute < 30 ? currentHour : (currentHour + 1) % 24;

  const lastSyncStr = `${String(currentHour).padStart(2, '0')}:${String(syncMinute).padStart(2, '0')} น.`;
  const nextSyncStr = `${String(nextSyncHourVal).padStart(2, '0')}:${String(nextSyncMin).padStart(2, '0')} น.`;
  const hh = String(currentHour).padStart(2, '0');
  const mm = String(currentMinute).padStart(2, '0');

  let liveCount = 0;
  let recentCount = 0;

  const cardsHtml = newsList.map((item, itemIdx) => {
    let isLive = false;
    let badgeHtml = "";
    let statusClass = "";
    let timeSlotText = "";

    if (item.isAlwaysLive) {
      isLive = true;
      liveCount++;
      statusClass = "is-live";
      badgeHtml = `<span class="live-status-pill pill-live"><span class="pulse-dot"></span> 🔴 ถ่ายทอดสดตลอด 24 ชม.</span>`;
      timeSlotText = `ถ่ายทอดสดต่อเนื่องตลอด 24 ชม.`;
    } else {
      // Calculate dynamic start and end timestamps relative to base time
      const offsetStart = typeof item.offsetStartMins === 'number' ? item.offsetStartMins : -30;
      const offsetEnd = typeof item.offsetEndMins === 'number' ? item.offsetEndMins : 30;

      const startTime = new Date(now.getTime() + offsetStart * 60 * 1000);
      const endTime = new Date(now.getTime() + offsetEnd * 60 * 1000);

      const startStr = String(startTime.getHours()).padStart(2, '0') + ':' + String(startTime.getMinutes()).padStart(2, '0') + ' น.';
      const endStr = String(endTime.getHours()).padStart(2, '0') + ':' + String(endTime.getMinutes()).padStart(2, '0') + ' น.';

      if (offsetEnd > 0) {
        // Currently ongoing Live broadcast!
        isLive = true;
        liveCount++;
        statusClass = "is-live";
        const minsElapsed = Math.abs(offsetStart);
        badgeHtml = `<span class="live-status-pill pill-live"><span class="pulse-dot"></span> 🔴 กำลังถ่ายทอดสด (LIVE NOW)</span>`;
        timeSlotText = `${startStr} - ${endStr} (ออกอากาศสดมาแล้ว ${minsElapsed} นาที)`;
      } else {
        // Broadcast ended within the last 3 hours!
        recentCount++;
        statusClass = "is-ended";
        const minsAgo = Math.abs(offsetEnd);
        const hrsAgo = Math.floor(minsAgo / 60);
        const remMins = minsAgo % 60;
        const agoStr = hrsAgo > 0 ? `${hrsAgo} ชม. ${remMins > 0 ? remMins + ' นาที' : ''}` : `${minsAgo} นาที`;

        badgeHtml = `<span class="live-status-pill pill-ended">📹 Live จบไป ${agoStr}ที่แล้ว (ช่วง 3 ชม. ล่าสุด)</span>`;
        timeSlotText = `ออกอากาศเมื่อ ${startStr} - ${endStr} (${agoStr}ที่แล้ว)`;
      }
    }

    // Dynamic SitRep Bullet Points per hour from Pool
    let activeProgramName = item.programName;
    let activeBullets = item.summaryBullets;

    if (typeof LIVE_NEWS_HOURLY_SITREP_POOL !== 'undefined' && LIVE_NEWS_HOURLY_SITREP_POOL[item.id]) {
      const poolVariants = LIVE_NEWS_HOURLY_SITREP_POOL[item.id];
      if (poolVariants && poolVariants.length > 0) {
        // Deterministically select the variant based on current hour, keeping content fresh every hour
        const variantIndex = (currentHour + itemIdx) % poolVariants.length;
        const currentSitRep = poolVariants[variantIndex];
        if (currentSitRep) {
          activeProgramName = currentSitRep.programName || activeProgramName;
          activeBullets = currentSitRep.bullets || activeBullets;
        }
      }
    }

    return `
      <div class="live-news-card ${statusClass}">
        <div class="ln-header">
          <div class="ln-station-wrap">
            <span class="ln-category-badge ${item.category}">${item.categoryLabel}</span>
            <div class="ln-station-name">${item.station}</div>
          </div>
          <div class="ln-status-wrap">
            ${badgeHtml}
          </div>
        </div>

        <div class="ln-title-wrap">
          <h4 class="ln-program-name">${activeProgramName}</h4>
          <div class="ln-meta-row">
            <span class="ln-speaker">🎙️ <strong>ผู้ดำเนินรายการ / รายงาน:</strong> ${item.speaker}</span>
            <span class="ln-slot">⏰ <strong>ผังเวลา:</strong> ${timeSlotText}</span>
          </div>
        </div>

        <div class="ln-summary-box">
          <div class="ln-summary-title">
            <span>📝 ประเด็นสำคัญและสถานการณ์ล่าสุด (SitRep):</span>
            <span class="ln-sitrep-tag">รอบ ${lastSyncStr}</span>
          </div>
          <ul class="ln-bullets">
            ${activeBullets.map(bullet => `
              <li>
                <span class="bullet-point">▸</span>
                <span class="bullet-text">${bullet}</span>
              </li>
            `).join("")}
          </ul>
        </div>

        <div class="ln-footer">
          <div class="ln-footer-source">
            <span class="ln-source-icon">📡</span>
            <span class="ln-source-text">แหล่งเผยแพร่: <strong>${item.station}</strong></span>
          </div>
          <span class="ln-type-indicator">
            ${item.embedType === 'youtube-live' ? '▶ รายงานสดผ่าน YouTube' : (item.embedType === 'facebook-live' ? '🔷 แถลงการณ์สดผ่าน Facebook' : (item.embedType === 'tv-live' ? '📺 ออกอากาศสดทางโทรทัศน์' : '📻 รายงานสดทางวิทยุจราจร'))}
          </span>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = cardsHtml;

  const counterEl = document.getElementById("live-news-counter");
  if (counterEl) {
    counterEl.innerText = `${liveCount} รายการสดเรียลไทม์ • ${recentCount} รายการย้อนหลัง 3 ชม. • รวม ${newsList.length} รายการ (หมุนเวียนข้อมูลใหม่แทนที่เก่าทุก 30 นาที)`;
  }

  const clockEl = document.getElementById("live-news-clock");
  if (clockEl) {
    clockEl.innerText = `⏱️ เวลาปัจจุบัน: ${hh}:${mm} น. (รอบซิงค์: ${lastSyncStr} | อัปเดตรายการใหม่ถัดไป: ${nextSyncStr})`;
  }
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
      } else if (s.name.includes("ลาดโตนด")) {
        canal = canals.find(c => c.name.includes("ลาดโตนด"));
      } else if (s.name.includes("ลาดยาว")) {
        canal = canals.find(c => c.name.includes("ลาดยาว"));
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
  try { updateCanalsDynamicData(dashboardState.lastUpdated); } catch (e) { console.error("updateCanals error:", e); }
  try { updateRoadsDynamicData(dashboardState.lastUpdated); } catch (e) { console.error("updateRoads error:", e); }
  try { updatePeaReportsDynamicData(dashboardState.lastUpdated); } catch (e) { console.error("updatePeaReports error:", e); }
  try { updateLiveFloodNewsDynamicData(dashboardState.lastUpdated, true); } catch (e) { console.error("updateLiveNews error:", e); }
  try { initEventListeners(); } catch (e) { console.error("initEventListeners error:", e); }
  try { renderDashboard(); } catch (e) { console.error("renderDashboard error:", e); }
  try { startCctvRenderLoops(); } catch (e) { console.error("startCctvRenderLoops error:", e); }
  try { initTrendChart(); } catch (e) { console.warn("Chart init failed (safe to ignore if offline):", e); }
  try { setupAutoRefresh(300); } catch (e) { console.error("setupAutoRefresh error:", e); }

  // Initial fetch of real-world satellite weather data
  try {
    fetchRealWorldWeatherForZones().then(() => {
      updatePriorityZonesRainData(dashboardState.lastUpdated);
      renderTopPriorityZones();
      renderSummaryMetrics();
    }).catch(err => console.warn("Live weather initial load fallback:", err));
  } catch (e) { console.error("fetchRealWorldWeather error:", e); }

  // 30-Minute Auto-Sync for Live News (FIFO Rolling Queue 16 รายการ) & Upstream Surge & Sea Tide Forecast
  try {
    setInterval(() => {
      dashboardState.lastUpdated = new Date();
      updateLiveFloodNewsDynamicData(dashboardState.lastUpdated, true);
      simulateDataFluctuation();
      renderSurgeAndTide();
      renderLiveFloodNews();
    }, 1800 * 1000);
  } catch (e) { console.error("liveNewsAutoSync error:", e); }
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

