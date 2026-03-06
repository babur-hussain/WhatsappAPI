import { PrismaClient } from '@prisma/client';
import { encrypt } from './src/utils/crypto.util';

const prisma = new PrismaClient();

async function main() {
  const token = 'EAA9IVbmSxdkBQ11m1Uq9vslrntc8cxmwQfLucTjbDSFZAh36EdEeeQ1ULnCH8YHiSgNpD2oVCW68D7730nZByB1Qf0tuyEZC59H0H0HcIzZCiNpg7bsPw5pgtvVQPce2UFOaww1NkbktouUOh25X1xaeV2kxkqlCCCZCdTDP87p0hbELA4RgcZADyXrixFaHoBTEe9qqTv1KMyVvdM0aT0a8neFc8jxSOQphjnIn23yqAulVowkCwO2eqmbnGKuqZAXfVOAozSdeCfoOUmcE5nQSdlw';
  const phoneId = '1039620762564774';
  
  const factory = await prisma.factory.findFirst({
    where: { whatsappPhoneNumberId: phoneId }
  });

  if (!factory) {
    console.log(`Factory with phone ID ${phoneId} not found.`);
    return;
  }

  const encrypted = encrypt(token);
  console.log(`Successfully encrypted token. Length: ${encrypted.length}`);

  await prisma.factory.update({
    where: { id: factory.id },
    data: { whatsappAccessToken: encrypted }
  });

  console.log(`Factory ${factory.name} updated with new encrypted token!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
