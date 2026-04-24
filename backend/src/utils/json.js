function extractJsonObject(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;

  const text = String(value).trim();
  try {
    return JSON.parse(text);
  } catch (_err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    try {
      return JSON.parse(match[0]);
    } catch (_innerErr) {
      return fallback;
    }
  }
}

module.exports = {
  extractJsonObject,
};
