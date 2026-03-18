export const CITIES = [
  "Kadapa",
  "Hyderabad",
  "Bangalore",
  "Tirupati",
  "Chennai",
  "Madurai",
  "Coimbatore",
  "Vijayawada",
  "Guntur",
  "Nellore",
  "Kurnool",
  "Warangal",
];

export const PARCEL_CATEGORIES = [
  "Documents",
  "Electronics",
  "Clothing",
  "Food & Groceries",
  "Books",
  "Medicines",
  "Gifts",
  "Fragile Items",
  "Other",
];

export type ParcelStatus =
  | "Posted"
  | "Accepted"
  | "Picked Up"
  | "In Transit"
  | "Near Destination"
  | "Delivered"
  | "Cancelled";

export const STATUS_COLORS: Record<ParcelStatus, string> = {
  Posted: "badge-posted",
  Accepted: "badge-accepted",
  "Picked Up": "badge-pickedup",
  "In Transit": "badge-intransit",
  "Near Destination": "badge-near",
  Delivered: "badge-delivered",
  Cancelled: "badge-cancelled",
};

export const DEMO_ROUTES: Record<string, [number, number][]> = {
  "Kadapa-Hyderabad": [
    [14.4674, 78.8241],
    [14.9167, 78.4],
    [15.1394, 78.8732],
    [15.8281, 78.0373],
    [16.5193, 77.9904],
    [17.385, 78.4867],
  ],
  "Bangalore-Chennai": [
    [12.9716, 77.5946],
    [13.34, 77.87],
    [13.6288, 79.4192],
    [13.0827, 80.2707],
  ],
  "Tirupati-Hyderabad": [
    [13.6288, 79.4192],
    [14.4426, 79.9865],
    [15.4909, 80.0452],
    [17.385, 78.4867],
  ],
  "Chennai-Bangalore": [
    [13.0827, 80.2707],
    [13.6288, 79.4192],
    [13.34, 77.87],
    [12.9716, 77.5946],
  ],
  "Hyderabad-Bangalore": [
    [17.385, 78.4867],
    [16.5193, 77.9904],
    [15.0, 76.5],
    [14.0, 76.0],
    [12.9716, 77.5946],
  ],
};
