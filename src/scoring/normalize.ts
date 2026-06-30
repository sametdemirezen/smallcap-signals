// Winsorized z-score: (x - mean) / std, clipped to ±limit.
// Missing values (null) -> 0 (neutral): missing data is not a penalty.
// This is the SHARED normalizer every factor uses to answer "relative to peers?".
export function zScores(values: (number | null)[], limit = 3): number[] {
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return values.map(() => 0);

  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  const variance =
    present.reduce((a, b) => a + (b - mean) ** 2, 0) / present.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 0);

  return values.map((v) => {
    if (v == null) return 0;
    const z = (v - mean) / std;
    return Math.max(-limit, Math.min(limit, z)); // winsorize
  });
}
