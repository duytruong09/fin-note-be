import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // System categories for expenses
  const expenseCategories = [
    {
      name: "Food",
      nameVi: "Ăn uống",
      nameEn: "Food",
      icon: "🍔",
      color: "#FF6B6B",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Transport",
      nameVi: "Di chuyển",
      nameEn: "Transport",
      icon: "🚗",
      color: "#4ECDC4",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Shopping",
      nameVi: "Mua sắm",
      nameEn: "Shopping",
      icon: "🛍️",
      color: "#45B7D1",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Entertainment",
      nameVi: "Giải trí",
      nameEn: "Entertainment",
      icon: "🎬",
      color: "#96CEB4",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Health",
      nameVi: "Sức khỏe",
      nameEn: "Health",
      icon: "💊",
      color: "#FFA07A",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Education",
      nameVi: "Giáo dục",
      nameEn: "Education",
      icon: "📚",
      color: "#DDA15E",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Bills",
      nameVi: "Hóa đơn",
      nameEn: "Bills",
      icon: "💡",
      color: "#BC6C25",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Personal Care",
      nameVi: "Chăm sóc cá nhân",
      nameEn: "Personal Care",
      icon: "💇",
      color: "#E9C46A",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Gifts",
      nameVi: "Quà tặng",
      nameEn: "Gifts",
      icon: "🎁",
      color: "#F4A261",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
    {
      name: "Other",
      nameVi: "Khác",
      nameEn: "Other",
      icon: "📦",
      color: "#8D99AE",
      type: TransactionType.EXPENSE,
      isSystem: true,
    },
  ];

  // System categories for income
  const incomeCategories = [
    {
      name: "Salary",
      nameVi: "Lương",
      nameEn: "Salary",
      icon: "💰",
      color: "#06D6A0",
      type: TransactionType.INCOME,
      isSystem: true,
    },
    {
      name: "Freelance",
      nameVi: "Làm thêm",
      nameEn: "Freelance",
      icon: "💼",
      color: "#118AB2",
      type: TransactionType.INCOME,
      isSystem: true,
    },
    {
      name: "Investment",
      nameVi: "Đầu tư",
      nameEn: "Investment",
      icon: "📈",
      color: "#073B4C",
      type: TransactionType.INCOME,
      isSystem: true,
    },
    {
      name: "Gift Received",
      nameVi: "Quà tặng",
      nameEn: "Gift Received",
      icon: "🎁",
      color: "#EF476F",
      type: TransactionType.INCOME,
      isSystem: true,
    },
    {
      name: "Other Income",
      nameVi: "Thu nhập khác",
      nameEn: "Other Income",
      icon: "💵",
      color: "#FFD166",
      type: TransactionType.INCOME,
      isSystem: true,
    },
  ];

  // Upsert categories
  for (const category of [...expenseCategories, ...incomeCategories]) {
    await prisma.category.upsert({
      where: {
        // Use a composite unique key or just name if unique
        id: category.name.toLowerCase().replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: category.name.toLowerCase().replace(/\s+/g, "-"),
        ...category,
      },
    });
  }

  console.log(`✅ Created ${expenseCategories.length} expense categories`);
  console.log(`✅ Created ${incomeCategories.length} income categories`);

  // Default system settings
  const defaultSettings = [
    {
      key: "telegram_bot_token",
      value: "",
      description: "Telegram Bot API Token from @BotFather",
      isSecret: true,
      isPublic: false,
    },
    {
      key: "telegram_enabled",
      value: "true",
      description: "Enable/disable Telegram bot integration",
      isSecret: false,
      isPublic: false,
    },
    {
      key: "feature_voice_enabled",
      value: "true",
      description: "Enable/disable voice input feature",
      isSecret: false,
      isPublic: true,
    },
    {
      key: "app_version",
      value: "1.0.0",
      description: "Current app version",
      isSecret: false,
      isPublic: true,
    },
  ];

  // Upsert settings
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        description: setting.description,
        isSecret: setting.isSecret,
        isPublic: setting.isPublic,
        // Only update value if not empty
        ...(setting.value && { value: setting.value }),
      },
      create: setting,
    });
  }

  console.log(`✅ Created ${defaultSettings.length} default settings`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
