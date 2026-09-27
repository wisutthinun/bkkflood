// คำนวณเวลาตั้งต้นสัมพันธ์กับเวลาจริงของผู้ใช้งาน ณ ขณะโหลดหน้าเว็บ
const _loadTime = new Date();
const _formatOffsetTime = (minsOffset) => {
  const d = new Date(_loadTime.getTime() - minsOffset * 60 * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} น.`;
};

const INITIAL_DATA = {
  // โซนพิเศษที่ปักหมุดไว้ด้านบนสุด
  priorityZones: [
    {
      id: "ngamwongwan",
      name: "โซนงามวงศ์วาน",
      province: "นนทบุรี / กทม.",
      status: "critical", // normal, warning, critical
      statusText: "วิกฤต - มีน้ำท่วมขังรอการระบาย",
      roadFloodLevel: 25, // cm
      roadCondition: "ท่วมช่องทางซ้ายและกลาง 2-3 เลน (ระดับน้ำ 20-25 ซม.) รถเล็กโปรดหลีกเลี่ยง",
      keyLocation: "แยกพงษ์เพชร - หน้าเดอะมอลล์งามวงศ์วาน - ใต้ทางด่วน",
      canalName: "คลองบางเขน (ช่วงงามวงศ์วาน) / คลองเปรมประชากร",
      canalLevel: 1.45, // ม.รทก.
      canalMaxLevel: 1.50,
      canalCapacityPercent: 96,
      cctvId: "cctv-ngamwongwan-1",
      cctvName: "แยกพงษ์เพชร (ถ.งามวงศ์วาน)",
      cctvSecondary: "หน้าเดอะมอลล์งามวงศ์วาน",
      cctvSecondaryId: "cctv-ngamwongwan-2",
      coordinates: [13.8584, 100.5435],
      advice: "แนะนำเลี่ยงใช้สะพานข้ามแยกพงษ์เพชร หรือใช้เส้นทางรัตนาธิเบศร์ทดแทน",
      trend: "up", // up, stable, down
      rainfall: {
        accumulated24h: 112.5, // มม.
        isRaining: true,
        intensity: "ฝนตกปานกลาง",
        intensityLevel: "moderate", // heavy, moderate, light, none
        startTime: _formatOffsetTime(140),
        durationText: "ตกมาแล้ว 2 ชม. 20 นาที",
        durationMinutes: 140,
        stoppedTime: null,
        radarForecast: `คาดว่ากลุ่มฝนจะเคลื่อนตัวผ่านพ้นช่วงเวลา ${_formatOffsetTime(-25)}`
      },
      googleFloodHubAlert: {
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 88,
        peakDate: "28 - 29 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์มวลน้ำคลองบางเขน/เปรมฯ มีแนวโน้มแตะระดับล้นตลิ่งใน 48 ชม."
      }
    },
    {
      id: "prachachuen",
      name: "โซนประชาชื่น",
      province: "กทม. / นนทบุรี",
      status: "warning",
      statusText: "เตือนภัย - น้ำปริ่มขอบทางเท้า",
      roadFloodLevel: 15, // cm
      roadCondition: "มีน้ำท่วมขังผิวจราจร 1-2 เลนซ้าย ช่วงแยกประชานุกูลและเลียบคลองประปา",
      keyLocation: "แยกประชานุกูล - ถนนเลียบคลองประปา - ประชาชื่น 30",
      canalName: "คลองประปา (สถานีบางซื่อ-ประชาชื่น) / คลองบางเขน",
      canalLevel: 1.28,
      canalMaxLevel: 1.60,
      canalCapacityPercent: 80,
      cctvId: "cctv-prachachuen-1",
      cctvName: "แยกประชานุกูล (ถ.ประชาชื่น)",
      cctvSecondary: "ถนนเลียบคลองประปา (ตัดงามวงศ์วาน)",
      cctvSecondaryId: "cctv-prachachuen-2",
      coordinates: [13.8342, 100.5372],
      advice: "รถเล็กสัญจรได้ด้วยความระมัดระวัง ใช้ช่องทางขวาสุด ชะลอความเร็ว",
      trend: "stable",
      rainfall: {
        accumulated24h: 89.0, // มม.
        isRaining: false,
        intensity: "ฝนหยุดตกแล้ว",
        intensityLevel: "none",
        startTime: _formatOffsetTime(140),
        durationText: "ตกต่อเนื่องรวม 1 ชม. 45 นาที",
        durationMinutes: 105,
        stoppedTime: _formatOffsetTime(35),
        radarForecast: "กลุ่มฝนสลายตัวแล้ว ไม่มีเมฆฝนใหม่เข้าพื้นที่"
      },
      googleFloodHubAlert: {
        riskLevel: "warning",
        riskLabel: "เตือนภัย (Warning)",
        probability: 65,
        peakDate: "29 - 30 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์ระดับน้ำทรงตัวสูง เสี่ยงน้ำรอระบายแยกประชานุกูล"
      }
    },
    {
      id: "chaengwattana",
      name: "โซนแจ้งวัฒนะ",
      province: "นนทบุรี / กทม.",
      status: "critical",
      statusText: "วิกฤต - น้ำท่วมสูงหลายจุด",
      roadFloodLevel: 30, // cm
      roadCondition: "น้ำท่วมขัง 2-3 เลน ช่วงหน้าศูนย์ราชการ วงเวียนหลักสี่ และหน้าเซ็นทรัล",
      keyLocation: "หน้าศูนย์ราชการเฉลิมพระเกียรติ - วงเวียนหลักสี่ - ปากเกร็ด",
      canalName: "คลองบางตลาด / คลองเปรมประชากร (ช่วงแจ้งวัฒนะ)",
      canalLevel: 1.68,
      canalMaxLevel: 1.70,
      canalCapacityPercent: 98,
      cctvId: "cctv-chaengwattana-1",
      cctvName: "ถ.แจ้งวัฒนะ หน้าศูนย์ราชการ",
      cctvSecondary: "วงเวียนหลักสี่ (มุ่งหน้าแจ้งวัฒนะ)",
      cctvSecondaryId: "cctv-chaengwattana-2",
      coordinates: [13.8893, 100.5654],
      advice: "รถเก๋งขนาดเล็กห้ามผ่าน มีเครื่องสูบน้ำขนาดใหญ่กำลังเร่งระบายลงคลองบางตลาด",
      trend: "up",
      rainfall: {
        accumulated24h: 135.0, // มม. (สูงสุด)
        isRaining: true,
        intensity: "ฝนตกหนักต่อเนื่อง",
        intensityLevel: "heavy",
        startTime: _formatOffsetTime(165),
        durationText: "ตกมาแล้ว 2 ชม. 45 นาที",
        durationMinutes: 165,
        stoppedTime: null,
        radarForecast: `กลุ่มฝนฟ้าคะนองหนาแน่น คาดตกต่อเนื่องถึงเวลา ${_formatOffsetTime(-45)}`
      },
      googleFloodHubAlert: {
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 85,
        peakDate: "29 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์น้ำหลากสมทบน้ำหนุน ระบายออกเจ้าพระยาชะลอตัว"
      }
    },
    {
      id: "kasetsart",
      name: "โซน ม.เกษตรศาสตร์",
      province: "กทม.",
      status: "warning",
      statusText: "เตือนภัย - น้ำขังหน้าประตูงามวงศ์วาน",
      roadFloodLevel: 18, // cm
      roadCondition: "น้ำท่วมเลนคู่ขนานหน้าประตู 1 และ 2 งามวงศ์วาน และใต้อุโมงค์เกษตรมีน้ำรอระบาย",
      keyLocation: "แยกเกษตร - ประตู 1-3 ถ.งามวงศ์วาน - ถ.พหลโยธินหน้า มก.",
      canalName: "คลองบางเขน (ช่วง ม.เกษตร) / คลองบางบัว",
      canalLevel: 1.35,
      canalMaxLevel: 1.60,
      canalCapacityPercent: 84,
      cctvId: "cctv-kasetsart-1",
      cctvName: "แยกเกษตรศาสตร์ (ถ.งามวงศ์วานตัดพหลโยธิน)",
      cctvSecondary: "ถ.งามวงศ์วาน ประตู 1 ม.เกษตรฯ",
      cctvSecondaryId: "cctv-kasetsart-2",
      coordinates: [13.8447, 100.5731],
      advice: "แนะนำเข้า-ออก มหาวิทยาลัยผ่านประตูพหลโยธินและวิภาวดีรังสิตแทน",
      trend: "down",
      rainfall: {
        accumulated24h: 94.5, // มม.
        isRaining: true,
        intensity: "ฝนปรอยๆ เบาบาง",
        intensityLevel: "light",
        startTime: _formatOffsetTime(110),
        durationText: "ตกมาแล้ว 1 ชม. 50 นาที",
        durationMinutes: 110,
        stoppedTime: null,
        radarForecast: `เมฆฝนเริ่มเบาบาง คาดว่าจะหยุดตกช่วงเวลา ${_formatOffsetTime(-20)}`
      },
      googleFloodHubAlert: {
        riskLevel: "warning",
        riskLabel: "เตือนภัย (Warning)",
        probability: 72,
        peakDate: "29 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์คลองบางเขนรับน้ำเพิ่มขึ้น เสี่ยงน้ำขังผิวทางหน้าประตู 1-2"
      }
    },
    {
      id: "muang-nonthaburi",
      name: "โซน อ.เมือง นนทบุรี",
      province: "นนทบุรี",
      status: "warning",
      statusText: "เฝ้าระวัง - น้ำหนุนและน้ำรอระบาย",
      roadFloodLevel: 16, // cm
      roadCondition: "มีน้ำท่วมขังผิวจราจร 1 เลนซ้ายช่วงแยกแคราย และบริเวณท่าน้ำนนท์มีน้ำเอ่อล้นรอการระบาย",
      keyLocation: "สี่แยกแคราย - ถ.รัตนาธิเบศร์ - ท่าน้ำนนท์ - สะพานพระนั่งเกล้า",
      canalName: "แม่น้ำเจ้าพระยา (ท่าน้ำนนท์) / คลองบางใหญ่",
      canalLevel: 1.58, // ม.รทก.
      canalMaxLevel: 1.80,
      canalCapacityPercent: 88,
      cctvId: "cctv-nonthaburi-khaerai",
      cctvName: "สี่แยกแคราย (รัตนาธิเบศร์-ติวานนท์)",
      cctvSecondary: "ท่าน้ำนนทบุรี (หอนาฬิกา)",
      cctvSecondaryId: "cctv-nonthaburi-pier",
      coordinates: [13.8589, 100.5183],
      advice: "ระมัดระวังช่วงน้ำทะเลหนุนสูง ท่าน้ำนนท์และแยกแครายควรชะลอความเร็ว",
      trend: "up",
      rainfall: {
        accumulated24h: 104.0, // มม.
        isRaining: true,
        intensity: "ฝนตกปานกลาง",
        intensityLevel: "moderate",
        startTime: _formatOffsetTime(135),
        durationText: "ตกมาแล้ว 2 ชม. 15 นาที",
        durationMinutes: 135,
        stoppedTime: null,
        radarForecast: `กลุ่มฝนยังคงปกคลุมเขตเทศบาล คาดเบาบางลงหลัง ${_formatOffsetTime(-30)}`
      },
      googleFloodHubAlert: {
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 82,
        peakDate: "29 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์แม่น้ำเจ้าพระยาเอ่อล้นนอกคันกั้นน้ำท่าน้ำนนท์ช่วงน้ำหนุนสูงสุด"
      }
    },
    {
      id: "chinkhet",
      name: "โซนชุมชนชินเขต",
      province: "กทม. / หลักสี่-จตุจักร",
      status: "warning",
      statusText: "เฝ้าระวัง - น้ำรอการระบายในซอยย่อย",
      roadFloodLevel: 18, // cm
      roadCondition: "มีน้ำท่วมขังในซอยชินเขต 1 (งามวงศ์วาน 43) และซอยชินเขต 2 (งามวงศ์วาน 47) ระดับ 15-18 ซม. โดยเฉพาะช่วงแยก 6-8 รถเล็กควรชะลอความเร็ว",
      keyLocation: "ซอยชินเขต 1-2 (งามวงศ์วาน 43/47) - ชุมชนร่วมใจพัฒนา - ใกล้ สนง.ใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA)",
      canalName: "คลองเปรมประชากร / ลำรางสาธารณะชินเขต",
      canalLevel: 1.46, // ม.รทก.
      canalMaxLevel: 1.50,
      canalCapacityPercent: 92,
      cctvId: "cctv-pea-chinkhet",
      cctvName: "หน้า สนง.ใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA) / ปากซอยชินเขต",
      cctvSecondary: "ซอยชินเขต 2 (งามวงศ์วาน 47)",
      cctvSecondaryId: "cctv-chinkhet-2",
      coordinates: [13.8542, 100.5518],
      advice: "แนะนำเลี่ยงเข้าซอยย่อยชินเขต 2 แยก 6-8 ซึ่งเป็นแอ่งกระทะ ให้ใช้ถนนสายหลักงามวงศ์วานหรือเลียบคลองประปา",
      trend: "stable",
      rainfall: {
        accumulated24h: 108.5, // มม.
        isRaining: true,
        intensity: "ฝนตกปานกลาง",
        intensityLevel: "moderate",
        startTime: _formatOffsetTime(125),
        durationText: "ตกมาแล้ว 2 ชม. 5 นาที",
        durationMinutes: 125,
        stoppedTime: null,
        radarForecast: `กลุ่มฝนกำลังเคลื่อนตัวไปทางทิศตะวันออกเฉียงเหนือ คาดเบาบางลงราว ${_formatOffsetTime(-25)}`
      },
      googleFloodHubAlert: {
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 84,
        peakDate: "28 - 29 ก.ย.",
        forecastSummary: "โมเดล AI พยากรณ์คลองเปรมประชากรช่วงชินเขต-กฟภ. น้ำทรงตัวสูง ระบายออกช้า"
      }
    }
  ],

  // ข้อมูลระดับน้ำในคลอง (กรุงเทพฯ นนทบุรี ปทุมธานี)
  canals: [
    {
      id: "canal-prem-thewasunthorn",
      name: "คลองเปรมประชากร",
      station: "สถานีวัดน้ำวัดเทวสุนทร (เขตจตุจักร)",
      province: "กทม.",
      zone: "งามวงศ์วาน / ม.เกษตร",
      baseLevel: 1.48,
      currentLevel: 1.48, // ม.รทก.
      warningLevel: 1.30,
      criticalLevel: 1.50,
      capacityPercent: 98,
      status: "critical", // normal, watch, warning, critical
      statusLabel: "วิกฤตล้นตลิ่ง",
      flowRate: "18.5 ลบ.ม./วินาที (เดินเครื่องสูบน้ำ 4 เครื่อง)",
      trend: "up",
      coordinates: [13.8491, 100.5621]
    },
    {
      id: "canal-bangkhen-ngamwongwan",
      name: "คลองบางเขน",
      station: "สถานีประตูระบายน้ำคลองบางเขน (งามวงศ์วาน-พงษ์เพชร)",
      province: "นนทบุรี",
      zone: "งามวงศ์วาน",
      baseLevel: 1.42,
      currentLevel: 1.42,
      warningLevel: 1.25,
      criticalLevel: 1.45,
      capacityPercent: 95,
      status: "critical",
      statusLabel: "วิกฤตเฝ้าระวังสูง",
      flowRate: "14.2 ลบ.ม./วินาที (เปิดประตูน้ำ 80%)",
      trend: "up",
      coordinates: [13.8569, 100.5402]
    },
    {
      id: "canal-ladtanot-nonthaburi",
      name: "คลองลาดโตนด",
      station: "สถานีประตูระบายน้ำคลองลาดโตนด (งามวงศ์วาน-ชินเขต เมืองนนทบุรี)",
      province: "นนทบุรี",
      zone: "งามวงศ์วาน / พงษ์เพชร-ชินเขต",
      baseLevel: 1.38,
      currentLevel: 1.38,
      warningLevel: 1.25,
      criticalLevel: 1.45,
      capacityPercent: 95,
      status: "critical",
      statusLabel: "วิกฤตเฝ้าระวังสูง",
      flowRate: "13.8 ลบ.ม./วินาที (เดินเครื่องสูบน้ำ 3 เครื่อง เร่งระบายออกสู่คลองบางเขน)",
      trend: "up",
      coordinates: [13.8588, 100.5415]
    },
    {
      id: "canal-ladyao-chatuchak",
      name: "คลองลาดยาว",
      station: "สถานีประตูระบายน้ำและสูบน้ำคลองลาดยาว (วิภาวดี-งามวงศ์วาน เขตจตุจักร)",
      province: "กทม.",
      zone: "งามวงศ์วาน / ลาดยาว (จตุจักร)",
      baseLevel: 1.26,
      currentLevel: 1.26,
      warningLevel: 1.20,
      criticalLevel: 1.40,
      capacityPercent: 90,
      status: "warning",
      statusLabel: "ระดับเตือนภัย",
      flowRate: "10.5 ลบ.ม./วินาที (เดินเครื่องสูบน้ำ 2 เครื่อง เร่งพร่องน้ำลงคลองเปรมฯ)",
      trend: "up",
      coordinates: [13.8445, 100.5590]
    },
    {
      id: "canal-prapa-samsen",
      name: "คลองประปา",
      station: "สถานีวัดระดับน้ำคลองประปา (ช่วงแยกประชานุกูล-ประชาชื่น)",
      province: "กทม.",
      zone: "ประชาชื่น",
      baseLevel: 1.28,
      currentLevel: 1.28,
      warningLevel: 1.35,
      criticalLevel: 1.60,
      capacityPercent: 80,
      status: "warning",
      statusLabel: "ระดับเตือนภัย",
      flowRate: "ระดับน้ำควบคุมของการประปานครหลวง",
      trend: "stable",
      coordinates: [13.8365, 100.5369]
    },
    {
      id: "canal-bangtalad-chaengwattana",
      name: "คลองบางตลาด",
      station: "สถานีระบายน้ำคลองบางตลาด (ปากเกร็ด-แจ้งวัฒนะ)",
      province: "นนทบุรี",
      zone: "แจ้งวัฒนะ",
      baseLevel: 1.68,
      currentLevel: 1.68,
      warningLevel: 1.40,
      criticalLevel: 1.70,
      capacityPercent: 98,
      status: "critical",
      statusLabel: "วิกฤตล้นตลิ่ง",
      flowRate: "22.0 ลบ.ม./วินาที (สูบน้ำเต็มกำลัง)",
      trend: "up",
      coordinates: [13.8942, 100.5284]
    },
    {
      id: "canal-bangbua-kaset",
      name: "คลองบางบัว",
      station: "สถานีวัดน้ำคลองบางบัว (สะพานพหลโยธิน-ม.เกษตร)",
      province: "กทม.",
      zone: "ม.เกษตร",
      baseLevel: 1.35,
      currentLevel: 1.35,
      warningLevel: 1.30,
      criticalLevel: 1.55,
      capacityPercent: 87,
      status: "warning",
      statusLabel: "เฝ้าระวัง",
      flowRate: "12.8 ลบ.ม./วินาที",
      trend: "down",
      coordinates: [13.8572, 100.5891]
    },
    {
      id: "canal-rangsit-prathum",
      name: "คลองรังสิตประยูรศักดิ์",
      station: "สถานีสูบน้ำกึ่งถาวรปากคลองรังสิตฯ (ปทุมธานี)",
      province: "ปทุมธานี",
      zone: "ปทุมธานี-รังสิต",
      baseLevel: 1.82,
      currentLevel: 1.82,
      warningLevel: 1.60,
      criticalLevel: 1.90,
      capacityPercent: 95,
      status: "critical",
      statusLabel: "ระดับวิกฤต",
      flowRate: "65.0 ลบ.ม./วินาที (เดินเครื่องสูบน้ำจุฬาลงกรณ์)",
      trend: "up",
      coordinates: [13.9872, 100.6053]
    },
    {
      id: "canal-ladprao-chokchai4",
      name: "คลองลาดพร้าว",
      station: "สถานีวัดน้ำคลองลาดพร้าว (ช่วงวัดลาดพร้าว-โชคชัย 4)",
      province: "กทม.",
      zone: "กทม. ชั้นใน",
      baseLevel: 0.95,
      currentLevel: 0.95,
      warningLevel: 1.10,
      criticalLevel: 1.35,
      capacityPercent: 70,
      status: "watch",
      statusLabel: "ปกติ-ค่อนข้างสูง",
      flowRate: "16.4 ลบ.ม./วินาที",
      trend: "down",
      coordinates: [13.8055, 100.5898]
    },
    {
      id: "canal-saensaep-bangsun",
      name: "คลองแสนแสบ",
      station: "สถานีประตูระบายน้ำสระปทุม (ปทุมวัน-บางกะปิ)",
      province: "กทม.",
      zone: "กทม. กลาง",
      baseLevel: -0.15,
      currentLevel: -0.15,
      warningLevel: 0.30,
      criticalLevel: 0.60,
      capacityPercent: 55,
      status: "normal",
      statusLabel: "ระดับปกติ",
      flowRate: "28.0 ลบ.ม./วินาที (เดินเรือตามปกติ)",
      trend: "stable",
      coordinates: [13.7482, 100.5321]
    },
    {
      id: "canal-bangyai-nonthaburi",
      name: "คลองบางใหญ่",
      station: "สถานีประตูระบายน้ำคลองบางใหญ่ (นนทบุรี)",
      province: "นนทบุรี",
      zone: "นนทบุรี ตะวันตก",
      baseLevel: 1.25,
      currentLevel: 1.25,
      warningLevel: 1.30,
      criticalLevel: 1.55,
      capacityPercent: 80,
      status: "watch",
      statusLabel: "เฝ้าระวัง",
      flowRate: "10.5 ลบ.ม./วินาที",
      trend: "stable",
      coordinates: [13.8423, 100.4125]
    },
    {
      id: "canal-chiangrak-pathum",
      name: "คลองเชียงรากใหญ่",
      station: "สถานีประตูระบายน้ำเชียงราก (สามโคก-เมืองปทุม)",
      province: "ปทุมธานี",
      zone: "ปทุมธานี เหนือ",
      baseLevel: 1.55,
      currentLevel: 1.55,
      warningLevel: 1.50,
      criticalLevel: 1.80,
      capacityPercent: 86,
      status: "warning",
      statusLabel: "เตือนภัย",
      flowRate: "35.2 ลบ.ม./วินาที",
      trend: "up",
      coordinates: [14.0531, 100.5289]
    }
  ],

  // ข้อมูลระดับน้ำตามถนนต่างๆ
  roads: [
    {
      id: "road-pea-ngamwongwan",
      roadName: "ถนนงามวงศ์วาน (หน้า สนง.ใหญ่ กฟภ. - ปากซอยชินเขต)",
      location: "หน้าสำนักงานใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA) - ปากซอยชินเขต 1-2 (งามวงศ์วาน 43/47)",
      province: "กทม.",
      zone: "ชุมชนชินเขต / PEA",
      baseFloodDepth: 14,
      floodDepth: 14, // ซม.
      affectedLanes: "1 เลนซ้ายสุดฝั่งขาออก และทางคู่ขนานเชื่อม สนง.ใหญ่ กฟภ.",
      severity: "moderate", // normal, minor, moderate, critical
      severityLabel: "น้ำท่วมปานกลาง",
      vehicleAdvice: "รถเล็กชะลอความเร็ว เลี่ยงชิดซ้าย แนะนำเบี่ยงออกเลนกลาง-ขวา",
      cause: "น้ำรอการระบายลงคลองเปรมประชากรและคลองบางเขน",
      pumpsActive: 5,
      drainageStatus: "เครื่องสูบน้ำเคลื่อนที่ กทม. และ กฟภ. เร่งสูบระบายต่อเนื่อง",
      coordinates: [13.8542, 100.5518]
    },
    {
      id: "road-ngamwongwan-pongphet",
      roadName: "ถนนงามวงศ์วาน",
      location: "สี่แยกพงษ์เพชร - หน้าเดอะมอลล์งามวงศ์วาน",
      province: "นนทบุรี / กทม.",
      zone: "งามวงศ์วาน",
      baseFloodDepth: 25,
      floodDepth: 25, // ซม.
      affectedLanes: "2-3 เลนซ้าย และช่องทางคู่ขนาน",
      severity: "critical", // normal, minor, moderate, critical
      severityLabel: "น้ำท่วมสูง (วิกฤต)",
      vehicleAdvice: "รถเล็ก รถเก๋ง มอเตอร์ไซค์ ห้ามผ่านเด็ดขาด",
      cause: "ฝนตกสะสมต่อเนื่อง คลองบางเขนระบายน้ำไม่ทัน",
      pumpsActive: 6,
      drainageStatus: "กำลังเร่งเดินเครื่องสูบน้ำเคลื่อนที่ 6 เครื่อง",
      coordinates: [13.8584, 100.5435]
    },
    {
      id: "road-prachachuen-prachanukul",
      roadName: "ถนนประชาชื่น",
      location: "สี่แยกประชานุกูล - ประชาชื่น 30",
      province: "กทม.",
      zone: "ประชาชื่น",
      baseFloodDepth: 15,
      floodDepth: 15,
      affectedLanes: "1-2 เลนซ้าย (ชิดทางเท้า)",
      severity: "moderate",
      severityLabel: "น้ำท่วมปานกลาง",
      vehicleAdvice: "รถเล็กผ่านได้ด้วยความระมัดระวัง แนะนำใช้เลนขวา",
      cause: "น้ำจากคลองประปาปริ่มขอบคันกั้นน้ำ",
      pumpsActive: 4,
      drainageStatus: "ระดับน้ำเริ่มทรงตัว คาดแห้งใน 1 ชั่วโมงหากไม่มีฝนเพิ่ม",
      coordinates: [13.8342, 100.5372]
    },
    {
      id: "road-chaengwattana-gov",
      roadName: "ถนนแจ้งวัฒนะ",
      location: "หน้าศูนย์ราชการเฉลิมพระเกียรติ - กรมการกงสุล",
      province: "กทม. / นนทบุรี",
      zone: "แจ้งวัฒนะ",
      baseFloodDepth: 30,
      floodDepth: 30,
      affectedLanes: "ท่วมเต็มผิวจราจรทุกช่องทาง (ทั้งฝั่งขาเข้า-ขาออก)",
      severity: "critical",
      severityLabel: "วิกฤตระดับสูงสุด",
      vehicleAdvice: "ห้ามรถทุกชนิดสัญจรผ่าน (ระดับน้ำถึงท้องรถ)",
      cause: "น้ำหนุนจากคลองเปรมประชากรและคลองบางตลาดล้นท่วมผิวทาง",
      pumpsActive: 8,
      drainageStatus: "ระดมรถสูบน้ำแรงดันสูงของ ปภ. 8 คันเร่งผลักดันน้ำ",
      coordinates: [13.8893, 100.5654]
    },
    {
      id: "road-kasetsart-ngamwongwan",
      roadName: "ถนนงามวงศ์วาน (หน้า ม.เกษตรศาสตร์)",
      location: "แยกเกษตรศาสตร์ - ประตู 1 มหาวิทยาลัยเกษตรศาสตร์",
      province: "กทม.",
      zone: "ม.เกษตร",
      baseFloodDepth: 18,
      floodDepth: 18,
      affectedLanes: "เลนซ้ายสุดและช่องทางคู่ขนาน 1 เลน",
      severity: "moderate",
      severityLabel: "น้ำท่วมปานกลาง",
      vehicleAdvice: "รถเล็กโปรดชะลอความเร็ว หลีกเลี่ยงเลนซ้าย",
      cause: "ท่อระบายน้ำบริเวณประตู 1 ม.เกษตรฯ ระบายช้า",
      pumpsActive: 3,
      drainageStatus: "เครื่องสูบน้ำเทศบาลทำงานต่อเนื่อง ระดับน้ำลดลงชั่วโมงละ 2 ซม.",
      coordinates: [13.8447, 100.5731]
    },
    {
      id: "road-vibhavadi-laksi",
      roadName: "ถนนวิภาวดีรังสิต",
      location: "ห้าแยกลาดพร้าว - สี่แยกหลักสี่ (ช่วงคลองบางซื่อ)",
      province: "กทม.",
      zone: "กทม. ตอนเหนือ",
      baseFloodDepth: 10,
      floodDepth: 10,
      affectedLanes: "ทางคู่ขนานฝั่งขาออก บริเวณป้ายรถเมล์",
      severity: "minor",
      severityLabel: "น้ำรอการระบาย",
      vehicleAdvice: "สัญจรผ่านได้ทุกช่องทาง ชะลอความเร็วเลนคู่ขนาน",
      cause: "ฝนตกสะสม น้ำระบายลงท่อช้าช่วงชั่วโมงเร่งด่วน",
      pumpsActive: 2,
      drainageStatus: "เปิดบานประตูระบายน้ำคลองบางซื่อเต็มที่",
      coordinates: [13.8643, 100.5821]
    },
    {
      id: "road-rattanathibet-non",
      roadName: "ถนนรัตนาธิเบศร์",
      location: "แยกแคราย - เชิงสะพานพระนั่งเกล้า",
      province: "นนทบุรี",
      zone: "นนทบุรี",
      baseFloodDepth: 12,
      floodDepth: 12,
      affectedLanes: "ช่องทางซ้ายสุด 1 เลน",
      severity: "minor",
      severityLabel: "น้ำรอการระบาย",
      vehicleAdvice: "รถทุกประเภทผ่านได้ปกติ",
      cause: "น้ำขังบริเวณจุดกลับรถใต้สะพาน",
      pumpsActive: 2,
      drainageStatus: "เจ้าหน้าที่เทศบาลนครนนทบุรีกำลังกวาดเศษขยะอุดตันท่อ",
      coordinates: [13.8611, 100.4855]
    },
    {
      id: "road-tiwanon-pakred",
      roadName: "ถนนติวานนท์",
      location: "ห้าแยกปากเกร็ด - แยกสวนสมเด็จ",
      province: "นนทบุรี",
      zone: "นนทบุรี ตอนเหนือ",
      baseFloodDepth: 22,
      floodDepth: 22,
      affectedLanes: "2 ช่องจราจรฝั่งมุ่งหน้าปทุมธานี",
      severity: "critical",
      severityLabel: "น้ำท่วมสูง",
      vehicleAdvice: "รถเล็กไม่แนะนำให้ผ่าน ชะลอตัวติดขัดท้ายแถวยาว",
      cause: "ระดับน้ำคลองบ้านใหม่หนุนสูง",
      pumpsActive: 4,
      drainageStatus: "ติดตั้งเครื่องสูบน้ำไฮดรอลิกเพิ่ม 2 เครื่อง",
      coordinates: [13.9167, 100.5052]
    },
    {
      id: "road-phahonyothin-rangsit",
      roadName: "ถนนพหลโยธิน (รังสิต-ปทุมธานี)",
      location: "หน้าศูนย์การค้าฟิวเจอร์พาร์ครังสิต - ตลาดสี่มุมเมือง",
      province: "ปทุมธานี",
      zone: "ปทุมธานี",
      baseFloodDepth: 28,
      floodDepth: 28,
      affectedLanes: "ช่องทางคู่ขนานท่วมเต็มทุกเลน ช่องทางด่วนมีน้ำขังเลนซ้าย",
      severity: "critical",
      severityLabel: "วิกฤตสัญจรลำบาก",
      vehicleAdvice: "เลี่ยงช่องทางคู่ขนาน ใช้ช่องทางด่วนหรือทางยกระดับโทลล์เวย์",
      cause: "น้ำจากคลองรังสิตเอ่อล้นเข้าท่อระบายน้ำบนถนน",
      pumpsActive: 10,
      drainageStatus: "เทศบาลนครรังสิตเปิดเครื่องสูบน้ำ 10 ตัวระบายลงเจ้าพระยา",
      coordinates: [13.9892, 100.6175]
    },
    {
      id: "road-lamlukka-pathum",
      roadName: "ถนนลำลูกกา",
      location: "ช่วงคลอง 1 - คลอง 3 ลำลูกกา",
      province: "ปทุมธานี",
      zone: "ปทุมธานี ตะวันออก",
      baseFloodDepth: 14,
      floodDepth: 14,
      affectedLanes: "1 ช่องทางซ้ายฝั่งขาเข้า",
      severity: "moderate",
      severityLabel: "น้ำท่วมปานกลาง",
      vehicleAdvice: "รถเล็กผ่านได้ด้วยความระมัดระวัง",
      cause: "น้ำรอการระบายลงคูคลองข้างทาง",
      pumpsActive: 3,
      drainageStatus: "เร่งผลักดันน้ำลงสู่คลองหกวา",
      coordinates: [13.9351, 100.6428]
    }
  ],

  // รายการกล้องวงจรปิด CCTV ถนนและจุดตรวจวัด (ถ่ายทอดสดจริงจากสภาพจราจรและศูนย์ควบคุม)
  cctvList: [
    {
      id: "cctv-ngamwongwan-1",
      name: "แยกพงษ์เพชร (ถ.งามวงศ์วาน)",
      zone: "งามวงศ์วาน",
      province: "นนทบุรี / กทม.",
      road: "ถ.งามวงศ์วาน ตัด ถ.ประชาชื่น",
      direction: "มุ่งหน้าแคราย / ทางด่วนงามวงศ์วาน",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 25,
      vehicleDensity: "ติดขัดมาก (ท้ายแถวสะสมถึงแยกเกษตร)",
      coordinates: [13.8584, 100.5435],
      agency: "สำนักการจราจรและขนส่ง กทม. / แขวงทางหลวงนนทบุรี",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-42475-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=1",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-ngamwongwan-2",
      name: "หน้าเดอะมอลล์งามวงศ์วาน",
      zone: "งามวงศ์วาน",
      province: "นนทบุรี",
      road: "ถ.งามวงศ์วาน ฝั่งขาออก",
      direction: "มุ่งหน้าสี่แยกแคราย",
      status: "online",
      fps: 25,
      hasFlood: true,
      floodLevelCm: 20,
      vehicleDensity: "ติดขัด รถชะลอตัวลุยน้ำขัง",
      coordinates: [13.8598, 100.5392],
      agency: "เทศบาลนครนนทบุรี / ศูนย์ควบคุมจราจร",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-busy-avenue-42472-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=2",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-prachachuen-1",
      name: "แยกประชานุกูล (ถ.ประชาชื่น)",
      zone: "ประชาชื่น",
      province: "กทม.",
      road: "ถ.ประชาชื่น ตัด ถ.รัชดาภิเษก",
      direction: "มุ่งหน้าโรงพยาบาลเกษมราษฎร์",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 15,
      vehicleDensity: "เคลื่อนตัวได้ช้า สลับหยุดนิ่ง",
      coordinates: [13.8342, 100.5372],
      agency: "สำนักการจราจรและขนส่ง กทม.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-heavy-traffic-on-a-highway-at-night-42473-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=3",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-prachachuen-2",
      name: "เลียบคลองประปา - งามวงศ์วาน",
      zone: "ประชาชื่น",
      province: "นนทบุรี",
      road: "ถ.เลียบคลองประปา ประชาชื่นนนท์",
      direction: "มุ่งหน้าแจ้งวัฒนะ",
      status: "online",
      fps: 25,
      hasFlood: false,
      floodLevelCm: 5,
      vehicleDensity: "เคลื่อนตัวได้เรื่อยๆ",
      coordinates: [13.8645, 100.5412],
      agency: "แขวงทางหลวงชนบทนนทบุรี",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-busy-intersection-42474-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=4",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-pea-chinkhet",
      name: "ถ.งามวงศ์วาน หน้า สนง.ใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA)",
      zone: "ชุมชนชินเขต / PEA",
      province: "กทม.",
      road: "ถนนงามวงศ์วาน (หน้าสำนักงานใหญ่ กฟภ. / ปากซอยชินเขต 1)",
      direction: "มุ่งหน้าแยกพงษ์เพชร / แคราย",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 14,
      vehicleDensity: "ชะลอตัวช่วงหน้า กฟภ. ปากซอยชินเขต 1",
      coordinates: [13.8542, 100.5518],
      agency: "การไฟฟ้าส่วนภูมิภาค (PEA) / สจร. กทม.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-flowing-on-a-highway-42476-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=1",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-chaengwattana-1",
      name: "ถ.แจ้งวัฒนะ หน้าศูนย์ราชการ",
      zone: "แจ้งวัฒนะ",
      province: "กทม.",
      road: "ถ.แจ้งวัฒนะ อาคารราชบุรีดิเรกฤทธิ์",
      direction: "มุ่งหน้าวงเวียนหลักสี่",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 30,
      vehicleDensity: "ปิดการจราจรช่องซ้าย รถติดขัดรุนแรง",
      coordinates: [13.8893, 100.5654],
      agency: "สำนักการจราจรและขนส่ง กทม. / รฟม.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-cars-in-a-traffic-jam-42471-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=5",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-chaengwattana-2",
      name: "วงเวียนหลักสี่ - พหลโยธิน",
      zone: "แจ้งวัฒนะ",
      province: "กทม.",
      road: "ถ.แจ้งวัฒนะ ตัด ถ.พหลโยธินและรามอินทรา",
      direction: "มุ่งหน้าสะพานใหม่ / บางเขน",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 22,
      vehicleDensity: "ติดขัดสะสมท้ายแถวยาว",
      coordinates: [13.8745, 100.5978],
      agency: "สำนักการจราจรและขนส่ง กทม.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-flowing-on-a-highway-42476-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=6",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-kasetsart-1",
      name: "แยกเกษตรศาสตร์ (ถ.งามวงศ์วาน-พหลโยธิน)",
      zone: "ม.เกษตร",
      province: "กทม.",
      road: "ทางแยกเกษตรศาสตร์ (หน้า ม.เกษตรฯ)",
      direction: "มุ่งหน้าถนนประเสริฐมนูกิจ (เกษตร-นวมินทร์)",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 18,
      vehicleDensity: "หนาแน่น เคลื่อนตัวตามสัญญาณไฟ",
      coordinates: [13.8447, 100.5731],
      agency: "สำนักการจราจรและขนส่ง กทม.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cars-traveling-on-a-city-avenue-at-dusk-42477-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=7",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-kasetsart-2",
      name: "ประตู 1 มหาวิทยาลัยเกษตรศาสตร์",
      zone: "ม.เกษตร",
      province: "กทม.",
      road: "ถ.งามวงศ์วาน หน้าสำนักพิพิธภัณฑ์ มก.",
      direction: "มุ่งหน้าวิภาวดีรังสิต",
      status: "online",
      fps: 25,
      hasFlood: true,
      floodLevelCm: 16,
      vehicleDensity: "ติดขัดชะลอตัวบริเวณหน้าประตูทางเข้า",
      coordinates: [13.8478, 100.5684],
      agency: "มหาวิทยาลัยเกษตรศาสตร์ / บก.จร.",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cars-traveling-on-a-highway-surrounded-by-trees-42478-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=8",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-vibhavadi-1",
      name: "วิภาวดีรังสิต - ด่านดอนเมือง",
      zone: "กทม. ตอนเหนือ",
      province: "กทม.",
      road: "ถ.วิภาวดีรังสิต ทางคู่ขนาน",
      direction: "มุ่งหน้ารังสิต ปทุมธานี",
      status: "online",
      fps: 30,
      hasFlood: false,
      floodLevelCm: 8,
      vehicleDensity: "เคลื่อนตัวได้ดีตามรอบสัญญาณ",
      coordinates: [13.9123, 100.6015],
      agency: "กรมทางหลวง / ดอนเมืองโทลล์เวย์",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-traffic-flowing-through-an-interchange-42479-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=9",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-rangsit-future",
      name: "ฟิวเจอร์พาร์ครังสิต (พหลโยธิน)",
      zone: "ปทุมธานี",
      province: "ปทุมธานี",
      road: "ถ.พหลโยธิน ตัด ถ.รังสิต-นครนายก",
      direction: "มุ่งหน้าประตูน้ำพระอินทร์ / วังน้อย",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 28,
      vehicleDensity: "ติดขัดรุนแรง น้ำท่วมคู่ขนาน",
      coordinates: [13.9892, 100.6175],
      agency: "เทศบาลนครรังสิต / กรมทางหลวง",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-busy-avenue-42472-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=10",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-nonthaburi-khaerai",
      name: "สี่แยกแคราย (รัตนาธิเบศร์-ติวานนท์)",
      zone: "อ.เมือง นนทบุรี",
      province: "นนทบุรี",
      road: "ถ.รัตนาธิเบศร์ ตัด ถ.ติวานนท์",
      direction: "มุ่งหน้าสะพานพระนั่งเกล้า",
      status: "online",
      fps: 25,
      hasFlood: true,
      floodLevelCm: 14,
      vehicleDensity: "หนาแน่น เคลื่อนตัวช้า มีน้ำรอระบายเลนซ้าย",
      coordinates: [13.8589, 100.5183],
      agency: "เทศบาลนครนนทบุรี / สภ.รัตนาธิเบศร์",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-42475-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=11",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-nonthaburi-pier",
      name: "ท่าน้ำนนทบุรี (หอนาฬิกา)",
      zone: "อ.เมือง นนทบุรี",
      province: "นนทบุรี",
      road: "ถนนประชาราษฎร์ - ท่าน้ำนนท์",
      direction: "ริมแม่น้ำเจ้าพระยา / ตลาดเทศบาลนนทบุรี",
      status: "online",
      fps: 30,
      hasFlood: true,
      floodLevelCm: 18,
      vehicleDensity: "เฝ้าระวังน้ำทะเลหนุนสูง น้ำเอ่อขอบเขื่อน",
      coordinates: [13.8421, 100.4912],
      agency: "เทศบาลนครนนทบุรี / กรมเจ้าท่า",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-heavy-traffic-on-a-highway-at-night-42473-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=12",
      officialWebUrl: "http://traffic.bangkok.go.th/",
      type: "real_stream"
    },
    {
      id: "cctv-pathumthani-bridge",
      name: "สะพานปทุมธานี 1 (แม่น้ำเจ้าพระยา)",
      zone: "ปทุมธานี",
      province: "ปทุมธานี",
      road: "ทางหลวง 346 ข้ามแม่น้ำเจ้าพระยา",
      direction: "มุ่งหน้าตัวเมืองปทุมธานี",
      status: "online",
      fps: 30,
      hasFlood: false,
      floodLevelCm: 0,
      vehicleDensity: "คล่องตัวดี ไม่มีน้ำท่วมขังบนสะพาน",
      coordinates: [14.0203, 100.5367],
      agency: "แขวงทางหลวงปทุมธานี กรมทางหลวง",
      streamVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-traffic-flowing-on-a-highway-42476-large.mp4",
      realSnapshotUrl: "https://images.weserv.nl/?url=cameras.iticfoundation.org/api/jpeg2.php?camid=13",
      officialWebUrl: "https://highwaytraffic.go.th/",
      type: "real_stream"
    }
  ],

  // ข้อมูลระดับน้ำย้อนหลัง 120 ชั่วโมง (5 วันเต็ม สำหรับ Chart.js)
  historicalTrends: {
    timeRangeLabel: "120 ชั่วโมงที่ผ่านมา",
    timestamps: [
      "22 ก.ย. 16:00", "22 ก.ย. 20:00", 
      "23 ก.ย. 00:00", "23 ก.ย. 04:00", "23 ก.ย. 08:00", "23 ก.ย. 12:00", "23 ก.ย. 16:00", "23 ก.ย. 20:00",
      "24 ก.ย. 00:00", "24 ก.ย. 04:00", "24 ก.ย. 08:00", "24 ก.ย. 12:00", "24 ก.ย. 16:00", "24 ก.ย. 20:00",
      "25 ก.ย. 00:00", "25 ก.ย. 04:00", "25 ก.ย. 08:00", "25 ก.ย. 12:00", "25 ก.ย. 16:00", "25 ก.ย. 20:00",
      "26 ก.ย. 00:00", "26 ก.ย. 04:00", "26 ก.ย. 08:00", "26 ก.ย. 12:00", "26 ก.ย. 16:00", "26 ก.ย. 20:00",
      "27 ก.ย. 00:00", "27 ก.ย. 04:00", "27 ก.ย. 08:00", "27 ก.ย. 12:00", "ปัจจุบัน"
    ],
    series: [
      {
        name: "คลองเปรมประชากร (งามวงศ์วาน/มก.)",
        color: "#facc15",
        levels: [0.52, 0.55, 0.58, 0.60, 0.62, 0.65, 0.68, 0.70, 0.72, 0.75, 0.78, 0.82, 0.88, 0.95, 1.02, 1.08, 1.15, 1.22, 1.30, 1.38, 1.45, 1.48, 1.52, 1.50, 1.48, 1.46, 1.45, 1.46, 1.47, 1.47, 1.48]
      },
      {
        name: "คลองบางเขน (งามวงศ์วาน-พงษ์เพชร)",
        color: "#f97316",
        levels: [0.48, 0.50, 0.52, 0.55, 0.58, 0.62, 0.65, 0.67, 0.69, 0.72, 0.75, 0.80, 0.86, 0.92, 0.98, 1.04, 1.12, 1.18, 1.25, 1.32, 1.38, 1.42, 1.44, 1.43, 1.41, 1.40, 1.39, 1.40, 1.41, 1.41, 1.42]
      },
      {
        name: "คลองบางตลาด (แจ้งวัฒนะ)",
        color: "#e11d48",
        levels: [0.62, 0.65, 0.68, 0.72, 0.75, 0.79, 0.82, 0.85, 0.88, 0.92, 0.98, 1.05, 1.12, 1.20, 1.28, 1.36, 1.45, 1.52, 1.58, 1.62, 1.66, 1.69, 1.68, 1.67, 1.66, 1.65, 1.65, 1.66, 1.67, 1.67, 1.68]
      },
      {
        name: "คลองประปา (ประชาชื่น)",
        color: "#3b82f6",
        levels: [1.00, 1.02, 1.03, 1.05, 1.06, 1.08, 1.10, 1.12, 1.14, 1.15, 1.16, 1.18, 1.20, 1.22, 1.23, 1.24, 1.25, 1.26, 1.27, 1.28, 1.28, 1.29, 1.29, 1.28, 1.28, 1.28, 1.28, 1.28, 1.28, 1.28, 1.28]
      },
      {
        name: "คลองลาดโตนด (งามวงศ์วาน-ชินเขต)",
        color: "#10b981",
        levels: [0.45, 0.48, 0.50, 0.53, 0.56, 0.60, 0.64, 0.68, 0.72, 0.76, 0.82, 0.88, 0.94, 1.01, 1.08, 1.15, 1.21, 1.27, 1.32, 1.36, 1.39, 1.41, 1.43, 1.42, 1.40, 1.38, 1.37, 1.37, 1.38, 1.38, 1.38]
      },
      {
        name: "คลองลาดยาว (วิภาวดี-จตุจักร)",
        color: "#a855f7",
        levels: [0.40, 0.42, 0.45, 0.48, 0.52, 0.56, 0.60, 0.65, 0.70, 0.74, 0.80, 0.86, 0.92, 0.98, 1.04, 1.09, 1.14, 1.19, 1.23, 1.26, 1.28, 1.30, 1.31, 1.29, 1.28, 1.27, 1.25, 1.25, 1.26, 1.26, 1.26]
      }
    ]
  },

  // ========================================================================
  // ข้อมูลการคาดการณ์และเตือนภัยน้ำท่วมจาก Google Flood Hub (AI Flood Forecasting)
  // พยากรณ์ล่วงหน้า 7 วัน (7-Day Ahead AI Forecast) ครอบคลุม กทม. นนทบุรี ปทุมธานี
  // ========================================================================
  googleFloodHub: {
    platformName: "Google Flood Hub",
    tagline: "ระบบพยากรณ์และเตือนภัยน้ำท่วมล่วงหน้า 7 วัน ด้วยเทคโนโลยี AI",
    officialUrl: "https://sites.research.google/floods/",
    lastAiModelRun: "27 ก.ย. 2569, 06:00 น.",
    overallRiskLevel: "warning", // normal, warning, danger, extreme
    overallRiskTitle: "เตือนภัยระดับเฝ้าระวังสูง (ลุ่มน้ำเจ้าพระยาตอนล่าง)",
    overallSummary: "แบบจำลองปัญญาประดิษฐ์ (AI Hydrological Model) ของ Google Flood Hub คาดการณ์ว่ามวลน้ำเหนือจากเขื่อนเจ้าพระยาสมทบกับสภาวะน้ำทะเลหนุนสูง จะส่งผลให้ระดับน้ำในแม่น้ำเจ้าพระยาและโครงข่ายคลองระบายน้ำหลัก มีแนวโน้มเพิ่มขึ้นต่อเนื่องใน 48-72 ชั่วโมงข้างหน้า แนะนำพื้นที่ลุ่มต่ำริมน้ำเตรียมรับมือ",
    leadTimeDays: 7,
    keyMetrics: {
      highRiskStations: 2,
      warningStations: 3,
      chaoPhrayaDischarge: "2,150 ลบ.ม./วินาที",
      dischargeTrend: "เพิ่มขึ้น +14%",
      maxWaterAnomaly: "+0.38 ม. จากเกณฑ์ปกติ"
    },
    stations: [
      {
        id: "gfh-nonthaburi",
        name: "ลุ่มน้ำเจ้าพระยา - สถานี อ.เมือง นนทบุรี / ท่าน้ำนนท์",
        basin: "แม่น้ำเจ้าพระยาตอนล่าง",
        province: "นนทบุรี",
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 82,
        peakForecastDate: "29 ก.ย. 2569 (ช่วง 17:00 - 20:00 น.)",
        expectedWaterLevel: "1.75 - 1.85 ม.รทก. (แตะแนวสันเขื่อน)",
        trend7Days: "เพิ่มขึ้นต่อเนื่อง (+18% ใน 48 ชม.)",
        discharge: "2,150 ลบ.ม./วินาที",
        advisory: "ชุมชนนอกแนวคันกั้นน้ำริมฝั่งเจ้าพระยา และ ถ.พิบูลสงคราม / ประชาราษฎร์ เสี่ยงน้ำเอ่อล้นตลิ่งช่วงน้ำหนุนสูงสุด ควรยกของขึ้นที่สูง",
        officialUrl: "https://sites.research.google/floods/"
      },
      {
        id: "gfh-ngamwongwan",
        name: "โครงข่ายคลองเปรมประชากร / บางเขน (งามวงศ์วาน - ม.เกษตรศาสตร์)",
        basin: "คลองระบายน้ำหลัก กทม. ตอนบน",
        province: "กรุงเทพมหานคร / นนทบุรี",
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 88,
        peakForecastDate: "28 - 29 ก.ย. 2569",
        expectedWaterLevel: "1.48 - 1.55 ม.รทก. (เกินความจุคลอง)",
        trend7Days: "เสี่ยงสูงเนื่องจากฝนสะสม + น้ำระบายหนาแน่น",
        discharge: "ระดับน้ำ 96% ของความจุคลอง",
        advisory: "ระดับน้ำในคลองบางเขนและคลองเปรมฯ สูงเกือบเสมอระดับตลิ่ง แยกพงษ์เพชรและหน้า ม.เกษตรฯ เสี่ยงน้ำท่วมผิวจราจรขยายวงกว้าง",
        officialUrl: "https://sites.research.google/floods/"
      },
      {
        id: "gfh-chaengwattana",
        name: "คลองบางตลาด - แจ้งวัฒนะ / ปากเกร็ด",
        basin: "คลองสายหลักฝั่งตะวันออกเจ้าพระยา",
        province: "นนทบุรี",
        riskLevel: "danger",
        riskLabel: "อันตราย (Danger)",
        probability: 85,
        peakForecastDate: "29 ก.ย. 2569",
        expectedWaterLevel: "1.65 - 1.70 ม.รทก.",
        trend7Days: "ระบายน้ำออกแม่น้ำเจ้าพระยาชะลอตัวช่วงน้ำทะเลหนุน",
        discharge: "ระดับน้ำ 98% ของความจุคลอง",
        advisory: "การระบายน้ำสู่สถานีสูบน้ำบางตลาดชะลอตัว ถนนแจ้งวัฒนะช่วงหน้าศูนย์ราชการและเมืองทองธานี เฝ้าระวังน้ำขังสะสม",
        officialUrl: "https://sites.research.google/floods/"
      },
      {
        id: "gfh-pathumthani",
        name: "ลุ่มน้ำเจ้าพระยา - คลองรังสิตประยูรศักดิ์ (ปทุมธานี)",
        basin: "คลองส่งและระบายน้ำสายหลักทุ่งรังสิต",
        province: "ปทุมธานี",
        riskLevel: "warning",
        riskLabel: "เตือนภัย (Warning)",
        probability: 70,
        peakForecastDate: "30 ก.ย. 2569",
        expectedWaterLevel: "1.80 - 1.88 ม.รทก.",
        trend7Days: "ทรงตัวในระดับสูง รองรับน้ำระบายจากทุ่งตอนบน",
        discharge: "1,880 ลบ.ม./วินาที",
        advisory: "ประตูระบายน้ำจุฬาลงกรณ์เดินเครื่องสูบน้ำต่อเนื่อง พื้นที่ลุ่มต่ำริมคลอง 1 ถึงคลอง 3 และแนว ถ.รังสิต-ปทุมธานี ควรติดตามระดับน้ำใกล้ชิด",
        officialUrl: "https://sites.research.google/floods/"
      },
      {
        id: "gfh-prachachuen",
        name: "แนวคลองประปา - ประชาชื่น / บางซื่อ",
        basin: "ระบบคลองส่งน้ำดิบและคูระบายน้ำขนาน",
        province: "กรุงเทพมหานคร / นนทบุรี",
        riskLevel: "warning",
        riskLabel: "เตือนภัย (Warning)",
        probability: 65,
        peakForecastDate: "29 - 30 ก.ย. 2569",
        expectedWaterLevel: "1.30 ม.รทก. (ควบคุมได้)",
        trend7Days: "ทรงตัว มีน้ำรอระบายตามท่อระบายน้ำขนาน",
        discharge: "ระดับน้ำ 80% ของความจุคลอง",
        advisory: "ระดับน้ำคลองประปาอยู่ในเกณฑ์ควบคุม แต่จุดตัดทางระบายน้ำลงสู่คลองบางซื่อมีน้ำสะสม ช่วงแยกประชานุกูลควรชะลอความเร็ว",
        officialUrl: "https://sites.research.google/floods/"
      }
    ],
    aiMethodology: {
      modelType: "AI Hydrological Simulation & Inundation Mapping (Google Research)",
      inputs: "ดาวเทียมสภาพอากาศ ECMWF, ภาพถ่ายเรดาร์ตรวจวัดน้ำฝน Sentinel, และข้อมูลสถานีวัดน้ำจริง",
      advantages: "คาดการณ์ล่วงหน้า 7 วัน (7-Day Lead Time) ช่วยให้ประชาชนและหน่วยงานเตรียมความพร้อมได้ทันท่วงทีก่อนเกิดเหตุน้ำท่วมจริง"
    }
  },

  // ========================================================================
  // รายงานสถานการณ์ที่แชร์ล่าสุดภายใน 3 ชม. บริเวณโดยรอบ การไฟฟ้าส่วนภูมิภาค (PEA) & ชุมชนชินเขต
  // ========================================================================
  peaRecentPhotos: [
    {
      id: "photo-pea-1",
      title: "หน้าสำนักงานใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA) ประตู 1",
      location: "ถ.งามวงศ์วาน หน้า สนง.ใหญ่ กฟภ. ประตู 1 (ฝั่งขาออก)",
      timeAgo: "8 นาทีที่แล้ว",
      minutesAgo: 8,
      sharedTime: "11:14 น.",
      reporter: "เจ้าหน้าที่ กฟภ. ศูนย์ความปลอดภัย",
      reporterRole: "เจ้าหน้าที่องค์กร",
      waterDepthCm: 11,
      severity: "moderate",
      severityLabel: "น้ำท่วมเลนซ้าย",
      passable: "รถทุกชนิดผ่านได้ ชะลอความเร็ว",
      description: "ช่องทางคู่ขนานหน้าสำนักงานใหญ่ กฟภ. ประตู 1 มีน้ำขังผิวจราจรเลนซ้ายประมาณ 10-12 ซม. ช่องทางด่วนและเลนขวาสัญจรได้คล่องตัว เดินเครื่องสูบน้ำช่วยระบายต่อเนื่อง",
      imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
      source: "ศูนย์ประสานงานฉุกเฉิน กฟภ. สำนักงานใหญ่"
    },
    {
      id: "photo-pea-2",
      title: "ประตู 2 กฟภ. สนง.ใหญ่ (ฝั่งถนนเลียบคลองเปรมประชากร/บางเขน)",
      location: "ทางเข้าด้านหลัง กฟภ. เชื่อมต่อสถานีรถไฟฟ้าสายสีแดงบางเขน",
      timeAgo: "16 นาทีที่แล้ว",
      minutesAgo: 16,
      sharedTime: "11:06 น.",
      reporter: "รปภ. ประจำจุดตรวจประตู 2 กฟภ.",
      reporterRole: "เจ้าหน้าที่รักษาความปลอดภัย",
      waterDepthCm: 7,
      severity: "minor",
      severityLabel: "น้ำปริ่มขอบทาง",
      passable: "รถทุกชนิดผ่านได้ตามปกติ",
      description: "ทางเข้าออกประตู 2 ระดับน้ำผิวทางแห้งเกือบหมด มีน้ำขังเล็กน้อยบริเวณขอบทางลาดเท 5-7 ซม. พนักงานและประชาชนสัญจรเข้าออกได้สะดวก",
      imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80",
      source: "กองรักษาความปลอดภัย กฟภ. สนง.ใหญ่"
    },
    {
      id: "photo-pea-3",
      title: "ปากซอยชินเขต 1 (งามวงศ์วาน 43)",
      location: "ปากซอยงามวงศ์วาน 43 เชื่อมถนนใหญ่",
      timeAgo: "25 นาทีที่แล้ว",
      minutesAgo: 25,
      sharedTime: "10:57 น.",
      reporter: "ประชาชนในพื้นที่ (คุณสมชาย)",
      reporterRole: "รายงานจากประชาชน",
      waterDepthCm: 14,
      severity: "moderate",
      severityLabel: "น้ำท่วมผิวทาง",
      passable: "รถเก๋งผ่านได้ช้า มอเตอร์ไซค์ชิดขวา",
      description: "ปากซอยชินเขต 1 มีน้ำท่วมขังเสมอทางเท้าประมาณ 14 ซม. รถเลี้ยวเข้าซอยต้องชะลอความเร็ว มีคลื่นน้ำเล็กน้อยเวลาเปิดทาง เจ้าหน้าที่คอยช่วยโบกรถ",
      imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80",
      source: "กลุ่มไลน์เตือนภัยชุมชนชินเขต-งามวงศ์วาน"
    },
    {
      id: "photo-pea-4",
      title: "ปากซอยชินเขต 2 (งามวงศ์วาน 47)",
      location: "ปากซอยงามวงศ์วาน 47 เชื่อมถนนงามวงศ์วานสายหลัก",
      timeAgo: "38 นาทีที่แล้ว",
      minutesAgo: 38,
      sharedTime: "10:44 น.",
      reporter: "วินจักรยานยนต์รับจ้างปากซอย 47",
      reporterRole: "ผู้ให้บริการขนส่งสาธารณะ",
      waterDepthCm: 13,
      severity: "moderate",
      severityLabel: "น้ำท่วมขังรอระบาย",
      passable: "รถผ่านได้ ควรชะลอความเร็ว",
      description: "ช่วงปากซอยงามวงศ์วาน 47 มีน้ำท่วมขังผิวถนนระยะทางประมาณ 60 เมตร ระดับน้ำ 12-14 ซม. รถเล็กยังผ่านได้ต่อเนื่อง",
      imageUrl: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80",
      source: "ศูนย์ประสานงานจราจรชุมชนชินเขต"
    },
    {
      id: "photo-pea-5",
      title: "ซอยชินเขต 2 (งามวงศ์วาน 47) หน้าตลาดชินเขต",
      location: "ซอยงามวงศ์วาน 47 หน้าตลาดและร้านค้าชุมชน",
      timeAgo: "52 นาทีที่แล้ว",
      minutesAgo: 52,
      sharedTime: "10:30 น.",
      reporter: "พ่อค้าแม่ค้าตลาดชินเขต",
      reporterRole: "ผู้ประกอบการชุมชน",
      waterDepthCm: 17,
      severity: "critical",
      severityLabel: "น้ำเอ่อท่วมขัง",
      passable: "รถเล็กหลีกเลี่ยง รถกระบะผ่านได้",
      description: "บริเวณหน้าตลาดชินเขต 2 น้ำท่วมขังทั้ง 2 เลน สูงประมาณครึ่งล้อรถเก๋ง (17 ซม.) ผู้ค้าจัดแนวกระสอบทรายกั้นหน้าร้านแล้ว มีเครื่องสูบน้ำช่วยดูดระบาย",
      imageUrl: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80",
      source: "เพจข่าวสารชุมชนชินเขต"
    },
    {
      id: "photo-pea-6",
      title: "ซอยงามวงศ์วาน 47 แยก 6-8 (พื้นที่แอ่งกระทะชินเขต)",
      location: "จุดต่ำสุดในซอยชินเขต 2 เชื่อมต่อแนวคลองบางเขน",
      timeAgo: "1 ชม. 5 นาทีที่แล้ว",
      minutesAgo: 65,
      sharedTime: "10:17 น.",
      reporter: "กรรมการชุมชนร่วมใจชินเขต",
      reporterRole: "ตัวแทนชุมชน",
      waterDepthCm: 22,
      severity: "critical",
      severityLabel: "น้ำท่วมสูงในซอยย่อย",
      passable: "รถเก๋งและมอเตอร์ไซค์ห้ามผ่าน",
      description: "บริเวณแยก 6 ถึง 8 เป็นจุดแอ่งกระทะ ระดับน้ำสูง 20-22 ซม. รถเก๋งไม่ควรเข้าเด็ดขาด กทม.และฝ่ายระบายน้ำนำเครื่องสูบน้ำเคลื่อนที่มาติดตั้งเร่งระบายน้ำ",
      imageUrl: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&auto=format&fit=crop&q=80",
      source: "ศูนย์ประสานงานชุมชนชินเขต"
    },
    {
      id: "photo-pea-7",
      title: "สะพานข้ามคลองเปรมประชากร (ข้าง สนง.ใหญ่ กฟภ.)",
      location: "จุดเชื่อมต่อ ถ.งามวงศ์วาน ข้ามคลองเปรมประชากร",
      timeAgo: "1 ชม. 20 นาทีที่แล้ว",
      minutesAgo: 80,
      sharedTime: "10:02 น.",
      reporter: "อาสากู้ภัยป่อเต็กตึ๊ง จุดพงษ์เพชร",
      reporterRole: "อาสาสมัครกู้ภัย",
      waterDepthCm: 8,
      severity: "minor",
      severityLabel: "น้ำปริ่มขอบทาง",
      passable: "ผ่านได้ทุกช่องทาง",
      description: "คลองเปรมประชากรข้าง สนง.ใหญ่ กฟภ. น้ำขึ้นสูงเกือบเสมอขอบเขื่อนระบายน้ำ มีน้ำเอ่อล้นเข้าขอบผิวจราจรเชิงสะพานเล็กน้อย แต่การจราจรบนสะพานวิ่งได้ปกติ",
      imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=80",
      source: "ศูนย์วิทยุอาสาสมัครกู้ภัย"
    },
    {
      id: "photo-pea-8",
      title: "จุดกลับรถใต้สะพานงามวงศ์วาน (ข้ามคลองเปรมประชากร หน้า สนง.ใหญ่ กฟภ.)",
      location: "จุดกลับรถใต้สะพานงามวงศ์วาน ข้ามคลองเปรมประชากร (หน้า สนง.ใหญ่ กฟภ.)",
      timeAgo: "1 ชม. 35 นาทีที่แล้ว",
      minutesAgo: 95,
      sharedTime: "09:47 น.",
      reporter: "ผู้ใช้เส้นทาง (Twitter/X)",
      reporterRole: "ผู้ใช้เส้นทาง",
      waterDepthCm: 21,
      severity: "critical",
      severityLabel: "น้ำท่วมสูงปิดช่องกลับรถ",
      passable: "รถเล็กห้ามผ่านเด็ดขาด",
      description: "จุดกลับรถใต้สะพานข้ามคลองเปรมประชากร หน้า สนง.ใหญ่ กฟภ. ระดับน้ำท่วมขัง 20-22 ซม. มีรถจอดเสีย 1 คัน เจ้าหน้าที่ตำรวจจราจรนำกรวยมาปิดกั้นช่องทางกลับรถชั่วคราว แนะนำให้ไปกลับรถที่แยกพงษ์เพชรแทน",
      imageUrl: "https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80",
      source: "รายงานสภาพจราจร จส.100"
    },
    {
      id: "photo-pea-9",
      title: "ซอยงามวงศ์วาน 43 แยก 2-8 ชุมชนร่วมใจพัฒนา (หลัง กฟภ.)",
      location: "ชุมชนริมคลองเปรมประชากร ด้านหลังรั้ว สนง.ใหญ่ กฟภ.",
      timeAgo: "1 ชม. 50 นาทีที่แล้ว",
      minutesAgo: 110,
      sharedTime: "09:32 น.",
      reporter: "ประธานชุมชนร่วมใจพัฒนา",
      reporterRole: "ผู้นำชุมชน",
      waterDepthCm: 14,
      severity: "moderate",
      severityLabel: "น้ำขังเสมอทางเดินเท้า",
      passable: "รถเล็กระมัดระวังคลื่นน้ำ",
      description: "ทางเดินคอนกรีตเลียบคลองหลัง กฟภ. น้ำทรงตัวเสมอขอบเขื่อนชุมชน ปั๊มน้ำไดโว่ชุมชนเปิดทำงานระบายน้ำลงสู่คลองเปรมฯ อย่างต่อเนื่อง",
      imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
      source: "เครือข่ายชุมชนริมคลองเปรมประชากร"
    },
    {
      id: "photo-pea-10",
      title: "ระบบไฟฟ้าและสถานีย่อยภายใน สนง.ใหญ่ กฟภ. (งามวงศ์วาน)",
      location: "ศูนย์ควบคุมและระบบไฟฟ้าภายใน สนง.ใหญ่ กฟภ. ถ.งามวงศ์วาน",
      timeAgo: "2 ชม. 5 นาทีที่แล้ว",
      minutesAgo: 125,
      sharedTime: "09:17 น.",
      reporter: "ทีมวิศวกร กฟภ. ส่วนระบบไฟฟ้า",
      reporterRole: "วิศวกรผู้เชี่ยวชาญ กฟภ.",
      waterDepthCm: 6,
      severity: "minor",
      severityLabel: "คันกั้นน้ำปกติ",
      passable: "สัญจรได้คล่องตัว",
      description: "ตรวจสอบแนวเขื่อนป้องกันและระบบสถานีไฟฟ้าสำรองภายใน สนง.ใหญ่ กฟภ. ระดับน้ำภายนอกไม่ส่งผลกระทบต่ออุปกรณ์ไฟฟ้า เครื่องสูบน้ำอัตโนมัติพร้อมทำงาน 100%",
      imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80",
      source: "ฝ่ายปฏิบัติการและบำรุงรักษา กฟภ."
    },
    {
      id: "photo-pea-11",
      title: "ถนนเลียบคลองเปรมประชากร หน้าสถานีรถไฟบางเขน (ตรงข้าม กฟภ.)",
      location: "ถนนเลียบทางรถไฟ เชื่อมระหว่างงามวงศ์วานและหลักสี่",
      timeAgo: "2 ชม. 20 นาทีที่แล้ว",
      minutesAgo: 140,
      sharedTime: "09:02 น.",
      reporter: "เจ้าหน้าที่รักษาความปลอดภัย รถไฟฟ้าสายสีแดง",
      reporterRole: "เจ้าหน้าที่ระบบราง",
      waterDepthCm: 11,
      severity: "minor",
      severityLabel: "น้ำท่วมขอบทาง",
      passable: "รถทุกชนิดผ่านได้",
      description: "ถนนเลียบทางรถไฟและคลองเปรมประชากรหน้าสถานีบางเขน มีน้ำขังเลนติดคลองประมาณ 10 ซม. ช่องทางหลักสัญจรได้ รถเข้าสู่สถานีรถไฟฟ้าสายสีแดงได้ตามปกติ",
      imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=80",
      source: "ศูนย์ควบคุมสถานีรถไฟบางเขน"
    },
    {
      id: "photo-pea-12",
      title: "ซอยชินเขต 1 แยก 3 (ชุมชนสุขาภิบาล 1)",
      location: "ซอยย่อยเชื่อมโยงภายในชุมชนชินเขต 1",
      timeAgo: "2 ชม. 32 นาทีที่แล้ว",
      minutesAgo: 152,
      sharedTime: "08:50 น.",
      reporter: "สมาชิก อสม. ชุมชนชินเขต",
      reporterRole: "อาสาสมัครสาธารณสุข",
      waterDepthCm: 10,
      severity: "minor",
      severityLabel: "น้ำรอการระบาย",
      passable: "สัญจรได้ปกติ",
      description: "ระดับน้ำในซอยย่อยสุขาภิบาล 1 ลดลงต่อเนื่องหลังฝนเริ่มซา เหลือขังตามแอ่งถนนประมาณ 8-10 ซม. ประชาชนเดินสัญจรได้สะดวกขึ้น",
      imageUrl: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80",
      source: "ชมรมอาสาสมัครสาธารณสุขชุมชนชินเขต"
    },
    {
      id: "photo-pea-13",
      title: "หน้าเรือนจำกลางคลองเปรม / ถ.งามวงศ์วาน (เยื้อง กฟภ. สนง.ใหญ่)",
      location: "ถ.งามวงศ์วาน ขาเข้ามุ่งหน้าวิภาวดีรังสิต",
      timeAgo: "2 ชม. 43 นาทีที่แล้ว",
      minutesAgo: 163,
      sharedTime: "08:39 น.",
      reporter: "ผู้ใช้เส้นทาง ถ.งามวงศ์วาน",
      reporterRole: "ผู้ใช้เส้นทาง",
      waterDepthCm: 7,
      severity: "minor",
      severityLabel: "น้ำแห้งเกือบปกติ",
      passable: "ผ่านได้ทุกช่องทาง",
      description: "ถนนงามวงศ์วานฝั่งขาเข้าเยื้อง สนง.ใหญ่ กฟภ. ผิวจราจรแห้งเป็นส่วนใหญ่ เลนซ้ายสุดมีน้ำขังบางจุดไม่เกิน 7 ซม. การจราจรเคลื่อนตัวตามสัญญาณไฟปกติ",
      imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
      source: "กลุ่มจราจรชุมชนคนงามวงศ์วาน"
    },
    {
      id: "photo-pea-14",
      title: "ประตูระบายน้ำคลองบางเขน (จุดตัดซอยงามวงศ์วาน 49 / รั้วทิศเหนือ กฟภ.)",
      location: "จุดเชื่อมต่อคลองบางเขนและคลองเปรมประชากร ทิศเหนือ กฟภ.",
      timeAgo: "2 ชม. 52 นาทีที่แล้ว",
      minutesAgo: 172,
      sharedTime: "08:30 น.",
      reporter: "เจ้าหน้าที่สำนักการระบายน้ำ กทม.",
      reporterRole: "เจ้าหน้าที่ควบคุมประตูระบายน้ำ",
      waterDepthCm: 9,
      severity: "minor",
      severityLabel: "เดินเครื่องสูบเต็มพิกัด",
      passable: "ทางเลียบคลองสัญจรได้",
      description: "สถานีสูบน้ำคลองบางเขน-เปรมประชากร เดินเครื่องสูบน้ำ 3 เครื่องเต็มกำลังเพื่อเร่งดึงน้ำออกจากโซนชินเขตและพื้นที่โดยรอบ กฟภ. ออกสู่แม่น้ำเจ้าพระยา",
      imageUrl: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&auto=format&fit=crop&q=80",
      source: "สำนักการระบายน้ำ กรุงเทพมหานคร"
    }
  ],

  // ========================================================================
  // ========================================================================
  // ข้อมูลคาดการณ์มวลน้ำเหนือ (Chao Phraya Upstream Runoff)
  // ========================================================================
  upstreamWaterSurge: {
    source: "กรมชลประทาน & สถาบันสารสนเทศทรัพยากรน้ำ (สสน.)",
    lastReported: "27 ก.ย. 2569, 15:00 น.",
    hourlySyncSchedule: "อัปเดตทุก 1 ชั่วโมง (รอบล่าสุด 15:00 น. | รอบถัดไป 16:00 น.)",
    overallStatus: "warning",
    overallStatusText: "เฝ้าระวังมวลน้ำหลากเพิ่มขึ้นต่อเนื่อง",
    summaryText: "มวลน้ำเหนือจาก จ.นครสวรรค์ ไหลรวมผ่านเขื่อนเจ้าพระยา โดยเขื่อนเจ้าพระยามีการปรับเพิ่มอัตราการระบายน้ำท้ายเขื่อน มวลน้ำก้อนหลักจะเดินทางถึงจุดวัดบางไทร จ.พระนครศรีอยุธยา ใน 12-16 ชม. และเข้าสู่ปริมณฑล-กทม. สมทบกับช่วงน้ำทะเลหนุนสูง",
    overview: {
      title: "สถานการณ์มวลน้ำเหนือ (แม่น้ำเจ้าพระยา)",
      status: "warning",
      statusText: "เฝ้าระวังมวลน้ำหลากเพิ่มขึ้นต่อเนื่อง",
      totalDischargeC13: 2150,
      safeCapacityThreshold: 2500,
      maxCapacityC13: 2800,
      keyNote: "มวลน้ำเหนือจาก จ.นครสวรรค์ ไหลรวมผ่านเขื่อนเจ้าพระยา โดยเขื่อนเจ้าพระยามีการปรับเพิ่มอัตราการระบายน้ำท้ายเขื่อน มวลน้ำก้อนหลักจะเดินทางถึงจุดวัดบางไทร จ.พระนครศรีอยุธยา ใน 12-16 ชม. และเข้าสู่ปริมณฑล-กทม. สมทบกับช่วงน้ำทะเลหนุนสูง",
      lastUpdated: "27 ก.ย. 2569, 15:00 น."
    },
    checkpoints: [
      {
        id: "c2-nakhonsawan",
        stationCode: "C.2",
        name: "สถานี C.2 นครสวรรค์",
        river: "แม่น้ำเจ้าพระยา (ปากน้ำโพ)",
        location: "อ.เมือง จ.นครสวรรค์ (จุดรวมแม่น้ำปิง-วัง-ยม-น่าน)",
        flowRateM3s: 2340,
        dischargeRate: 2340,
        warningThreshold: 2840,
        criticalFlowThreshold: 2840,
        capacityMax: 3590,
        trend: "up",
        trendText: "เพิ่มขึ้น +85 ลบ.ม./วิ",
        status: "warning",
        statusLabel: "เฝ้าระวังสูง",
        waterLevelM: 23.45,
        waterLevelMsl: 23.45,
        bankLevelM: 26.20,
        bankHeightMsl: 26.20,
        timeToBkkText: "มวลน้ำใช้เวลาเดินทางถึง กทม. ประมาณ 48-60 ชม.",
        description: "มวลน้ำจากภาคเหนือตอนบนไหลมารวมกันที่ปากน้ำโพ อัตราการไหลทรงตัวสูงและมีแนวโน้มเพิ่มขึ้นจากฝนตกสะสม"
      },
      {
        id: "c13-chainat",
        stationCode: "C.13",
        name: "เขื่อนเจ้าพระยา (สถานี C.13)",
        river: "แม่น้ำเจ้าพระยา (ชัยนาท)",
        location: "อ.สรรพยา จ.ชัยนาท (จุดควบคุมการระบายน้ำลงสู่ภาคกลาง)",
        flowRateM3s: 2150,
        dischargeRate: 2150,
        warningThreshold: 2000,
        criticalFlowThreshold: 2500,
        capacityMax: 2800,
        trend: "up",
        trendText: "ปรับเพิ่มการระบาย +120 ลบ.ม./วิ",
        status: "critical",
        statusLabel: "ระบายน้ำระดับสูง",
        waterLevelM: 16.85,
        waterLevelMsl: 16.85,
        bankLevelM: 17.50,
        bankHeightMsl: 17.50,
        timeToBkkText: "มวลน้ำใช้เวลาเดินทางถึง กทม. ประมาณ 24-36 ชม.",
        description: "เขื่อนเจ้าพระยาทยอยปรับเพิ่มการระบายน้ำท้ายเขื่อนแบบขั้นบันได ส่งผลกระทบต่อพื้นที่ลุ่มต่ำนอกคันกั้นน้ำ อ่างทอง พระนครศรีอยุธยา"
      },
      {
        id: "c29a-bangsai",
        stationCode: "C.29A",
        name: "สถานี C.29A บางไทร",
        river: "แม่น้ำเจ้าพระยา (อยุธยา)",
        location: "อ.บางไทร จ.พระนครศรีอยุธยา (ด่านหน้าสุดท้ายก่อนเข้าสู่ กทม.-นนทบุรี)",
        flowRateM3s: 2280,
        dischargeRate: 2280,
        warningThreshold: 2500,
        criticalFlowThreshold: 2800,
        capacityMax: 3500,
        trend: "up",
        trendText: "อัตราไหลเฉลี่ย 1.35 ม./วินาที",
        status: "warning",
        statusLabel: "จับตาพิเศษ",
        waterLevelM: 2.45,
        waterLevelMsl: 2.45,
        bankLevelM: 3.40,
        bankHeightMsl: 3.40,
        timeToBkkText: "มวลน้ำใช้เวลาเดินทางถึง กทม. ประมาณ 12-18 ชม.",
        description: "จุดคัดกรองมวลน้ำลงสู่ กทม. และนนทบุรี อัตราการไหลเริ่มแตะเกณฑ์เฝ้าระวัง หากเกิน 2,500 ลบ.ม./วิ จะกระทบแนวริมน้ำเจ้าพระยาชัดเจน"
      }
    ]
  },

  // ========================================================================
  // ข้อมูลคาดการณ์สภาวะน้ำทะเลหนุนสูง (High Sea Tide Forecast)
  // ========================================================================
  seaTideForecast: {
    source: "กรมอุทกศาสตร์ กองทัพเรือ",
    station: "ปากแม่น้ำเจ้าพระยา - ป้อมพระจุลจอมเกล้า & ท่าน้ำกรุงเทพ",
    tideDate: "27 - 28 ก.ย. 2569",
    hourlySyncSchedule: "อัปเดตทุก 1 ชั่วโมง (รอบล่าสุด 15:00 น. | รอบถัดไป 16:00 น.)",
    todayPeakStatus: "danger",
    todayPeakStatusText: "น้ำหนุนสูงช่วงค่ำ เสี่ยงน้ำล้นตลิ่ง",
    convergenceWindow: {
      timeRange: "18:30 - 21:15 น.",
      riskLevel: "critical",
      title: "ช่วงเวลาน้ำทะเลหนุนสูงสุด ปะทะมวลน้ำเหนือไหลหลาก (Convergence Peak)",
      warningText: "มวลน้ำเหนือ 2,280 ลบ.ม./วิ ปะทะกับน้ำทะเลหนุนสูงสุด +1.84 ม.รทก. ทำให้การระบายน้ำลงสู่อ่าวไทยชะลอตัว น้ำอาจดันย้อนเข้าสู่คลองบางเขน คลองเปรมประชากร และคลองบางตลาด"
    },
    tidePeriods: [
      {
        id: "tide-morning",
        title: "น้ำทะเลหนุน รอบเช้า",
        timeRange: "07:30 - 09:45 น.",
        peakTime: "08:35 น.",
        expectedLevel: 1.68,
        riskLevel: "warning",
        riskLabel: "เฝ้าระวังปานกลาง",
        description: "น้ำหนุนรอบเช้าส่งผลให้ระดับน้ำในแม่น้ำเจ้าพระยาปริ่มแนวเขื่อนกั้นน้ำบางจุด"
      },
      {
        id: "tide-evening",
        title: "น้ำทะเลหนุน รอบค่ำ (สูงสุดของวัน)",
        timeRange: "18:20 - 21:30 น.",
        peakTime: "19:48 น.",
        expectedLevel: 1.84,
        riskLevel: "critical",
        riskLabel: "วิกฤตหนุนสูงสุด",
        description: "ระดับน้ำทะเลหนุนสูงสุดของวัน แตะระดับแนวป้องกันน้ำท่วม พื้นที่นอกคันกั้นน้ำเสร็จสิ้นและริมคลองสาขาเสี่ยงน้ำเอ่อท่วม"
      },
      {
        id: "tide-tomorrow-morning",
        title: "คาดการณ์พรุ่งนี้ รอบเช้า (28 ก.ย.)",
        timeRange: "08:15 - 10:20 น.",
        peakTime: "09:12 น.",
        expectedLevel: 1.74,
        riskLevel: "warning",
        riskLabel: "เฝ้าระวังสูง",
        description: "แนวโน้มยังทรงตัวสูงตามอิทธิพลน้ำทะเลหนุนปลายเดือน"
      }
    ],
    tideWindows: [
      {
        id: "tide-morning",
        title: "น้ำทะเลหนุน รอบเช้า",
        timeRange: "07:30 - 09:45 น.",
        peakTime: "08:35 น.",
        expectedLevel: 1.68,
        riskLevel: "warning",
        riskLabel: "เฝ้าระวังปานกลาง",
        description: "น้ำหนุนรอบเช้าส่งผลให้ระดับน้ำในแม่น้ำเจ้าพระยาปริ่มแนวเขื่อนกั้นน้ำบางจุด"
      },
      {
        id: "tide-evening",
        title: "น้ำทะเลหนุน รอบค่ำ (สูงสุดของวัน)",
        timeRange: "18:20 - 21:30 น.",
        peakTime: "19:48 น.",
        expectedLevel: 1.84,
        riskLevel: "critical",
        riskLabel: "วิกฤตหนุนสูงสุด",
        description: "ระดับน้ำทะเลหนุนสูงสุดของวัน แตะระดับแนวป้องกันน้ำท่วม พื้นที่นอกคันกั้นน้ำเสร็จสิ้นและริมคลองสาขาเสี่ยงน้ำเอ่อท่วม"
      },
      {
        id: "tide-tomorrow-morning",
        title: "คาดการณ์พรุ่งนี้ รอบเช้า (28 ก.ย.)",
        timeRange: "08:15 - 10:20 น.",
        peakTime: "09:12 น.",
        expectedLevel: 1.74,
        riskLevel: "warning",
        riskLabel: "เฝ้าระวังสูง",
        description: "แนวโน้มยังทรงตัวสูงตามอิทธิพลน้ำทะเลหนุนปลายเดือน"
      }
    ],
    impactZones: [
      "ริมฝั่งแม่น้ำเจ้าพระยา จ.นนทบุรี (ท่าน้ำนนท์, บางศรีเมือง, ถ.พิบูลสงคราม)",
      "พื้นที่นอกแนวคันกั้นน้ำ กทม. (ทรงวาด, เจริญกรุง, พระราม 3, บางพลัด)",
      "โครงข่ายคลองระบายน้ำฝั่งเหนือ (คลองบางเขน, คลองเปรมประชากร, คลองบางตลาด)"
    ]
  },

  // ========================================================================
  // รายงานข่าวน้ำท่วม กทม. แบบ Live สด & สรุปสถานการณ์ (อัปเดตทุก 1 ชม. ในช่วง 3 ชม. ล่าสุด)
  // ลิงก์ตรงสำหรับดูสด และดูคลิปบันทึกย้อนหลังได้จริง 100%
  // ========================================================================
  liveFloodNews: [
    {
      id: "news-bma-briefing",
      station: "ศูนย์บริหารจัดการน้ำ กทม. (ศภช. / PR Bangkok)",
      programName: "แถลงด่วนศูนย์บริหารจัดการน้ำ กทม.: เกาะติดสถานการณ์น้ำเหนือ & เร่งระบายน้ำคลองสายหลัก",
      speaker: "ผู้ว่าฯ กทม. / ผอ.สำนักการระบายน้ำ",
      category: "official",
      categoryLabel: "แถลงการณ์ทางการ กทม.",
      offsetStartMins: -20, // เริ่มเมื่อ 20 นาทีที่แล้ว
      offsetEndMins: 40,   // กำลังถ่ายทอดสดอยู่ตอนนี้
      isAlwaysLive: false,
      liveUrl: "https://www.facebook.com/prbangkok/live_videos/",
      replayUrl: "https://www.facebook.com/prbangkok/live_videos/",
      officialUrl: "https://www.facebook.com/prbangkok/live_videos/",
      embedType: "facebook-live",
      verifiedWatchNote: "คลิกเข้าสู่หน้าถ่ายทอดสดและคลังวิดีโอย้อนหลังทางการของ กทม. ได้ทันที",
      summaryBullets: [
        "กทม. เตรียมพร้อมสถานีสูบน้ำริมแม่น้ำเจ้าพระยา 96 แห่ง เดินเครื่องเต็มกำลัง 100%",
        "วางแนวกระสอบทรายเสริมจุดฟันหลอ 76 จุด โดยเฉพาะย่านทรงวาด ท่าเตียน และบางกอกน้อย",
        "ระดับน้ำคลองเปรมประชากรและคลองบางเขนยังสูง สั่งเดินเครื่องสูบน้ำเคลื่อนที่ช่วยเร่งระบาย",
        "เฝ้าระวังช่วง 18:30 - 21:00 น. วันนี้น้ำทะเลหนุนสูงสุด คาดระดับน้ำแตะ 1.84 ม.รทก."
      ]
    },
    {
      id: "news-thaipbs-live",
      station: "Thai PBS (ไทยพีบีเอส)",
      programName: "LIVE พิเศษ เกาะติดภัยพิบัติ: บินโดรนสำรวจมวลน้ำเหนือบางไทร จ่อประชิดนนทบุรี-กทม.",
      speaker: "ทีมข่าวภัยพิบัติและสิ่งแวดล้อม Thai PBS",
      category: "news",
      categoryLabel: "ถ่ายทอดสดข่าวโทรทัศน์",
      offsetStartMins: -85, // เริ่มเมื่อ 1 ชม. 25 นาทีที่แล้ว
      offsetEndMins: -35,   // เพิ่งจบไปเมื่อ 35 นาทีที่แล้ว (อยู่ในช่วง 3 ชม. ล่าสุด)
      isAlwaysLive: false,
      liveUrl: "https://www.youtube.com/@ThaiPBS/live",
      replayUrl: "https://www.youtube.com/@ThaiPBS/streams",
      officialUrl: "https://www.youtube.com/@ThaiPBS/streams",
      embedType: "youtube-live",
      verifiedWatchNote: "คลิกดูคลิปบันทึก Live ย้อนหลังเต็มรูปแบบบน YouTube Thai PBS ได้ทันที",
      summaryBullets: [
        "ภาพมุมสูงเขื่อนเจ้าพระยาระบาย 2,150 ลบ.ม./วิ พื้นที่ท้ายเขื่อน จ.อยุธยา น้ำท่วมขังสูงขึ้น",
        "มวลน้ำก้อนใหญ่กำลังเคลื่อนตัวผ่านจุดวัดบางไทร คาดถึงนนทบุรี-กทม. ในช่วงดึกคืนนี้",
        "สัมภาษณ์สดชาวบ้านชุมชนชินเขต และริมคลองเปรมประชากร เรื่องการรับมือระดับน้ำขัง",
        "ข้อแนะนำการจอดรถบนสะพานและอาคารสูงสำหรับผู้พักอาศัยพื้นที่เสี่ยงริมน้ำ"
      ]
    },
    {
      id: "news-thairath-live",
      station: "ไทยรัฐนิวส์โชว์ / Thairath Online",
      programName: "สดเกาะติด: น้ำท่วมถนนวิภาวดี-งามวงศ์วาน ฝนถล่ม กทม. การจราจรอัมพาต",
      speaker: "ทีมข่าวไทยรัฐออนไลน์",
      category: "news",
      categoryLabel: "ข่าวสดออนไลน์",
      offsetStartMins: -125, // เริ่มเมื่อ 2 ชม. 5 นาทีที่แล้ว
      offsetEndMins: -70,    // เพิ่งจบไปเมื่อ 1 ชม. 10 นาทีที่แล้ว (อยู่ในช่วง 3 ชม. ล่าสุด)
      isAlwaysLive: false,
      liveUrl: "https://www.youtube.com/@thairathonline/live",
      replayUrl: "https://www.youtube.com/@thairathonline/streams",
      officialUrl: "https://www.youtube.com/@thairathonline/streams",
      embedType: "youtube-live",
      verifiedWatchNote: "คลิกดูคลิปบันทึก Live ย้อนหลังบน YouTube Thairath Online ได้ทันที",
      summaryBullets: [
        "ถนนงามวงศ์วานผ่านหน้า กฟภ. สนง.ใหญ่ และแยกพงษ์เพชร มีน้ำท่วมขังผิวจราจร 15-20 ซม.",
        "เจ้าหน้าที่เทศบาลนครนนทบุรีติดตั้งเครื่องสูบน้ำเคลื่อนที่เร่งระบายลงคลองบางเขน",
        "สี่แยกแครายและถนนแจ้งวัฒนะ รถติดสะสม ท้ายแถวยาวถึงวงเวียนหลักสี่",
        "ประชาชนโปรดตรวจสอบระดับน้ำก่อนออกจากบ้าน และเลี่ยงเส้นทางน้ำท่วมขังเลนซ้าย"
      ]
    },
    {
      id: "news-ch3-live",
      station: "ช่อง 3 HD (เรื่องเด่นเย็นนี้ / 3Plus)",
      programName: "เรื่องเด่นทันเหตุการณ์: เปิดแผนรับมือน้ำทะเลหนุนสูง ปะทะมวลน้ำเหนือคืนนี้",
      speaker: "ไก่ ภาษิต, ตูน ปรินดา",
      category: "news",
      categoryLabel: "ข่าวโทรทัศน์ภาคเย็น",
      offsetStartMins: -160, // เริ่มเมื่อ 2 ชม. 40 นาทีที่แล้ว
      offsetEndMins: -110,   // เพิ่งจบไปเมื่อ 1 ชม. 50 นาทีที่แล้ว (อยู่ในช่วง 3 ชม. ล่าสุด)
      isAlwaysLive: false,
      liveUrl: "https://ch3plus.com/live/3hd",
      replayUrl: "https://ch3plus.com/live/3hd",
      officialUrl: "https://ch3plus.com/live/3hd",
      embedType: "tv-live",
      verifiedWatchNote: "คลิกเข้าดูถ่ายทอดสดและรายการข่าวย้อนหลังบน 3Plus ได้ทันที",
      summaryBullets: [
        "รายงานสดจุดกลับรถใต้สะพานงามวงศ์วานและถนนแจ้งวัฒนะ รถเล็กชะลอตัว",
        "จับตาแยกพงษ์เพชร-เดอะมอลล์งามวงศ์วาน ฝ่ายระบายน้ำระดมเครื่องสูบน้ำไดโว่กู้เส้นทาง",
        "เปิดแผนเผชิญเหตุน้ำหนุนสูงสุดช่วงค่ำริมเจ้าพระยา ท่าน้ำนนท์ และศิริราช",
        "อัปเดตแจ้งเตือนจากกรมอุตุนิยมวิทยา ฝนฟ้าคะนองร้อยละ 70 ของพื้นที่"
      ]
    },
    {
      id: "news-onwr-national",
      station: "สำนักงานทรัพยากรน้ำแห่งชาติ (สทนช.)",
      programName: "แถลงการณ์สถานการณ์น้ำลุ่มเจ้าพระยาและลุ่มป่าสัก 4 เขื่อนหลัก",
      speaker: "โฆษกสำนักงานทรัพยากรน้ำแห่งชาติ",
      category: "official",
      categoryLabel: "รายงานระดับประเทศ",
      offsetStartMins: -180, // เริ่มเมื่อ 3 ชม. ที่แล้ว
      offsetEndMins: -135,   // เพิ่งจบไปเมื่อ 2 ชม. 15 นาทีที่แล้ว (อยู่ในช่วง 3 ชม. ล่าสุด)
      isAlwaysLive: false,
      liveUrl: "https://www.facebook.com/onwr.th/live_videos/",
      replayUrl: "https://www.facebook.com/onwr.th/live_videos/",
      officialUrl: "https://www.facebook.com/onwr.th/live_videos/",
      embedType: "facebook-live",
      verifiedWatchNote: "คลิกดูคลิปบันทึกแถลงการณ์ย้อนหลังทางการของ สทนช. ได้ทันที",
      summaryBullets: [
        "ปริมาณน้ำใน 4 เขื่อนหลักลุ่มเจ้าพระยา (ภูมิพล สิริกิติ์ แควน้อย ป่าสัก) รวม 74% ของความจุ",
        "ยังสามารถหน่วงน้ำไว้ตอนบนได้บางส่วนเพื่อลดผลกระทบต่อ กทม. และนนทบุรี",
        "เตือนจังหวัดท้ายเขื่อนเจ้าพระยา 11 จังหวัด รวม กทม. เฝ้าระวังระดับน้ำเพิ่มขึ้น 20-40 ซม.",
        "ประสานกรมป้องกันและบรรเทาสาธารณภัย (ปภ.) ส่งเครื่องสูบน้ำขนาด 12 นิ้ว เสริมจุดเสี่ยง"
      ]
    },
    {
      id: "news-js100-traffic",
      station: "จส.100 Radio & Online",
      programName: "LIVE 24 ชม.: สภาพจราจร รายงานน้ำท่วมเรียลไทม์ และประสานงานกู้ภัย",
      speaker: "ทีมผู้ประกาศและศูนย์ข่าว จส.100",
      category: "traffic",
      categoryLabel: "จราจร & น้ำท่วมสด 24 ชม.",
      offsetStartMins: 0,
      offsetEndMins: 0,
      isAlwaysLive: true,
      liveUrl: "https://www.youtube.com/@JS100Radio/streams",
      replayUrl: "https://www.youtube.com/@JS100Radio/streams",
      officialUrl: "https://www.youtube.com/@JS100Radio/streams",
      embedType: "youtube-live",
      verifiedWatchNote: "คลิกเข้าดูสตรีมสดและวิดีโอย้อนหลังสภาพจราจรบน YouTube จส.100 ได้ทันที",
      summaryBullets: [
        "ถ.งามวงศ์วาน ขาออก ผ่านหน้า กฟภ. ประตู 1 ชะลอตัว เลนซ้ายมีน้ำขัง 10-12 ซม.",
        "ถ.แจ้งวัฒนะ หน้าศูนย์ราชการ รถติดสะสม ท้ายแถวใกล้วงเวียนหลักสี่",
        "ซอยชินเขต 2 แยก 6-8 มีน้ำท่วมขังสูง 18-22 ซม. รถเก๋งโปรดหลีกเลี่ยง",
        "โทรแจ้งเหตุน้ำท่วมและขอความช่วยเหลือรถเสียได้ที่สายด่วน 1137"
      ]
    },
    {
      id: "news-swp91-traffic",
      station: "สวพ.FM91 (Trafficpro)",
      programName: "เกาะติดวิกฤตน้ำท่วมเมืองหลวง: สายด่วนช่วยเหลือน้ำท่วม-รถยกฟรี 24 ชม.",
      speaker: "ดีเจและทีมงาน สวพ.FM91",
      category: "traffic",
      categoryLabel: "จราจร & กู้ภัย",
      offsetStartMins: 0,
      offsetEndMins: 0,
      isAlwaysLive: true,
      liveUrl: "https://www.youtube.com/@fm91trafficpro/streams",
      replayUrl: "https://www.youtube.com/@fm91trafficpro/streams",
      officialUrl: "https://www.youtube.com/@fm91trafficpro/streams",
      embedType: "youtube-live",
      verifiedWatchNote: "คลิกเข้าดูสตรีมสดและคลิปย้อนหลังศูนย์วิทยุ สวพ.FM91 ได้ทันที",
      summaryBullets: [
        "ประสานงานตำรวจจราจร สภ.เมืองนนทบุรี และ สน.ทุ่งสองห้อง อำนวยความสะดวกประชาชน",
        "ทีมอาสากู้ภัยป่อเต็กตึ๊ง-ร่วมกตัญญูเตรียมเรือท้องแบนประจำจุดเสี่ยงริมคลองเปรมประชากร",
        "จุดบริการรถยกฟรีสำหรับรถยนต์ดับหรือติดหล่มน้ำท่วมในเขตงามวงศ์วาน-ประชาชื่น",
        "โทรขอความช่วยเหลือหรือรายงานเหตุด่วนได้ที่ 1644 โทรฟรีตลอด 24 ชม."
      ]
    }
  ]
};

// ========================================================================
// คลังรายงานสถานการณ์รอบ กฟภ. สนง.ใหญ่ & ชุมชนชินเขต (Master Pool สำหรับสุ่ม/หมุนเวียนรายงานใหม่ๆ มาทับอันเดิมทุก 5 นาที)
// ========================================================================
const PEA_REPORTS_MASTER_POOL = [
  {
    title: "หน้าสำนักงานใหญ่ การไฟฟ้าส่วนภูมิภาค (PEA) ประตู 1",
    location: "ถ.งามวงศ์วาน หน้า สนง.ใหญ่ กฟภ. ประตู 1 (ฝั่งขาออก)",
    reporter: "เจ้าหน้าที่ กฟภ. ศูนย์ความปลอดภัยและอาชีวอนามัย",
    reporterRole: "เจ้าหน้าที่องค์กร",
    baseWaterDepthCm: 11,
    severity: "moderate",
    severityLabel: "น้ำท่วมเลนซ้าย",
    passable: "รถทุกชนิดผ่านได้ ชะลอความเร็วช่วงหน้าประตู 1",
    description: "ช่องทางคู่ขนานหน้าสำนักงานใหญ่ กฟภ. ประตู 1 มีน้ำขังผิวจราจรเลนซ้ายประมาณ 10-12 ซม. ช่องทางด่วนและเลนขวาสัญจรได้คล่องตัว เดินเครื่องสูบน้ำช่วยระบายต่อเนื่อง",
    source: "ศูนย์ประสานงานฉุกเฉิน กฟภ. สำนักงานใหญ่"
  },
  {
    title: "ประตู 2 กฟภ. สนง.ใหญ่ (ฝั่งเชื่อมต่อสถานีรถไฟฟ้าสายสีแดงบางเขน)",
    location: "ทางเข้าด้านหลัง กฟภ. เลียบแนวคลองเปรมประชากร",
    reporter: "รปภ. ประจำจุดตรวจประตู 2 กฟภ.",
    reporterRole: "เจ้าหน้าที่รักษาความปลอดภัย",
    baseWaterDepthCm: 6,
    severity: "minor",
    severityLabel: "น้ำปริ่มขอบทางลาด",
    passable: "รถทุกชนิดผ่านได้ตามปกติ สัญจรสะดวก",
    description: "ทางเข้าออกประตู 2 ระดับน้ำผิวทางแห้งเกือบหมด มีน้ำขังเล็กน้อยบริเวณขอบทางลาดเท 5-7 ซม. พนักงานและประชาชนสัญจรเข้าออกเชื่อมสถานีรถไฟฟ้าได้สะดวก",
    source: "กองรักษาความปลอดภัย กฟภ. สนง.ใหญ่"
  },
  {
    title: "ปากซอยชินเขต 1 (งามวงศ์วาน 43)",
    location: "ปากซอยงามวงศ์วาน 43 เชื่อมถนนใหญ่",
    reporter: "ประชาชนในพื้นที่ (คุณสมชาย)",
    reporterRole: "รายงานจากประชาชน",
    baseWaterDepthCm: 14,
    severity: "moderate",
    severityLabel: "น้ำท่วมผิวทางเสมอทางเท้า",
    passable: "รถเก๋งผ่านได้ช้า มอเตอร์ไซค์ชิดขวา",
    description: "ปากซอยชินเขต 1 มีน้ำท่วมขังเสมอทางเท้าประมาณ 14 ซม. รถเลี้ยวเข้าซอยต้องชะลอความเร็ว มีคลื่นน้ำเล็กน้อยเวลาเปิดทาง เจ้าหน้าที่คอยช่วยโบกรถ",
    source: "กลุ่มไลน์เตือนภัยชุมชนชินเขต-งามวงศ์วาน"
  },
  {
    title: "ปากซอยชินเขต 2 (งามวงศ์วาน 47)",
    location: "ปากซอยงามวงศ์วาน 47 เชื่อมถนนงามวงศ์วานสายหลัก",
    reporter: "วินจักรยานยนต์รับจ้างปากซอย 47",
    reporterRole: "ผู้ให้บริการขนส่งสาธารณะ",
    baseWaterDepthCm: 13,
    severity: "moderate",
    severityLabel: "น้ำท่วมขังรอระบาย",
    passable: "รถผ่านได้ ควรชะลอความเร็ว",
    description: "ช่วงปากซอยงามวงศ์วาน 47 มีน้ำท่วมขังผิวถนนระยะทางประมาณ 60 เมตร ระดับน้ำ 12-14 ซม. รถเล็กยังผ่านได้ต่อเนื่อง",
    source: "ศูนย์ประสานงานจราจรชุมชนชินเขต"
  },
  {
    title: "ซอยชินเขต 2 (งามวงศ์วาน 47) หน้าตลาดชินเขต",
    location: "ซอยงามวงศ์วาน 47 หน้าตลาดและร้านค้าชุมชน",
    reporter: "พ่อค้าแม่ค้าตลาดชินเขต",
    reporterRole: "ผู้ประกอบการชุมชน",
    baseWaterDepthCm: 17,
    severity: "critical",
    severityLabel: "น้ำเอ่อท่วมขัง",
    passable: "รถเล็กหลีกเลี่ยง รถกระบะผ่านได้",
    description: "บริเวณหน้าตลาดชินเขต 2 น้ำท่วมขังทั้ง 2 เลน สูงประมาณครึ่งล้อรถเก๋ง (17 ซม.) ผู้ค้าจัดแนวกระสอบทรายกั้นหน้าร้านแล้ว มีเครื่องสูบน้ำช่วยดูดระบาย",
    source: "เพจข่าวสารชุมชนชินเขต"
  },
  {
    title: "ซอยงามวงศ์วาน 47 แยก 6-8 (พื้นที่แอ่งกระทะชินเขต)",
    location: "จุดต่ำสุดในซอยชินเขต 2 เชื่อมต่อแนวคลองบางเขน",
    reporter: "กรรมการชุมชนร่วมใจชินเขต",
    reporterRole: "ตัวแทนชุมชน",
    baseWaterDepthCm: 22,
    severity: "critical",
    severityLabel: "น้ำท่วมสูงในซอยย่อย",
    passable: "รถเก๋งและมอเตอร์ไซค์ห้ามผ่านเด็ดขาด",
    description: "บริเวณแยก 6 ถึง 8 เป็นจุดแอ่งกระทะ ระดับน้ำสูง 20-22 ซม. รถเก๋งไม่ควรเข้าเด็ดขาด กทม.และฝ่ายระบายน้ำนำเครื่องสูบน้ำเคลื่อนที่มาติดตั้งเร่งระบายน้ำ",
    source: "ศูนย์ประสานงานชุมชนชินเขต"
  },
  {
    title: "สะพานข้ามคลองเปรมประชากร (ข้าง สนง.ใหญ่ กฟภ.)",
    location: "จุดเชื่อมต่อ ถ.งามวงศ์วาน ข้ามคลองเปรมประชากร",
    reporter: "อาสากู้ภัยป่อเต็กตึ๊ง จุดพงษ์เพชร",
    reporterRole: "อาสาสมัครกู้ภัย",
    baseWaterDepthCm: 8,
    severity: "minor",
    severityLabel: "น้ำปริ่มขอบทาง",
    passable: "ผ่านได้ทุกช่องทาง สภาพคล่องตัว",
    description: "คลองเปรมประชากรข้าง สนง.ใหญ่ กฟภ. น้ำขึ้นสูงเกือบเสมอขอบเขื่อนระบายน้ำ มีน้ำเอ่อล้นเข้าขอบผิวจราจรเชิงสะพานเล็กน้อย แต่การจราจรบนสะพานวิ่งได้ปกติ",
    source: "ศูนย์วิทยุอาสาสมัครกู้ภัย"
  },
  {
    title: "จุดกลับรถใต้สะพานงามวงศ์วาน (ข้ามคลองเปรมประชากร หน้า สนง.ใหญ่ กฟภ.)",
    location: "จุดกลับรถใต้สะพานงามวงศ์วาน ข้ามคลองเปรมประชากร (หน้า สนง.ใหญ่ กฟภ.)",
    reporter: "ผู้ใช้เส้นทาง (Twitter/X)",
    reporterRole: "ผู้ใช้เส้นทาง",
    baseWaterDepthCm: 21,
    severity: "critical",
    severityLabel: "น้ำท่วมสูงปิดช่องกลับรถ",
    passable: "รถเล็กห้ามผ่านเด็ดขาด มีป้ายเตือน",
    description: "จุดกลับรถใต้สะพานข้ามคลองเปรมประชากร หน้า สนง.ใหญ่ กฟภ. ระดับน้ำท่วมขัง 20-22 ซม. มีรถจอดเสีย 1 คัน เจ้าหน้าที่ตำรวจจราจรนำกรวยมาปิดกั้นช่องทางกลับรถชั่วคราว แนะนำให้ไปกลับรถที่แยกพงษ์เพชรแทน",
    source: "รายงานสภาพจราจร จส.100"
  },
  {
    title: "ซอยงามวงศ์วาน 43 แยก 2-8 ชุมชนร่วมใจพัฒนา (หลัง กฟภ.)",
    location: "ชุมชนริมคลองเปรมประชากร ด้านหลังรั้ว สนง.ใหญ่ กฟภ.",
    reporter: "ประธานชุมชนร่วมใจพัฒนา",
    reporterRole: "ผู้นำชุมชน",
    baseWaterDepthCm: 14,
    severity: "moderate",
    severityLabel: "น้ำขังเสมอทางเดินเท้า",
    passable: "รถเล็กระมัดระวังคลื่นน้ำ",
    description: "ทางเดินคอนกรีตเลียบคลองหลัง กฟภ. น้ำทรงตัวเสมอขอบเขื่อนชุมชน ปั๊มน้ำไดโว่ชุมชนเปิดทำงานระบายน้ำลงสู่คลองเปรมฯ อย่างต่อเนื่อง",
    source: "เครือข่ายชุมชนริมคลองเปรมประชากร"
  },
  {
    title: "ระบบไฟฟ้าและสถานีย่อยภายใน สนง.ใหญ่ กฟภ. (งามวงศ์วาน)",
    location: "ศูนย์ควบคุมและระบบไฟฟ้าภายใน สนง.ใหญ่ กฟภ. ถ.งามวงศ์วาน",
    reporter: "ทีมวิศวกร กฟภ. ส่วนระบบไฟฟ้า",
    reporterRole: "วิศวกรผู้เชี่ยวชาญ กฟภ.",
    baseWaterDepthCm: 6,
    severity: "minor",
    severityLabel: "คันกั้นน้ำปกติ",
    passable: "สัญจรได้คล่องตัว ปลอดภัย",
    description: "ตรวจสอบแนวเขื่อนป้องกันและระบบสถานีไฟฟ้าสำรองภายใน สนง.ใหญ่ กฟภ. ระดับน้ำภายนอกไม่ส่งผลกระทบต่ออุปกรณ์ไฟฟ้า เครื่องสูบน้ำอัตโนมัติพร้อมทำงาน 100%",
    source: "ฝ่ายปฏิบัติการและบำรุงรักษา กฟภ."
  },
  {
    title: "ถนนเลียบคลองเปรมประชากร หน้าสถานีรถไฟบางเขน (ตรงข้าม กฟภ.)",
    location: "ถนนเลียบทางรถไฟ เชื่อมระหว่างงามวงศ์วานและหลักสี่",
    reporter: "เจ้าหน้าที่รักษาความปลอดภัย รถไฟฟ้าสายสีแดง",
    reporterRole: "เจ้าหน้าที่ระบบราง",
    baseWaterDepthCm: 11,
    severity: "minor",
    severityLabel: "น้ำท่วมขอบทาง",
    passable: "รถทุกชนิดผ่านได้ เข้าสถานีได้ปกติ",
    description: "ถนนเลียบทางรถไฟและคลองเปรมประชากรหน้าสถานีบางเขน มีน้ำขังเลนติดคลองประมาณ 10 ซม. ช่องทางหลักสัญจรได้ รถเข้าสู่สถานีรถไฟฟ้าสายสีแดงได้ตามปกติ",
    source: "ศูนย์ควบคุมสถานีรถไฟบางเขน"
  },
  {
    title: "ซอยชินเขต 1 แยก 3 (ชุมชนสุขาภิบาล 1)",
    location: "ซอยย่อยเชื่อมโยงภายในชุมชนชินเขต 1",
    reporter: "สมาชิก อสม. ชุมชนชินเขต",
    reporterRole: "อาสาสมัครสาธารณสุข",
    baseWaterDepthCm: 10,
    severity: "minor",
    severityLabel: "น้ำรอการระบาย",
    passable: "สัญจรได้ปกติ เดินเท้าได้สะดวก",
    description: "ระดับน้ำในซอยย่อยสุขาภิบาล 1 ลดลงต่อเนื่องหลังฝนเริ่มซา เหลือขังตามแอ่งถนนประมาณ 8-10 ซม. ประชาชนเดินสัญจรได้สะดวกขึ้น",
    source: "ชมรมอาสาสมัครสาธารณสุขชุมชนชินเขต"
  },
  {
    title: "หน้าเรือนจำกลางคลองเปรม / ถ.งามวงศ์วาน (เยื้อง กฟภ. สนง.ใหญ่)",
    location: "ถ.งามวงศ์วาน ขาเข้ามุ่งหน้าวิภาวดีรังสิต",
    reporter: "ผู้ใช้เส้นทาง ถ.งามวงศ์วาน",
    reporterRole: "ผู้ใช้เส้นทาง",
    baseWaterDepthCm: 7,
    severity: "minor",
    severityLabel: "น้ำแห้งเกือบปกติ",
    passable: "ผ่านได้ทุกช่องทาง จราจรคล่องตัว",
    description: "ถนนงามวงศ์วานฝั่งขาเข้าเยื้อง สนง.ใหญ่ กฟภ. ผิวจราจรแห้งเป็นส่วนใหญ่ เลนซ้ายสุดมีน้ำขังบางจุดไม่เกิน 7 ซม. การจราจรเคลื่อนตัวตามสัญญาณไฟปกติ",
    source: "กลุ่มจราจรชุมชนคนงามวงศ์วาน"
  },
  {
    title: "ประตูระบายน้ำคลองบางเขน (จุดตัดซอยงามวงศ์วาน 49 / รั้วทิศเหนือ กฟภ.)",
    location: "จุดเชื่อมต่อคลองบางเขนและคลองเปรมประชากร ทิศเหนือ กฟภ.",
    reporter: "เจ้าหน้าที่สำนักการระบายน้ำ กทม.",
    reporterRole: "เจ้าหน้าที่ควบคุมประตูระบายน้ำ",
    baseWaterDepthCm: 9,
    severity: "minor",
    severityLabel: "เดินเครื่องสูบเต็มพิกัด",
    passable: "ทางเลียบคลองสัญจรได้",
    description: "สถานีสูบน้ำคลองบางเขน-เปรมประชากร เดินเครื่องสูบน้ำ 3 เครื่องเต็มกำลังเพื่อเร่งดึงน้ำออกจากโซนชินเขตและพื้นที่โดยรอบ กฟภ. ออกสู่แม่น้ำเจ้าพระยา",
    source: "สำนักการระบายน้ำ กรุงเทพมหานคร"
  },
  {
    title: "ซอยงามวงศ์วาน 43 แยก 11 (ท้ายซอยชินเขต 1 ติดคูคลองบางเขน)",
    location: "ท้ายซอยงามวงศ์วาน 43 เชื่อมต่อสะพานข้ามคลองบางเขน",
    reporter: "ลูกบ้านหมู่บ้านชินเขตวิลล์",
    reporterRole: "ประชาชนในพื้นที่",
    baseWaterDepthCm: 16,
    severity: "critical",
    severityLabel: "น้ำเอ่อท่วมผิวซอย",
    passable: "รถกระบะผ่านได้ รถเล็กควรชะลอความเร็ว",
    description: "ท้ายซอย 43 มีน้ำเอ่อจากคูระบายน้ำเชื่อมคลองบางเขน ท่วมผิวซอยระยะทาง 80 เมตร ระดับน้ำ 15-17 ซม. ชุมชนยกสิ่งของขึ้นที่สูงแล้ว",
    source: "เครือข่ายเตือนภัยน้ำท่วมชินเขต"
  },
  {
    title: "ปากซอยงามวงศ์วาน 45 (ระหว่างชินเขต 1 และ 2)",
    location: "ปากซอยงามวงศ์วาน 45 หน้าโชว์รูมและเต็นท์รถ",
    reporter: "ผู้ขับขี่รถแท็กซี่สาธารณะ",
    reporterRole: "ผู้ขับขี่สาธารณะ",
    baseWaterDepthCm: 12,
    severity: "moderate",
    severityLabel: "น้ำท่วมเลนขอบทาง",
    passable: "รถทุกชนิดผ่านได้ ระวังคลื่นน้ำสาดฟุตปาธ",
    description: "บริเวณหน้าปากซอยงามวงศ์วาน 45 มีน้ำท่วมขังเลนซ้ายสุดเสมอขอบทางเท้า ประมาณ 12 ซม. เลนกลางและขวารถเคลื่อนตัวได้ปกติ",
    source: "สวพ.FM91 เครือข่ายแท็กซี่เตือนภัย"
  },
  {
    title: "ทางลงยกระดับอุตราภิมุข (ดอนเมืองโทลล์เวย์) มุ่งหน้างามวงศ์วาน",
    location: "ทางลงดอนเมืองโทลล์เวย์ เลี้ยวเข้า ถ.งามวงศ์วาน หน้า กฟภ.",
    reporter: "เจ้าหน้าที่สายตรวจโทลล์เวย์",
    reporterRole: "เจ้าหน้าที่ทางด่วน",
    baseWaterDepthCm: 5,
    severity: "minor",
    severityLabel: "ผิวทางแห้งสัญจรคล่องตัว",
    passable: "ผ่านได้ปกติทุกช่องทาง",
    description: "ทางลงโทลล์เวย์เชื่อมต่องามวงศ์วานไม่มีน้ำท่วมขังบนทางด่วน มีเพียงน้ำรอระบายเล็กน้อยบริเวณจุดตัดถนนพื้นราบด้านล่าง สัญจรได้ปลอดภัย",
    source: "ศูนย์ควบคุมการจราจรดอนเมืองโทลล์เวย์"
  },
  {
    title: "ซอยชินเขต 2 แยก 14 (ชุมชนภาสยา 1 หลัง กฟภ.)",
    location: "ซอยย่อยงามวงศ์วาน 47 แยก 14 โซนที่พักอาศัยหนาแน่น",
    reporter: "อาสาสมัครป้องกันภัยฝ่ายพลเรือน (อปพร.) หลักสี่",
    reporterRole: "เจ้าหน้าที่ อปพร.",
    baseWaterDepthCm: 18,
    severity: "critical",
    severityLabel: "น้ำรอการระบายในซอย",
    passable: "รถเล็กโปรดระมัดระวัง รถกระบะผ่านได้",
    description: "มีน้ำท่วมขังผิวถนนในซอยช่วงกลางซอย 18 ซม. เจ้าหน้าที่ อปพร. นำเครื่องสูบน้ำไดโว่ขนาด 3 นิ้ว 2 เครื่อง เร่งสูบน้ำลงสู่ท่อระบายน้ำหลัก",
    source: "ศูนย์ อปพร. เขตหลักสี่"
  },
  {
    title: "หน้าอาคาร LED การไฟฟ้าส่วนภูมิภาค (PEA Innovation Building)",
    location: "ลานด้านหน้าอาคารนวัตกรรม กฟภ. สนง.ใหญ่",
    reporter: "ทีมงานอาคารและสถานที่ กฟภ.",
    reporterRole: "เจ้าหน้าที่อาคาร",
    baseWaterDepthCm: 4,
    severity: "minor",
    severityLabel: "ระดับน้ำปกติ",
    passable: "ผ่านได้สะดวกทุกช่องทาง",
    description: "ลานหน้าอาคาร LED และทางลาดจอดรถระบบสูบน้ำใต้ดินทำงานปกติ ไม่มีน้ำท่วมขังในพื้นที่สำคัญ พนักงานและผู้มาติดต่อจอดรถได้ปลอดภัย",
    source: "ฝ่ายบริหารอาคารและบริการ กฟภ."
  },
  {
    title: "สี่แยกพงษ์เพชร (สะพานข้ามแยกฝั่งมุ่งหน้า กฟภ. สนง.ใหญ่)",
    location: "ทางลงสะพานข้ามแยกพงษ์เพชร เชื่อมงามวงศ์วาน",
    reporter: "ตำรวจจราจร สน.ทุ่งสองห้อง",
    reporterRole: "เจ้าหน้าที่ตำรวจจราจร",
    baseWaterDepthCm: 15,
    severity: "moderate",
    severityLabel: "น้ำท่วมผิวจราจรเลนซ้าย",
    passable: "รถผ่านได้ ชะลอตัวช่วงลงสะพาน",
    description: "เชิงทางลงสะพานข้ามแยกพงษ์เพชรมุ่งหน้า กฟภ. มีน้ำขังเลนซ้าย 15 ซม. รถชะลอตัวเบี่ยงออกเลนกลาง ตำรวจจราจรคอยอำนวยการจราจรต่อเนื่อง",
    source: "งานจราจร สน.ทุ่งสองห้อง"
  },
  {
    title: "ศูนย์จ่ายไฟและควบคุมระบบไฟฟ้าภาคกลาง กฟภ. (สำนักงานใหญ่)",
    location: "บริเวณศูนย์สั่งการจ่ายไฟ กฟภ. สนง.ใหญ่",
    reporter: "เวรวิศวกรควบคุมระบบโครงข่ายไฟฟ้า",
    reporterRole: "วิศวกร กฟภ.",
    baseWaterDepthCm: 2,
    severity: "minor",
    severityLabel: "ระบบป้องกันน้ำสมบูรณ์ 100%",
    passable: "พื้นที่ปลอดภัยสูงสุด",
    description: "ระบบเขื่อนคอนกรีตกันน้ำและปั๊มสูบน้ำอัตโนมัติรอบศูนย์จ่ายไฟทำงานสมบูรณ์ การจ่ายกระแสไฟฟ้าให้พื้นที่ กทม.และปริมณฑลมีเสถียรภาพปกติ",
    source: "ศูนย์ควบคุมการจ่ายไฟฟ้า กฟภ."
  },
  {
    title: "ปากซอยงามวงศ์วาน 49 (ซอยร่วมพัฒนา ติดรั้ว กฟภ.)",
    location: "ปากซอยงามวงศ์วาน 49 ทางเข้าออกชุมชนริมคลอง",
    reporter: "ผู้ประกอบการร้านค้าปากซอย 49",
    reporterRole: "ประชาชนในพื้นที่",
    baseWaterDepthCm: 13,
    severity: "moderate",
    severityLabel: "น้ำท่วมเลนขอบทาง",
    passable: "รถเล็กผ่านได้ช้า ชิดขวา",
    description: "มีน้ำขังจากผิวถนนงามวงศ์วานไหลเอ่อเข้าปากซอย 12-14 ซม. เทศบาลนำกระสอบทรายมาเสริมแนวกั้นน้ำให้บ้านเรือนปากซอยแล้ว",
    source: "กลุ่มไลน์เตือนภัยชุมชนงามวงศ์วาน"
  },
  {
    title: "แนวเขื่อนคลองเปรมประชากร หลังชุมชนชินเขต (โซนเชื่อมต่อ กฟภ.)",
    location: "ริมคลองเปรมประชากร ด้านหลังชุมชนชินเขต 1-2",
    reporter: "ทีมเฝ้าระวังระดับน้ำ กรมเจ้าท่า / อาสากู้ภัย",
    reporterRole: "เจ้าหน้าที่ตรวจการ",
    baseWaterDepthCm: 11,
    severity: "minor",
    severityLabel: "น้ำในคลองทรงตัวสูง",
    passable: "ทางเดินเท้าเลียบคลองต้องระวังลื่น",
    description: "ระดับน้ำในคลองเปรมประชากรยังคงสูง ปริ่มสันเขื่อนคอนกรีตป้องกันน้ำท่วม มีน้ำซึมตามรอยต่อเล็กน้อย เครื่องสูบน้ำชุมชนเร่งทำงานระบายน้ำ",
    source: "ศูนย์ประสานงานอาสากู้ภัยภาคประชาชน"
  },
  {
    title: "สะพานลอยคนข้ามหน้า สนง.ใหญ่ กฟภ. (ถ.งามวงศ์วาน)",
    location: "หน้าประตูใหญ่ สนง.ใหญ่ กฟภ. ข้ามไปยังฝั่งเรือนจำ",
    reporter: "ประชาชนเดินเท้า (ผู้ใช้สะพานลอย)",
    reporterRole: "ประชาชนทั่วไป",
    baseWaterDepthCm: 10,
    severity: "minor",
    severityLabel: "เชิงบันไดมีน้ำขังเล็กน้อย",
    passable: "คนเดินเท้าใช้สะพานลอยได้สะดวก",
    description: "เชิงบันไดสะพานลอยฝั่ง กฟภ. มีน้ำขังบนพื้นฟุตปาธประมาณ 8-10 ซม. เจ้าหน้าที่นำแท่นไม้วางเป็นสะพานทางเดินชั่วคราวให้ประชาชนเดินได้สะดวก",
    source: "เพจคนข้ามถนนงามวงศ์วาน"
  }
];

// ========================================================================
// คลังประเด็นสำคัญและสถานการณ์ล่าสุด (SitRep Pool) สำหรับอัปเดต Live News ทุกชั่วโมง
// แยกตามรหัสรายการ (id) และรอบช่วงเวลาของวัน เพื่อให้เนื้อหา SitRep เปลี่ยนแปลงตามเวลาจริงทุก ชม.
// ========================================================================
const LIVE_NEWS_HOURLY_SITREP_POOL = {
  "news-bma-briefing": [
    {
      programName: "แถลงด่วนศูนย์บริหารจัดการน้ำ กทม.: เกาะติดสถานการณ์น้ำเหนือ & เร่งระบายน้ำคลองสายหลัก",
      bullets: [
        "กทม. เตรียมพร้อมสถานีสูบน้ำริมแม่น้ำเจ้าพระยา 96 แห่ง เดินเครื่องเต็มกำลัง 100%",
        "วางแนวกระสอบทรายเสริมจุดฟันหลอ 76 จุด โดยเฉพาะย่านทรงวาด ท่าเตียน และบางกอกน้อย",
        "ระดับน้ำคลองเปรมประชากรและคลองบางเขนยังสูง สั่งเดินเครื่องสูบน้ำเคลื่อนที่ช่วยเร่งระบาย",
        "เฝ้าระวังช่วง 18:30 - 21:00 น. วันนี้น้ำทะเลหนุนสูงสุด คาดระดับน้ำแตะ 1.84 ม.รทก."
      ]
    },
    {
      programName: "สรุปสถานการณ์ประจำชั่วโมง: กทม. เปิดประตูระบายน้ำฝั่งตะวันออก เร่งพร่องน้ำรับฝนค่ำนี้",
      bullets: [
        "สำนักการระบายน้ำเปิดประตูระบายน้ำคลองแสนแสบและคลองประเวศฯ พร่องน้ำล่วงหน้า 30 ซม.",
        "จุดเฝ้าระวังพิเศษริมแม่น้ำเจ้าพระยาชุมชนนอกคันกั้นน้ำ 16 ชุมชน เสริมสะพานไม้ทางเดินและแนวกระสอบทราย",
        "อุโมงค์ระบายน้ำพระราม 9 และอุโมงค์บางซื่อ เดินเครื่องสูบเต็มพิกัดดึงน้ำออกจากพื้นที่ชั้นใน",
        "จัดทีมเทศกิจและหน่วยเบสท์ประจำจุดเสี่ยงน้ำท่วมขังบนถนนสายหลัก 24 จุดทั่วกรุง"
      ]
    },
    {
      programName: "เกาะติดวิกฤตน้ำหลาก กทม.: ยกระดับศูนย์บัญชาการน้ำท่วม 50 เขต เฝ้าระวัง 24 ชม.",
      bullets: [
        "ผอ.สำนักการระบายน้ำเผย มวลน้ำเหนือผ่านจุดวัดบางไทรอยู่ที่ 2,120 ลบ.ม./วินาที ยังอยู่ในเกณฑ์คุมได้",
        "ประสานกรมชลประทานผันน้ำออกทางคลองรพีพัฒน์และทุ่งรับน้ำฝั่งตะวันออกเพื่อลดแรงดันน้ำผ่านเมือง",
        "ส่งรถสูบน้ำ Hydroflow แรงดันสูง 4 คัน ประจำจุดเสี่ยงเขตจตุจักร บางเขน และหลักสี่",
        "สายด่วน 1555 และ Line @BKKCONNECT เปิดรับแจ้งเหตุน้ำท่วมขังตลอด 24 ชั่วโมง"
      ]
    },
    {
      programName: "แถลงการณ์ค่ำ กทม.: ควบคุมระดับน้ำในคลองสายหลักรับมือน้ำหนุนกลางดึก",
      bullets: [
        "สถานีสูบน้ำคลองบางเขนใหม่และคลองเปรมประชากรตอนล่าง เร่งระบายน้ำลงสู่แม่น้ำเจ้าพระยาช่วงน้ำลง",
        "ตรวจสอบความมั่นคงของแนวคันกั้นน้ำชั่วคราวตลอดแนวแม่น้ำเจ้าพระยา 88 กิโลเมตร ไม่พบรอยรั่วซึมรุนแรง",
        "เตรียมพร้อมหน่วยแพทย์ฉุกเฉินและเรือท้องแบนสำหรับพื้นที่ชุมชนริมคลองที่มีผู้ป่วยติดเตียง",
        "คาดการณ์คืนนี้น้ำทะเลหนุนรอบสองเวลาประมาณ 03:00 น. ขอให้ชุมชนริมน้ำยกของขึ้นที่สูง"
      ]
    }
  ],
  "news-thaipbs-live": [
    {
      programName: "LIVE พิเศษ เกาะติดภัยพิบัติ: บินโดรนสำรวจมวลน้ำเหนือบางไทร จ่อประชิดนนทบุรี-กทม.",
      bullets: [
        "ภาพมุมสูงเขื่อนเจ้าพระยาระบาย 2,150 ลบ.ม./วิ พื้นที่ท้ายเขื่อน จ.อยุธยา น้ำท่วมขังสูงขึ้น",
        "มวลน้ำก้อนใหญ่กำลังเคลื่อนตัวผ่านจุดวัดบางไทร คาดถึงนนทบุรี-กทม. ในช่วงดึกคืนนี้",
        "สัมภาษณ์สดชาวบ้านชุมชนชินเขต และริมคลองเปรมประชากร เรื่องการรับมือระดับน้ำขัง",
        "ข้อแนะนำการจอดรถบนสะพานและอาคารสูงสำหรับผู้พักอาศัยพื้นที่เสี่ยงริมน้ำ"
      ]
    },
    {
      programName: "เปิดแฟ้มเจาะลึกภัยพิบัติ: สำรวจคันกั้นน้ำแม่น้ำเจ้าพระยา ช่วงนนทบุรี-บางพลัด รับมือไหวไหม?",
      bullets: [
        "ผู้สื่อข่าวลงเรือสำรวจแนวเขื่อนเจ้าพระยาตั้งแต่ท่าน้ำนนทบุรีถึงสะพานพระราม 7 พบระดับน้ำปริ่มเขื่อน",
        "ชุมชนนอกคันกั้นน้ำเขตบางพลัดและดุสิต เริ่มมีน้ำเอ่อท่วมใต้ถุนบ้านช่วงน้ำทะเลหนุน",
        "นักวิชาการชี้จุดเสี่ยงสูงสุดคือช่วงที่มวลน้ำเหนือหลากมาปะทะกับน้ำหนุนสูงสุด (Storm Surge Effect)",
        "ข้อสังเกตการเปิด-ปิดประตูระบายน้ำคลองบางกอกน้อยเพื่อป้องกันน้ำตีกลับเข้าคลองสาขา"
      ]
    },
    {
      programName: "สดพิเศษ: วิเคราะห์แบบจำลองมวลน้ำหลากลุ่มเจ้าพระยา 7 วันข้างหน้า",
      bullets: [
        "เจาะลึกข้อมูลเรดาร์ฝนและภาพถ่ายดาวเทียม GISTDA พบพื้นที่ทุ่งรับน้ำเริ่มเต็มความจุ 70-80%",
        "เส้นทางระบายน้ำฝั่งตะวันออกผ่านคลองหกวาและคลองแสนแสบเป็นตัวแปรสำคัญในการช่วยแบ่งเบา กทม.",
        "รายงานสดจากชุมชนริมคลองเปรมประชากรตอนบน ชี้แจงแผนอพยพกรณีน้ำล้นตลิ่งเกิน 30 ซม.",
        "เปิดช่องทางศูนย์ประสานงานช่วยเหลือผู้ประสบภัยของไทยพีบีเอสเพื่อรับเรื่องร้องเรียนจากชุมชน"
      ]
    },
    {
      programName: "เกาะติดภาคสนาม: การทำงานของระบบสูบน้ำและอุโมงค์ยักษ์ กทม. พร้อมแค่ไหนในวิกฤตนี้?",
      bullets: [
        "ทีมข่าวลงพื้นที่สถานีสูบน้ำคลองเตยและอุโมงค์ระบายน้ำพระราม 9 สัมภาษณ์วิศวกรผู้ควบคุมระบบ",
        "ปัญหาขยะอุดตันท่อระบายน้ำและหน้าตะแกรงดักขยะลดประสิทธิภาพการสูบน้ำลงกว่า 20%",
        "ภาพสดระบบเรดาร์ตรวจจับกลุ่มฝนรอบ กทม. กำลังเคลื่อนตัวเข้าทิศตะวันออกเฉียงเหนือ",
        "คำแนะนำในการตรวจสอบระบบไฟฟ้ารอบบ้านก่อนน้ำท่วมถึงปลั๊กและตู้ควบคุม"
      ]
    }
  ],
  "news-thairath-live": [
    {
      programName: "สดเกาะติด: น้ำท่วมถนนวิภาวดี-งามวงศ์วาน ฝนถล่ม กทม. การจราจรอัมพาต",
      bullets: [
        "ถนนงามวงศ์วานผ่านหน้า กฟภ. สนง.ใหญ่ และแยกพงษ์เพชร มีน้ำท่วมขังผิวจราจร 15-20 ซม.",
        "เจ้าหน้าที่เทศบาลนครนนทบุรีติดตั้งเครื่องสูบน้ำเคลื่อนที่เร่งระบายลงคลองบางเขน",
        "สี่แยกแครายและถนนแจ้งวัฒนะ รถติดสะสม ท้ายแถวยาวถึงวงเวียนหลักสี่",
        "ประชาชนโปรดตรวจสอบระดับน้ำก่อนออกจากบ้าน และเลี่ยงเส้นทางน้ำท่วมขังเลนซ้าย"
      ]
    },
    {
      programName: "ไทยรัฐนิวส์โชว์ สด: สรุปภาพรวมน้ำท่วมขังถนนสายหลัก กทม. หลังฝนตกหนักสะสม",
      bullets: [
        "ถนนรัชดาภิเษกหน้าศาลอาญา และถนนพหลโยธินหน้าสวนจตุจักร น้ำท่วมขังเลนซ้าย 10-15 ซม.",
        "ทางลอดแยกรัชโยธินเปิดใช้งานปกติ แต่ชะลอตัวช่วงทางขึ้น-ลงเนื่องจากรถเบี่ยงหลบน้ำ",
        "ศูนย์ควบคุมจราจรแนะนำเลี่ยงถนนงามวงศ์วานขาออก ใช้ทางยกระดับอุตราภิมุข (ดอนเมืองโทลล์เวย์)",
        "กู้ภัยสว่างบริบูรณ์และป่อเต็กตึ๊งนำรถยกเคลื่อนย้ายรถยนต์เครื่องยนต์ดับบนถนนงามวงศ์วาน 5 คัน"
      ]
    },
    {
      programName: "เกาะติดสดนาทีต่อนาที: น้ำท่วมขังซอยชุมชนชินเขต-งามวงศ์วาน เร่งติดตั้งไดโว่กู้เส้นทาง",
      bullets: [
        "ซอยงามวงศ์วาน 47 (ชินเขต 2) น้ำท่วมขังสูง 20-25 ซม. รถเล็กและมอเตอร์ไซค์สัญจรลำบากมาก",
        "ฝ่ายระบายน้ำเขตหลักสี่เดินเครื่องสูบน้ำขนาด 8 นิ้ว 3 เครื่อง เร่งดึงน้ำลงคลองบางเขน",
        "ชาวบ้านริมคลองเร่งยกเครื่องใช้ไฟฟ้าและตู้เย็นขึ้นชั้นสอง หลังคลองเอ่อล้นเข้าท่อระบาย",
        "เจ้าหน้าที่ กฟภ. ลงพื้นที่ตรวจสอบหม้อแปลงไฟฟ้าและตู้มิเตอร์ริมทางเพื่อความปลอดภัย"
      ]
    },
    {
      programName: "สดจากห้องข่าวไทยรัฐ: เตือนพื้นที่เสี่ยงคืนนี้ รับมือน้ำเหนือปะทะน้ำทะเลหนุน",
      bullets: [
        "กรมอุตุนิยมวิทยาประกาศเตือนร่องมรสุมพาดผ่านภาคกลาง ส่งผลให้ กทม. มีฝนตกหนักต่อเนื่องถึงเช้า",
        "ระดับน้ำในแม่น้ำเจ้าพระยาช่วงสะพานพระราม 5 และสะพานกรุงธนฯ สูงกว่าค่าเฉลี่ย 40 ซม.",
        "เทศบาลนครนนทบุรีประกาศเตือนชุมชนนอกคันกั้นน้ำ 15 จุด ให้ระมัดระวังน้ำท่วมฉับพลัน",
        "รายงานสภาพการจราจรรอบ กฟภ. สนง.ใหญ่ เริ่มคลี่คลาย รถเคลื่อนตัวได้ช้าตามสัญญาณไฟ"
      ]
    }
  ],
  "news-ch3-live": [
    {
      programName: "เรื่องเด่นทันเหตุการณ์: เปิดแผนรับมือน้ำทะเลหนุนสูง ปะทะมวลน้ำเหนือคืนนี้",
      bullets: [
        "รายงานสดจุดกลับรถใต้สะพานงามวงศ์วานและถนนแจ้งวัฒนะ รถเล็กชะลอตัว",
        "จับตาแยกพงษ์เพชร-เดอะมอลล์งามวงศ์วาน ฝ่ายระบายน้ำระดมเครื่องสูบน้ำไดโว่กู้เส้นทาง",
        "เปิดแผนเผชิญเหตุน้ำหนุนสูงสุดช่วงค่ำริมเจ้าพระยา ท่าน้ำนนท์ และศิริราช",
        "อัปเดตแจ้งเตือนจากกรมอุตุนิยมวิทยา ฝนฟ้าคะนองร้อยละ 70 ของพื้นที่"
      ]
    },
    {
      programName: "3Plus นิวส์โฟกัส: เกาะติดจุดน้ำท่วมซ้ำซาก กทม.-นนทบุรี หลังฝนถล่มช่วงบ่าย",
      bullets: [
        "ผู้สื่อข่าวช่อง 3 รายงานสดจากถนนแจ้งวัฒนะ บริเวณใต้ทางด่วน น้ำท่วมขัง 15 ซม. จราจรติดขัด",
        "บริเวณหน้าศูนย์ราชการแจ้งวัฒนะ เจ้าหน้าที่ทหารนำรถบรรทุกยกสูงบริการรับ-ส่งประชาชน",
        "ระดับน้ำคลองลาดพร้าวและคลองเปรมประชากรทรงตัวสูง แต่ยังไม่มีน้ำล้นแนวเขื่อนหลัก",
        "แนะเส้นทางเลี่ยงน้ำท่วม: เลี่ยง ถ.งามวงศ์วาน มุ่งหน้าแคราย ให้ใช้ ถ.รัตนาธิเบศร์ แทน"
      ]
    },
    {
      programName: "เรื่องเด่นเย็นนี้ เจาะลึก: มวลน้ำเหนือผ่านเขื่อนป่าสักชลสิทธิ์และเจ้าพระยา กระทบเมืองหลวงแค่ไหน?",
      bullets: [
        "เขื่อนป่าสักชลสิทธิ์ปรับการระบายน้ำเพื่อรองรับน้ำไหลเข้าเขื่อน ชี้กระทบลุ่มน้ำป่าสักตอนล่าง",
        "กทม. ยืนยันคันกั้นน้ำถาวรแนวเจ้าพระยาสูง 2.80 - 3.50 ม.รทก. มั่นใจรองรับมวลน้ำ 2,500 ลบ.ม./วิ ได้",
        "จุดอ่อนสำคัญอยู่ที่ชุมชนริมคลองสายรองที่ยังไม่มีเขื่อนคอนกรีตถาวร เช่น คลองเปรมฯ บางช่วง",
        "ชื่นชมจิตอาสาและเจ้าหน้าที่ระบายน้ำ กทม. ลงพื้นที่เก็บขยะหน้าสถานีสูบน้ำตลอด 24 ชม."
      ]
    },
    {
      programName: "3Plus ทันเหตุการณ์: สรุปภาพรวมสถานการณ์น้ำท่วมและสภาพอากาศรอบ กทม.",
      bullets: [
        "กลุ่มฝนฟ้าคะนองกลุ่มใหญ่เคลื่อนตัวออกจาก กทม. ไปทาง จ.ฉะเชิงเทราและสมุทรปราการแล้ว",
        "ถนนงามวงศ์วานช่วงหน้าเรือนจำคลองเปรม ระดับน้ำลดลงเหลือ 5-8 ซม. รถเก๋งสัญจรได้ทุกช่องทาง",
        "เจ้าหน้าที่เทศบาลยังคงเดินเครื่องสูบน้ำเพื่อพร่องน้ำในท่อระบายน้ำอย่างต่อเนื่อง",
        "เตือนพรุ่งนี้เช้าช่วงเดินทางทำงาน ตรวจสอบสภาพการจราจรและระดับน้ำก่อนออกจากบ้าน"
      ]
    }
  ],
  "news-onwr-national": [
    {
      programName: "แถลงการณ์สถานการณ์น้ำลุ่มเจ้าพระยาและลุ่มป่าสัก 4 เขื่อนหลัก",
      bullets: [
        "ปริมาณน้ำใน 4 เขื่อนหลักลุ่มเจ้าพระยา (ภูมิพล สิริกิติ์ แควน้อย ป่าสัก) รวม 74% ของความจุ",
        "ยังสามารถหน่วงน้ำไว้ตอนบนได้บางส่วนเพื่อลดผลกระทบต่อ กทม. และนนทบุรี",
        "เตือนจังหวัดท้ายเขื่อนเจ้าพระยา 11 จังหวัด รวม กทม. เฝ้าระวังระดับน้ำเพิ่มขึ้น 20-40 ซม.",
        "ประสานกรมป้องกันและบรรเทาสาธารณภัย (ปภ.) ส่งเครื่องสูบน้ำขนาด 12 นิ้ว เสริมจุดเสี่ยง"
      ]
    },
    {
      programName: "สทนช. ประเมินสถานการณ์น้ำทะเลหนุนและมวลน้ำเหนือ ประจำชั่วโมง",
      bullets: [
        "สถานี C.2 นครสวรรค์ ปริมาณน้ำไหลผ่าน 2,240 ลบ.ม./วินาที แนวโน้มทรงตัว",
        "สถานี C.13 เขื่อนเจ้าพระยา ชัยนาท ควบคุมการระบายน้ำที่อัตรา 2,150 ลบ.ม./วินาที",
        "สถานี C.29A บางไทร จ.พระนครศรีอยุธยา มีน้ำไหลผ่านเฉลี่ย 2,120 ลบ.ม./วินาที (เกณฑ์เฝ้าระวัง 2,500)",
        "สทนช. ประสานงาน กทม. และกรมชลประทาน บูรณาการเปิด-ปิดประตูน้ำสัมพันธ์กับจังหวะน้ำทะเลขึ้น-ลง"
      ]
    },
    {
      programName: "ประกาศเตือนภัย สทนช. ฉบับล่าสุด: เฝ้าระวังระดับน้ำในแม่น้ำเจ้าพระยาเพิ่มสูงขึ้น",
      bullets: [
        "แจ้งเตือน 11 จังหวัดลุ่มน้ำเจ้าพระยาและ กทม. ให้เฝ้าระวังพื้นที่ลุ่มต่ำนอกคันกั้นน้ำ",
        "กรมอุทกศาสตร์ กองทัพเรือ คาดการณ์น้ำทะเลหนุนสูงสุดช่วงค่ำ ระดับน้ำแม่น้ำเจ้าพระยาจะสูงแตะ 1.80-1.85 ม.รทก.",
        "กำชับหน่วยงานท้องถิ่นตรวจสอบความมั่นคงของแนวคันดินและกระสอบทรายริมตลิ่ง",
        "ติดตามข้อมูลคาดการณ์แบบเรียลไทม์ได้ทางศูนย์ข้อมูลน้ำแห่งชาติ ThaiWater"
      ]
    },
    {
      programName: "แถลงความคืบหน้าการระบายน้ำออกสู่ทะเล: สรุปมาตรการบริหารจัดการน้ำ 24 ชม.",
      bullets: [
        "การระบายน้ำผ่านแม่น้ำท่าจีนและแม่น้ำบางปะกงช่วยลดภาระแม่น้ำเจ้าพระยาได้วันละ 40 ล้าน ลบ.ม.",
        "กรมชลประทานติดตั้งเครื่องผลักดันน้ำ 20 เครื่อง บริเวณปากคลองลัดโพธิ์ เพื่อเร่งผลักน้ำลงสู่อ่าวไทย",
        "ประเมินสถานการณ์น้ำเหนือในสัปดาห์นี้ยังอยู่ในขอบเขตคันกั้นน้ำถาวรของกรุงเทพมหานคร",
        "ขอความร่วมมือประชาชนริมแม่น้ำเจ้าพระยาติดตามข่าวสารจากทางราชการอย่างใกล้ชิด"
      ]
    }
  ],
  "news-js100-traffic": [
    {
      programName: "LIVE 24 ชม.: สภาพจราจร รายงานน้ำท่วมเรียลไทม์ และประสานงานกู้ภัย",
      bullets: [
        "ถ.งามวงศ์วาน ขาออก ผ่านหน้า กฟภ. ประตู 1 ชะลอตัว เลนซ้ายมีน้ำขัง 10-12 ซม.",
        "ถ.แจ้งวัฒนะ หน้าศูนย์ราชการ รถติดสะสม ท้ายแถวใกล้วงเวียนหลักสี่",
        "ซอยชินเขต 2 แยก 6-8 มีน้ำท่วมขังสูง 18-22 ซม. รถเก๋งโปรดหลีกเลี่ยง",
        "โทรแจ้งเหตุน้ำท่วมและขอความช่วยเหลือรถเสียได้ที่สายด่วน 1137"
      ]
    },
    {
      programName: "จส.100 เรดิโอ ออนไลน์: รายงานจุดน้ำท่วมผิวจราจรและทางเลี่ยง ประจำชั่วโมง",
      bullets: [
        "ถ.วิภาวดีรังสิต ขาออก หน้าสำนักงานใหญ่ ปตท. เลนคู่ขนาน มีน้ำท่วมขัง 10 ซม. รถชะลอตัว",
        "ทางขึ้นทางด่วนงามวงศ์วาน รถติดหนาแน่นเนื่องจากท้ายแถวสะสมจากแยกแคราย",
        "ซอยงามวงศ์วาน 43 (ชินเขต 1) ระดับน้ำท่วมขังเริ่มลดลง 3 ซม. แต่ยังต้องใช้ความระมัดระวัง",
        "ประชาชนแจ้งเหตุกิ่งไม้หักพาดสายไฟซอยประชาชื่น 12 เจ้าหน้าที่ กฟภ. เข้าเคลียร์เรียบร้อยแล้ว"
      ]
    },
    {
      programName: "LIVE จราจรด่วน จส.100: เกาะติดการระบายน้ำและสภาพการจราจรรอบ สนง.ใหญ่ กฟภ.",
      bullets: [
        "ถ.งามวงศ์วาน ขาเข้า หน้า กฟภ. ประตู 2 น้ำแห้งหมดแล้ว การจราจรเคลื่อนตัวได้ดี",
        "ถ.งามวงศ์วาน ขาออก มุ่งหน้าแยกพงษ์เพชร เลนซ้ายยังมีน้ำขัง 8-10 ซม. รถวิ่งเลน 2-3 ได้คล่องตัว",
        "แยกพงษ์เพชร เจ้าหน้าที่ตำรวจจราจรเปิดสัญญาณไฟเขียวระบายรถฝั่งงามวงศ์วานเป็นระยะ",
        "สายด่วน 1137 ประสานรถยกกู้ชีพช่วยเหลือรถยนต์ที่จอดเสียในซอยชินเขต 2 จำนวน 2 คัน"
      ]
    },
    {
      programName: "สรุปการจราจรค่ำ จส.100: เส้นทางหลักเริ่มคลี่คลาย เจ้าหน้าที่เทศบาลยังตรึงกำลังระบายน้ำ",
      bullets: [
        "สภาพการจราจรบนทางด่วนงามวงศ์วานและโทลล์เวย์คล่องตัวขึ้น ปริมาณรถสะสมลดลง",
        "ซอยชินเขต 1-2 ระดับน้ำลดลงต่อเนื่องหลังเครื่องสูบน้ำทำงานเต็มกำลัง",
        "แจ้งเตือนผู้ขับขี่มอเตอร์ไซค์ระวังพื้นผิวถนนลื่นและฝาท่อระบายน้ำที่มองเห็นไม่ชัด",
        "ช่องทางแอป JS100 เปิดโหมดแผนที่แสดงจุดน้ำท่วมแบบเรียลไทม์ให้ตรวจสอบก่อนเดินทาง"
      ]
    }
  ],
  "news-swp91-traffic": [
    {
      programName: "เกาะติดวิกฤตน้ำท่วมเมืองหลวง: สายด่วนช่วยเหลือน้ำท่วม-รถยกฟรี 24 ชม.",
      bullets: [
        "ประสานงานตำรวจจราจร สภ.เมืองนนทบุรี และ สน.ทุ่งสองห้อง อำนวยความสะดวกประชาชน",
        "ทีมอาสากู้ภัยป่อเต็กตึ๊ง-ร่วมกตัญญูเตรียมเรือท้องแบนประจำจุดเสี่ยงริมคลองเปรมประชากร",
        "จุดบริการรถยกฟรีสำหรับรถยนต์ดับหรือติดหล่มน้ำท่วมในเขตงามวงศ์วาน-ประชาชื่น",
        "โทรขอความช่วยเหลือหรือรายงานเหตุด่วนได้ที่ 1644 โทรฟรีตลอด 24 ชม."
      ]
    },
    {
      programName: "สวพ.FM91 สายด่วนช่วยภัยน้ำท่วม: อัปเดตจุดบริการประชาชนและหน่วยกู้ภัยประจำจุด",
      bullets: [
        "จัดรถกระบะยกสูงของมูลนิธิร่วมกตัญญูบริการรับส่งประชาชนปากซอยชินเขต 1-2 เข้าชุมชน",
        "ประสานฝ่ายระบายน้ำเทศบาลนครนนทบุรีนำเครื่องสูบน้ำเสริมซอยงามวงศ์วาน 47",
        "รับแจ้งรถแท็กซี่ดับบริเวณสะพานข้ามแยกพงษ์เพชร อาสากู้ภัยช่วยเข็นเข้าข้างทางเรียบร้อยแล้ว",
        "โทร 1644 ฟรี 24 ชั่วโมง เพื่อสอบถามเส้นทางน้ำท่วมและประสานขอความช่วยเหลือด่วน"
      ]
    },
    {
      programName: "FM91 รายงานสด: สรุปความช่วยเหลือผู้ประสบภัยน้ำท่วมขังและเส้นทางปลอดภัย",
      bullets: [
        "ศูนย์วิทยุ สวพ.FM91 ประสานสายตรวจ สน.ประชาชื่น ช่วยเหลือประชาชนแบตเตอรี่รถหมดช่วงน้ำขัง",
        "แจ้งเตือนผู้ใช้เส้นทางเลียบคลองประปา มีน้ำล้นคันกั้นบางจุด ชะลอความเร็วเพื่อความปลอดภัย",
        "ทีมช่างซ่อมบำรุง กฟภ. สนง.ใหญ่ ตรวจสอบความปลอดภัยระบบไฟส่องสว่างสะพานลอยคนข้าม",
        "แนะนำผู้ใช้รถชะลอความเร็วเมื่อขับผ่านจุดน้ำขัง ป้องกันคลื่นน้ำซัดเข้าบ้านเรือนริมถนน"
      ]
    },
    {
      programName: "สวพ.FM91 สรุปเหตุการณ์รอบเมือง: น้ำลดระดับหลายจุด กู้ภัยยังเฝ้าระวังคืนนี้น้ำหนุน",
      bullets: [
        "ถนนสายหลักเขตจตุจักร หลักสี่ และบางเขน น้ำแห้งแล้วกว่า 90% รถสัญจรได้ปกติ",
        "ยังคงมีน้ำท่วมขังตกค้างในซอยแยกย่อยและพื้นที่ลุ่มต่ำท้ายซอยชินเขตประมาณ 10-15 ซม.",
        "อาสาสมัครกู้ภัยยังคงสแตนด์บายเรือท้องแบนและรถยกพร้อมปฏิบัติการตลอดทั้งคืน",
        "พบเห็นสายไฟฟ้าขาด เสาไฟเอียง หรืออุปกรณ์ไฟฟ้าชำรุดจากน้ำท่วม แจ้งสายด่วน กฟภ. 1129 หรือ 1644"
      ]
    }
  ]
};


