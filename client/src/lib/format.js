export function formatMoney(currency, amount) {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function overdueAgingLabel(status, daysOverdue) {
  if (status === "paid") return "Paid";
  if (!daysOverdue || daysOverdue <= 0) return "Not overdue";
  if (daysOverdue === 1) return "1 day overdue";
  if (daysOverdue < 7) return `${daysOverdue} days overdue`;
  if (daysOverdue < 14) return "1 week overdue";
  const weeks = Math.floor(daysOverdue / 7);
  if (weeks === 1) return "1 week overdue";
  if (daysOverdue < 30) return `${weeks} weeks overdue`;
  const months = Math.floor(daysOverdue / 30);
  if (months === 1) return "1 month overdue";
  return `${months} months overdue`;
}

export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const week = Math.round(day / 7);
  if (week < 5) return `${week} week${week === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
