function smartEqual(a: unknown, b: unknown) {
  const normalize = (value: unknown): unknown => {
    if (typeof value === "string") {
      try {
        return normalize(JSON.parse(value));
      } catch {
        return value;
      }
    }

    if (Array.isArray(value)) {
      return value.map(normalize);
    }

    return value;
  };

  return isDeepEqual(normalize(a), normalize(b));
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((value, i) => isDeepEqual(value, b[i]))
    );
  }

  return false;
}

export { smartEqual }