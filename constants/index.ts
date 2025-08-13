import type { Database } from "~/types/database.types";

export const headerLabels = {
  result: "Sonuç",
  photo_url: "Fotoğraf",
  note: "Not",
  body: "Gövde",
  control_card: "Kontrol kartı",
  hoze_and_nozzle: "Hortum ve memesi",
  instruction_and_label: "Talimat ve etiket",
  mass: "Kütle",
  pin_and_seal: "Pim ve mühür",
  pressure: "Basınç",
  position: "Pozisyon",
  unit: "Ağırlık",
  working_mechanism: "Çalışma mekanizması",
  model_type: "Modeli / tipi",
  refill_date: "Dolum tarihi",
  next_refill_date: "Yeniden dolum tarihi",
  location: "Bulduğu yer",
  building_area: "Bulduğu bina/alan",
  location_id: "YSC no",
  serial_number: "Seri no",
  brand: "Markası",
  date: "Tarih",
  manufacture_year: "Üretim tarihi",
  refill_period: "Yeniden dolum periyodu",
  hydrostatic_test_date: "Hidrostatik test tarihi",
  next_hydrostatic_test_date: "Sonraki hidrostatik test tarihi",
  current_status: "Durum",
  pressure_source: "Basınç kaynağı",
  monometer_scale_bar: "Manometre skala büyüklüğü",
  test_pressure_bar: "Test basıncı",
  safety_valve_setting_pressure_bar: "Emniyet valfi ayar basıncı",
  working_pressure_bar: "Çalışma basıncı",
  working_temperature_celsius: "Çalışma sıcaklığı",
  manometer_scale_bar: "Monometre skala buyuklugu(Bar)",
  transaction_date: "İşlem tarihi",
  user_id: "Kullanıcı Adi",
  product_id: "Ürün ID",
  details: "Detaylar",
  type: "İşem Tipi",
};

export const fillLabels = {
  filling: "Dolum İşlemi",
  trigger_valve: "Tetik / Vana",
  manometer: "Manometre",
  hose_and_nozzle: "Hortum / Lans",
  wheel: "Tekerlek",
  paint: "Yaş Boya",
  hydrostatic_pressure_test: "Hidrostatik Basınç Testi",
};
export const customCellFields = [
  "products.refill_date",
  "products.next_refill_date",
  "result",
  "working_mechanism",
  "pressure",
  "position",
  "pin_and_seal",
  "mass",
  "instruction_and_label",
  "hose_and_nozzle",
  "control_card",
  "body",
  "created_at",
  "filling",
  "trigger_valve",
  "manometer",
  "wheel",
  "paint",
  "hydrostatic_pressure_test",
  "photo_url",
  "type",
  "current_status",
  "manufacture_year",
  "refill_date",
  "next_refill_date",
  "hydrostatic_test_date",
  "next_hydrostatic_test_date",
];

export const fireExtinguishers = [
  {
    name: "Kuru Kimyevi Tozlu",
    value: "kkt",
    weightOptions: ["1 KG", "2 KG", "6 KG", "12 KG", "25 KG", "50 KG"],
    tecnicDetails: {
      pressure_source: "Azot(N)",
      manometer_scale_bar: "28",
      test_pressure_bar: "27",
      safety_valve_setting_pressure_bar: "24 - 27",
      working_pressure_bar: "17 - 18",
      working_temperature_celsius: "-30 / +60",
    },
  },
  {
    name: "Karbondioksit gazli",
    value: "co2",
    weightOptions: ["5 KG", "10 KG", "30 KG"],
    tecnicDetails: {
      pressure_source: "Karbondioksit(CO2)",
      manometer_scale_bar: null,
      test_pressure_bar: "250",
      safety_valve_setting_pressure_bar: "190",
      working_pressure_bar: "150",
      working_temperature_celsius: "-30 / +60",
    },
  },
  {
    name: "Bioversal köpüklü",
    value: "bio",
    weightOptions: ["2 LT", "6 LT", "9 LT", "25 LT", "50 LT"],
    tecnicDetails: {
      pressure_source: "Azot(N)",
      manometer_scale_bar: "28",
      test_pressure_bar: "27",
      safety_valve_setting_pressure_bar: "24 - 27",
      working_pressure_bar: "17 - 18",
      working_temperature_celsius: "-20 / +60",
    },
  },
];

export const imageCompressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

export const transactionTypeLabels: {
  [key in Database["public"]["Enums"]["transaction_types"]]: string;
} = {
  fill: "Dolum",
  inspection: "Bakım",
  change: "Degisim",
  other: "Diğer",
};

export const productStatusTypeLabels: {
  [key in Database["public"]["Enums"]["product_status"]]: string;
} = {
  active: "Aktif",
  damaged: "Hasarlı",
  lost: "Kayıp",
  spare: "Yedek",
};
export const inspectionFormFields = [
	{ key: 'position', label: headerLabels.position },
	{ key: 'body', label: headerLabels.body },
	{ key: 'control_card', label: headerLabels.control_card },
	{ key: 'hose_and_nozzle', label: headerLabels.hoze_and_nozzle },
	{ key: 'instruction_and_label', label: headerLabels.instruction_and_label },
	{ key: 'mass', label: headerLabels.mass },
	{ key: 'pin_and_seal', label: headerLabels.pin_and_seal },
	{ key: 'pressure', label: headerLabels.pressure },
	{ key: 'working_mechanism', label: headerLabels.working_mechanism },
];

export const fillFormFields = [
	{ key: 'filling', label: fillLabels.filling },
	{ key: 'trigger_valve', label: fillLabels.trigger_valve },
	{ key: 'manometer', label: fillLabels.manometer },
	{ key: 'hose_and_nozzle', label: fillLabels.hose_and_nozzle },
	{ key: 'wheel', label: fillLabels.wheel },
	{ key: 'paint', label: fillLabels.paint },
	{ key: 'hydrostatic_pressure_test', label: fillLabels.hydrostatic_pressure_test },
];
