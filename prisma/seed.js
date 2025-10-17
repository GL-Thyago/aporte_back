// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admExistente = await prisma.f1_colaborador.findFirst({
    where: { f1_cargo: "ADM" },
  });

  if (admExistente) {
    console.log('⚠️ Já existe um colaborador ADM, nenhum novo registro foi criado.');
    return;
  }

  await prisma.f1_colaborador.create({
    data: {
      f1_nome: "ADM",
      f1_cargo: "ADM",
      f1_caixa: 0,
    },
  });

  console.log('✅ Seed executado com sucesso! ADM criado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
