export const CATEGORIES = [
  "Tractor & Ploughing",
  "Harvesting",
  "Spraying",
  "Irrigation",
  "Labour",
  "Transport",
  "Soil Testing",
];

export const UNITS = ["per hour", "per acre", "per day", "per trip"];

// "per acre" -> "acres"
export function quantityLabel(unit) {
  return { "per hour": "Hours", "per acre": "Acres", "per day": "Days", "per trip": "Trips" }[unit] || "Quantity";
}

export const rupees = (n) => "₹" + Number(n).toLocaleString("en-IN");
