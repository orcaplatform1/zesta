import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@zesta.tr';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.log('SEED_ADMIN_PASSWORD tanımlı değil — admin kullanıcı atlanıyor.');
  } else {
    const existing = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.adminUser.create({
        data: {
          email: adminEmail,
          passwordHash: await argon2.hash(adminPassword),
          name: 'Zesta Admin',
          role: 'SUPER_ADMIN',
        },
      });
      console.log(`Admin kullanıcı oluşturuldu: ${adminEmail}`);
    } else {
      console.log(`Admin kullanıcı zaten var: ${adminEmail}`);
    }
  }

  const pages = [
    { slug: 'hakkimizda', title: 'Hakkımızda', content: '' },
    { slug: 'iletisim', title: 'İletişim', content: '' },
    { slug: 'kargo-teslimat', title: 'Kargo & Teslimat', content: '' },
    { slug: 'iade-degisim', title: 'İade & Değişim', content: '' },
    { slug: 'gizlilik-kvkk', title: 'Gizlilik / KVKK / Kullanım Koşulları', content: '' },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log('Statik sayfa taslakları hazır.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
