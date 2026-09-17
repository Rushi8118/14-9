import 'flag-icons/css/flag-icons.min.css'

const COUNTRY_CODES: Record<string, string> = {
  // Names
  "Japan": "jp",
  "Australia": "au",
  "Canada": "ca",
  "United Kingdom": "gb",
  "United States": "us",
  "USA": "us",
  "UK": "gb",
  "Germany": "de",
  "France": "fr",
  "New Zealand": "nz",
  "Russia": "ru",
  "India": "in",
  "Ireland": "ie",
  "Netherlands": "nl",
  "Switzerland": "ch",
  "Denmark": "dk",
  "Sweden": "se",
  "Norway": "no",
  "Finland": "fi",
  "Spain": "es",
  "Portugal": "pt",
  "Malta": "mt",
  "Poland": "pl",
  "Austria": "at",
  "Croatia": "hr",
  "Greece": "gr",
  "Romania": "ro",
  "Slovakia": "sk",
  "Hungary": "hu",
  "Singapore": "sg",
  "Malaysia": "my",
  "Maldives": "mv",
  "Kazakhstan": "kz",
  "Saudi Arabia": "sa",
  "Qatar": "qa",
  "UAE": "ae",
  "Dubai": "ae",
  "United Arab Emirates": "ae",
  "Israel": "il",
  "Italy": "it",
  "Albania": "al",
  "Armenia": "am",
  "Belarus": "by",
  "Moldova": "md",
  "Azerbaijan": "az",
  "China": "cn",
  "South Korea": "kr",
  "Brazil": "br",
  "Mexico": "mx",
  "South Africa": "za",

  // 3-Letter ISO Codes
  "JPN": "jp",
  "AUS": "au",
  "CAN": "ca",
  "GBR": "gb",
  "DEU": "de",
  "FRA": "fr",
  "NZL": "nz",
  "RUS": "ru",
  "IND": "in",
  "IRL": "ie",
  "NLD": "nl",
  "CHE": "ch",
  "DNK": "dk",
  "SWE": "se",
  "NOR": "no",
  "FIN": "fi",
  "ESP": "es",
  "PRT": "pt",
  "MLT": "mt",
  "POL": "pl",
  "AUT": "at",
  "HRV": "hr",
  "GRC": "gr",
  "ROU": "ro",
  "SVK": "sk",
  "HUN": "hu",
  "SGP": "sg",
  "MYS": "my",
  "MDV": "mv",
  "KAZ": "kz",
  "SAU": "sa",
  "QAT": "qa",
  "ARE": "ae",
  "ISR": "il",
  "ITA": "it",
  "ALB": "al",
  "ARM": "am",
  "BLR": "by",
  "MDA": "md",
  "AZE": "az",
  "CHN": "cn",
  "KOR": "kr",
  "BRA": "br",
  "MEX": "mx",
  "ZAF": "za",

  // 2-Letter ISO Codes (uppercase)
  "JP": "jp",
  "AU": "au",
  "CA": "ca",
  "GB": "gb",
  "DE": "de",
  "FR": "fr",
  "NZ": "nz",
  "RU": "ru",
  "IN": "in",
  "IE": "ie",
  "NL": "nl",
  "CH": "ch",
  "DK": "dk",
  "SE": "se",
  "NO": "no",
  "FI": "fi",
  "ES": "es",
  "PT": "pt",
  "MT": "mt",
  "PL": "pl",
  "AT": "at",
  "HR": "hr",
  "GR": "gr",
  "RO": "ro",
  "SK": "sk",
  "HU": "hu",
  "SG": "sg",
  "MY": "my",
  "MV": "mv",
  "KZ": "kz",
  "SA": "sa",
  "QA": "qa",
  "AE": "ae",
  "IL": "il",
  "IT": "it",
  "AL": "al",
  "AM": "am",
  "BY": "by",
  "MD": "md",
  "AZ": "az",
  "CN": "cn",
  "KR": "kr",
  "BR": "br",
  "MX": "mx",
  "ZA": "za",
  "US": "us",
}

/**
 * Returns the lowercase ISO 3166-1 alpha-2 code for a country name or 3-letter code.
 * Used by the flag-icons CSS library which expects lowercase codes.
 */
let lowerCaseCodeMap: Map<string, string> | null = null
function lowerCaseCodes() {
  if (!lowerCaseCodeMap) {
    lowerCaseCodeMap = new Map(Object.entries(COUNTRY_CODES).map(([k, v]) => [k.toLowerCase(), v]))
  }
  return lowerCaseCodeMap
}

export function countryNameToCode(name: string): string | undefined {
  if (!name) return undefined
  const key = name.trim()
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key]
  // Case-insensitive lookup through a map built once (this runs for every flag on screen).
  const found = lowerCaseCodes().get(key.toLowerCase())
  return found ?? (key.length === 2 ? key.toLowerCase() : undefined)
}

/**
 * Returns flag emoji (still used in some contexts like mobile/fallback).
 * NOTE: Windows does not render flag emoji — use FlagIcon component instead.
 */
export function getFlagEmoji(countryCode: string): string {
  const code = (countryNameToCode(countryCode) || countryCode).toUpperCase()
  if (code.length !== 2) return "🏳️"
  const first = code.charCodeAt(0) + 127397
  const second = code.charCodeAt(1) + 127397
  if (first < 0x1f1e6 || first > 0x1f1ff || second < 0x1f1e6 || second > 0x1f1ff) return "🏳️"
  return String.fromCodePoint(first, second)
}

/**
 * @deprecated Use FlagIcon component instead for cross-platform flag display.
 */
export function countryNameToFlag(name: string): string {
  const code = countryNameToCode(name)
  if (!code) return "🏳️"
  return getFlagEmoji(code)
}
