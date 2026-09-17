import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from '../products/products.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { CategoriesService } from '../categories/categories.service.js';

const MAX_VITRIN_ITEMS = 15;

// Ayarlar tablosunda "homepage_content" hic kaydedilmemisse (ilk kurulum)
// kullanilan varsayilan degerler. frontend/lib/homepage-content.ts'teki
// DEFAULT_HOMEPAGE_CONTENT ile birebir ayni tutulmali; admin panelden bir
// kere kaydedildikten sonra ikisi de DB'deki gercek degerleri gosterir.
const DEFAULT_HOMEPAGE_CONTENT = {
  promoBarText: "El Yapımı · Sipariş Üzerine Üretilir · Türkiye'nin Her Yerine Kargo",
  hero: {
    eyebrow: 'El İşi Atölye',
    headingLine1: 'KÜÇÜK DETAYLAR.',
    headingLine2: 'BÜYÜK HİKÂYELER.',
    body: "Her parça elde, sipariş üzerine, özenle üretilir. Türkiye'nin dört bir yanındaki ustaların atölyesinden evinize.",
    ctaLabel: 'ÜRÜNLERİ KEŞFET',
    secondaryCtaLabel: 'HİKÂYEMİZ →',
    heroCategorySlug: 'tasarim-heykeller',
  },
  trustStrip: [
    { title: 'El Yapımı', body: 'Her parça, usta ellerde tek tek şekillendirilir. Seri üretim değil, zanaat.' },
    { title: 'Sipariş Üzerine', body: 'Ürünler stoklamak için değil, siparişinize özel, özenle hazırlanır.' },
    { title: 'Özenle Paketlenir', body: 'Her sipariş, kırılmaya karşı özenle sarılıp elinize zarar görmeden ulaşır.' },
  ],
  categoryRows: [
    { slug: 'seramik', label: 'Seramik' },
    { slug: 'cam-sanati', label: 'Cam Sanatı' },
    { slug: 'biblolar', label: 'Biblolar' },
  ],
  editorialSplits: [
    {
      eyebrow: 'Zanaat',
      heading: 'Ahşabın Sıcaklığı, Elin İzi',
      body: 'Zeytin, ceviz ve meşe ağacından doğan her obje, ustaların yıllara dayanan tecrübesiyle tek tek şekillendirilir. Seri üretim değil; sabırla, elle işlenmiş bir zanaat.',
      categorySlug: 'ahsap-objeler',
      categoryLabel: 'Ahşap Objeler',
    },
    {
      eyebrow: 'Doku',
      heading: 'İplikten Doğan Hikâyeler',
      body: 'Makrome düğümlerinden dokuma yüzeylere, her tekstil parçası elde, sabırla işlenir. Doğal lifler ve toprak tonlarıyla evinize sıcak bir doku katar.',
      categorySlug: 'el-yapimi-tekstil',
      categoryLabel: 'El Yapımı Tekstil',
    },
  ],
};

type Category = { id: string; name: string; slug: string; description: string | null };

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly reviews: ReviewsService,
    private readonly categories: CategoriesService,
  ) {}

  // Ana sayfanin ihtiyac duydugu her seyi (icerik + satirlardaki urunler +
  // puan ozetleri + vitrin) tarayicidan tek tek istemek yerine tek istekte
  // toplar; boylece frontend'te sunucu tarafinda (RSC) tek fetch ile urunler
  // ilk HTML'de hazir gelir, ayrica kategori satirlari arasinda paylasilan
  // sorgular (kategori listesi, puan ozetleri) burada paralel calisir.
  async getHome() {
    const [settingRow, categoryList] = await Promise.all([
      this.prisma.setting.findUnique({ where: { key: 'homepage_content' } }),
      this.categories.findAll(),
    ]);
    const content = (settingRow?.value as typeof DEFAULT_HOMEPAGE_CONTENT | undefined) ?? DEFAULT_HOMEPAGE_CONTENT;

    const [rowEntries, splitEntries, hero, vitrin] = await Promise.all([
      Promise.all(
        content.categoryRows.map(async (c) => {
          const data = await this.products.findAll({ category: c.slug, pageSize: 4 } as any);
          const ids = data.items.map((p: { id: string }) => p.id);
          const ratings = ids.length ? await this.reviews.summaryForProducts(ids) : {};
          return [c.slug, data, ratings] as const;
        }),
      ),
      Promise.all(
        content.editorialSplits.map(async (s) => {
          const data = await this.products.findAll({ category: s.categorySlug, pageSize: 1 } as any);
          return [s.categorySlug, data] as const;
        }),
      ),
      this.products.findAll({ category: content.hero.heroCategorySlug, pageSize: 1 } as any),
      this.getVitrin(categoryList),
    ]);

    const rows: Record<string, unknown> = {};
    const rowRatings: Record<string, unknown> = {};
    for (const [slug, data, ratings] of rowEntries) {
      rows[slug] = data;
      rowRatings[slug] = ratings;
    }
    const splitProducts: Record<string, unknown> = {};
    for (const [slug, data] of splitEntries) splitProducts[slug] = data;

    return { content, rows, rowRatings, splitProducts, hero, vitrin };
  }

  private async getVitrin(categoryList: Category[]) {
    const shuffled = [...categoryList].sort(() => Math.random() - 0.5);
    for (const category of shuffled) {
      const data = await this.products.findAll({ category: category.slug, pageSize: MAX_VITRIN_ITEMS } as any);
      if (data.items.length > 0) {
        const ids = data.items.map((p: { id: string }) => p.id);
        const ratings = await this.reviews.summaryForProducts(ids);
        return { category, items: data.items, ratings };
      }
    }
    return { category: null, items: [], ratings: {} };
  }
}
