export function calculatePoints(prediction, match) {
  const actualResult = Math.sign(match.homeScore - match.awayScore);
  const predResult = Math.sign(prediction.homeScore - prediction.awayScore);
  if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) return 5;
  if (predResult === actualResult) return 3;
  return 0;
}
