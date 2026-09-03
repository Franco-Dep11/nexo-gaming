export function normalizeCategory(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const categoryAliases = {
  processor: ["procesador", "procesadores", "cpu"],
  motherboard: ["placa madre", "placas madre", "motherboard", "motherboards"],
  cooling: ["cooler y ventilacion", "coolers", "cooler", "refrigeracion"],
  ram: ["memoria ram", "memorias ram", "ram"],
  gpu: ["tarjeta de video", "tarjetas de video", "placa de video", "gpu"],
  storage: ["almacenamiento", "discos", "ssd", "disco rigido"],
  "power-supply": ["fuente de alimentacion", "fuentes", "fuente"],
  case: ["gabinete", "gabinetes"],
  monitor: ["monitor", "monitores"],
  peripherals: ["perifericos", "periferico"],
};

export function getCategoryType(category) {
  const normalizedCategory = normalizeCategory(category);

  return Object.entries(categoryAliases).find(([, aliases]) =>
    aliases.includes(normalizedCategory)
  )?.[0] || null;
}

export const specificationFields = {
  processor: [
    { key: "socket", label: "Socket", placeholder: "Ej.: AM5" },
    { key: "potenciaTdpWatts", label: "Potencia TDP", suffix: "W", type: "number" },
  ],
  motherboard: [
    { key: "socket", label: "Socket", placeholder: "Ej.: AM5" },
    { key: "tipoRam", label: "Tipo de RAM", options: ["DDR4", "DDR5"] },
    { key: "formato", label: "Formato", options: ["ATX", "Micro-ATX", "Mini-ITX"] },
  ],
  ram: [
    { key: "tipoRam", label: "Tipo de RAM", options: ["DDR4", "DDR5"] },
    { key: "capacidadGb", label: "Capacidad", suffix: "GB", type: "number" },
    { key: "frecuenciaMhz", label: "Frecuencia", suffix: "MHz", type: "number" },
  ],
  cooling: [
    {
      key: "socketsCompatibles",
      label: "Sockets compatibles",
      placeholder: "Ej.: AM4, AM5, LGA1700",
      multiple: true,
    },
  ],
  gpu: [
    { key: "longitudMm", label: "Longitud", suffix: "mm", type: "number" },
    {
      key: "fuenteRecomendadaWatts",
      label: "Fuente recomendada",
      suffix: "W",
      type: "number",
    },
  ],
  "power-supply": [
    { key: "potenciaWatts", label: "Potencia", suffix: "W", type: "number" },
  ],
  case: [
    {
      key: "formatosCompatibles",
      label: "Formatos compatibles",
      options: ["ATX", "Micro-ATX", "Mini-ITX"],
      multiple: true,
    },
    { key: "longitudMaxGpuMm", label: "Longitud máxima de GPU", suffix: "mm", type: "number" },
  ],
  storage: [
    {
      key: "tipoAlmacenamiento",
      label: "Tipo de almacenamiento",
      options: ["SATA", "M.2 NVMe", "M.2 SATA"],
    },
  ],
};

export function normalizeSpecifications(specifications) {
  return specifications && typeof specifications === "object" && !Array.isArray(specifications)
    ? specifications
    : {};
}

function comparableText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasNumber(value) {
  return value !== "" && value !== null && value !== undefined && !Number.isNaN(Number(value));
}

const compatibilityRules = [
  {
    first: "processor",
    second: "motherboard",
    fields: [["socket"], ["socket"]],
    test: (processor, motherboard) =>
      comparableText(processor.socket) === comparableText(motherboard.socket),
    message: "El procesador y la placa madre usan sockets diferentes.",
  },
  {
    first: "motherboard",
    second: "ram",
    fields: [["tipoRam"], ["tipoRam"]],
    test: (motherboard, ram) =>
      comparableText(motherboard.tipoRam) === comparableText(ram.tipoRam),
    message: "La placa madre y la memoria RAM usan tecnologías diferentes.",
  },
  {
    first: "processor",
    second: "cooling",
    fields: [["socket"], ["socketsCompatibles"]],
    test: (processor, cooling) =>
      cooling.socketsCompatibles.some(
        (socket) => comparableText(socket) === comparableText(processor.socket)
      ),
    message: "El cooler no incluye el socket del procesador.",
  },
  {
    first: "gpu",
    second: "power-supply",
    fields: [["fuenteRecomendadaWatts"], ["potenciaWatts"]],
    numeric: true,
    test: (gpu, powerSupply) =>
      Number(powerSupply.potenciaWatts) >= Number(gpu.fuenteRecomendadaWatts),
    message: "La fuente no alcanza la potencia recomendada por la tarjeta de video.",
  },
  {
    first: "motherboard",
    second: "case",
    fields: [["formato"], ["formatosCompatibles"]],
    test: (motherboard, computerCase) =>
      computerCase.formatosCompatibles.some(
        (format) => comparableText(format) === comparableText(motherboard.formato)
      ),
    message: "El gabinete no admite el formato de la placa madre.",
  },
  {
    first: "gpu",
    second: "case",
    fields: [["longitudMm"], ["longitudMaxGpuMm"]],
    numeric: true,
    test: (gpu, computerCase) =>
      Number(gpu.longitudMm) <= Number(computerCase.longitudMaxGpuMm),
    message: "La tarjeta de video es demasiado larga para el gabinete.",
  },
];

function hasRequiredFields(specifications, fields, numeric) {
  return fields.every((field) => {
    const value = specifications[field];
    if (Array.isArray(value)) return value.length > 0;
    return numeric ? hasNumber(value) : comparableText(value) !== "";
  });
}

export function getCompatibility(product, stepId, selections) {
  if (["storage", "monitor", "peripherals"].includes(stepId)) {
    return { status: "compatible", label: "Compatible" };
  }

  const candidateSpecifications = normalizeSpecifications(product.specifications);
  const relatedRules = compatibilityRules.filter(
    (rule) => rule.first === stepId || rule.second === stepId
  );
  let comparisons = 0;
  let hasMissingData = false;

  for (const rule of relatedRules) {
    const candidateIsFirst = rule.first === stepId;
    const otherStepId = candidateIsFirst ? rule.second : rule.first;
    const otherProduct = selections[otherStepId];

    if (!otherProduct) continue;

    comparisons += 1;
    const otherSpecifications = normalizeSpecifications(otherProduct.specifications);
    const firstSpecifications = candidateIsFirst
      ? candidateSpecifications
      : otherSpecifications;
    const secondSpecifications = candidateIsFirst
      ? otherSpecifications
      : candidateSpecifications;

    if (
      !hasRequiredFields(firstSpecifications, rule.fields[0], rule.numeric) ||
      !hasRequiredFields(secondSpecifications, rule.fields[1], rule.numeric)
    ) {
      hasMissingData = true;
      continue;
    }

    if (!rule.test(firstSpecifications, secondSpecifications)) {
      return { status: "incompatible", label: "No compatible", message: rule.message };
    }
  }

  if (comparisons === 0 || hasMissingData) {
    return {
      status: "unknown",
      label: "Faltan datos técnicos · Compatibilidad no verificada",
      message: "Compatibilidad no verificada",
    };
  }

  return { status: "compatible", label: "Compatible" };
}

export function getAssemblyWarnings(selections) {
  return compatibilityRules.flatMap((rule) => {
    const firstProduct = selections[rule.first];
    const secondProduct = selections[rule.second];
    if (!firstProduct || !secondProduct) return [];

    const firstSpecifications = normalizeSpecifications(firstProduct.specifications);
    const secondSpecifications = normalizeSpecifications(secondProduct.specifications);

    if (
      !hasRequiredFields(firstSpecifications, rule.fields[0], rule.numeric) ||
      !hasRequiredFields(secondSpecifications, rule.fields[1], rule.numeric) ||
      rule.test(firstSpecifications, secondSpecifications)
    ) {
      return [];
    }

    return [{ first: rule.first, second: rule.second, message: rule.message }];
  });
}
