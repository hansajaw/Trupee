export const formatLkr = (amount) =>
  new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0
  }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("si-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString("si-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });