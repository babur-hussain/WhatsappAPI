const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leadCount = await prisma.lead.count();
  const messageCount = await prisma.message.count();
  console.log(`Leads: ${leadCount}, Messages: ${messageCount}`);
  
  const allMessages = await prisma.message.findMany();
  console.log("All Messages:", JSON.stringify(allMessages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
