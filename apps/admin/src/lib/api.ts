export const api = {
  getDashboardStats: () => fetch("/api/dashboard/stats").then((r) => r.json()),
  getServices: () => fetch("/api/services").then((r) => r.json()),
  getPlans: () => fetch("/api/plans").then((r) => r.json()),
  getUsageTags: () => fetch("/api/usage-tags").then((r) => r.json()),
  getSimLocationTags: () => fetch("/api/sim-location-tags").then((r) => r.json()),
  getLineReserveTags: () => fetch("/api/line-reserve-tags").then((r) => r.json()),
  getUsers: () => fetch("/api/users").then((r) => r.json()),
  getSims: (params?: URLSearchParams) =>
    fetch(`/api/sims?${params?.toString() || "page=1"}`).then((r) => r.json()),
  getApplications: (params?: URLSearchParams) =>
    fetch(`/api/applications?${params?.toString() || "page=1"}`).then((r) => r.json()),
  getLines: (params?: URLSearchParams) =>
    fetch(`/api/lines?${params?.toString() || "page=1"}`).then((r) => r.json()),
};
