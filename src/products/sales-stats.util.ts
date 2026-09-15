// Frontend'deki lib/sales-stats.ts ile BİREBİR aynı deterministik formül —
// "En Çok Satılan" rozetinin sıralaması, ürün sayfasında zaten gösterilen
// "Toplam X satıldı" simüle sayısıyla tutarlı olsun diye burada da birebir
// tekrarlanıyor (gerçek sipariş verisi yok, iki taraf birbirinden sapmasın).
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function computeSoldTotal(productId: string, createdAt: Date): number {
  const baseSeed = hashString(productId);
  const baseRandom = mulberry32(baseSeed);
  const baseline = 8 + Math.floor(baseRandom() * 67); // 8-74

  const weeksElapsed = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  let soldTotal = baseline;
  for (let w = 0; w < weeksElapsed; w++) {
    const weekRandom = mulberry32(baseSeed + w * 7919 + 1);
    soldTotal += 2 + Math.floor(weekRandom() * 6); // 2-7 per elapsed week
  }
  return soldTotal;
}
