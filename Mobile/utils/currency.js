import i18n from "../i18n"; 

const partsFor = (locale = i18n.locale) => {
  if ((locale || "").startsWith("si")) return { locale: "si-LK", symbol: "රු" };
  return { locale: "en-LK", symbol: "LKR" };
};

export const formatCurrency = (value, locale = i18n.locale) => {
  const { locale: nfLocale, symbol } = partsFor(locale);
  const n = Number(value || 0);

  try {
    return new Intl.NumberFormat(nfLocale, {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    try {
      return `${symbol} ${n.toLocaleString(nfLocale.split("-")[0])}`;
    } catch {
      return `${symbol} ${n.toLocaleString()}`;
    }
  }
};

export const currencySymbol = (locale = i18n.locale) => partsFor(locale).symbol;
