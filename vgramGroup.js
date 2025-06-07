const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const input = require("input");
const fs = require('fs');
require("dotenv").config();

// 🔐 Замените на свои данные
// const apiId = parseInt(process.env.TG_API_ID);
// const apiHash = process.env.TG_API_HASH;


const apiId = 21467664; // Ваш API import {} from ''
const apiHash = "7920513630aa4ddbcee017465e3c65b8"; // Ваш API Hashhj

const stringSession = new StringSession(""); // если сессия есть — вставьте сюда

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("📱 Введите номер телефона: "),
    password: async () => await input.text("🔑 Введите пароль (если есть): "),
    phoneCode: async () => await input.text("📨 Введите код из Telegram: "),
    onError: (err) => console.log(err),
  });

  console.log("✅ Авторизация успешна");
  console.log("💾 Сессия:", client.session.save());

  // 📢 Создание нового канала
  const result = await client.invoke(
    new Api.channels.CreateChannel({
        title: "Fendi",
      about: "",
      megagroup: false, // false = канал
    })
  );

  // 🆔 Получение ID нового канала
  const channel = result.chats[0];

  console.log(`📢 Канал создан: ${channel.title} (ID: ${channel.id})`);

  // 💾 Сохранение информации о канале в файл
  const channelInfo = `Название: ${channel.title}, ID: ${channel.id}\n`;
  fs.appendFileSync('channels_info.txt', channelInfo, 'utf8');
  console.log('✅ Информация о канале сохранена в файл channels_info.txt');

  // ✅ Права админа
  const rights = new Api.ChatAdminRights({
    changeInfo: false,
    postMessages: true,
    editMessages: true,
    deleteMessages: true,
    banUsers: false,
    inviteUsers: true,
    pinMessages: true,
    addAdmins: false,
    anonymous: false,
    manageCall: false,
    other: true,
  });

  // 👥 Usernames ботов
  const botUsernames = [
    "cvpost1_bot",
    "cvpost2_bot",
    "cvpost3_bot",
    "cvpost4_bot",
    "cvpost5_bot",
    "cvpost6_bot",
    "cvpost7_bot",
    "cvpost8_bot",
    "cvpost9_bot",
    "cvpost10_bot",
    "cvpost11_bot",
    "cvpost12_bot",
    "cvpost13_bot",
    "cvpost14_bot",
    "cvpost15_bot",
    "cvpost16_bot",
    "cvpost17_bot",
    "cvpost18_bot",
    "cvpost19_bot",
    "cvpost20_bot",
    "cvpost21_bot",
    "cvpost22_bot",
    "cvpost23_bot",
    "cvpost24_bot",
    "cvpost25_bot",
    "cvpost26_bot",
    "cvpost27_bot",
    "cvpost28_bot",
    "cvpost29_bot",
    "cvpost30_bot",
    "cvpost31_bot",
    "cvpost32_bot",
    "cvpost33_bot",
    "cvpost34_bot",
    "cvpost35_bot",
    "cvpost36_bot",
    "cvpost37_bot", 
    "cvpost38_bot",
    "cvpost39_bot",
    "cvpost40_bot"
    // Добавь сюда остальных
  ];

  // 👮‍♂️ Назначение админов
  for (const username of botUsernames) {
    try {
      const botEntity = await client.getEntity(username);
      await client.invoke(
        new Api.channels.EditAdmin({
          channel: channel,
          userId: botEntity,
          adminRights: rights,
          rank: "Bot",
        })
      );
      console.log(`✅ Назначен админом: ${username}`);
    } catch (e) {
      console.error(`❌ Ошибка для ${username}:`, e.message);
    }
  }

  console.log("🏁 Готово.");
  process.exit(0);
})();
