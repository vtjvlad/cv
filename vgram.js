const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const input = require("input"); // npm install input
const { botUsernames, rights } = require("./botsIds"); // Импортируем массив usernames и права админа
require("dotenv").config(); // Подключаем dotenv для работы с переменными окружения
const apiId = parseInt(process.env.TG_API_ID); // Ваш api_id из .env
const apiHash = process.env.TG_API_HASH; // Ваш api_hash из .env — убедитесь, что он корректный
const stringSession = new StringSession(""); // Оставь пустым — будет авторизация

(async () => {
  console.log("⚙️ Запуск клиента...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Введите номер телефона: "),
    password: async () => await input.text("Введите пароль (если есть): "),
    phoneCode: async () => await input.text("Введите код из Telegram: "),
    onError: (err) => console.log(err),
  });

  console.log("✅ Авторизация завершена");
  console.log("🔐 StringSession:", client.session.save());

  const channel = await client.getEntity("-1002663136097");

  // Список Telegram user ID ботов, которых нужно сделать администраторами
  // const botIds = [
  //       7257688804,
  //       7257688804,
  //       7829123830,
  //       7829123830,
  //       7550848039,
  //       7452746477,
  //       7914845816,
  //       7902024999,
  //       7237978674,
  //       7572822687,
  //       7937730457,
  //       7397948790,
  //       7480072176,
  //       7415074085,
  //       7779053478,
  //       7909597355,
  //       8015366004,
  //       7791463840,
  //       8176820074,
  //       8157076011,
  //       7545082880,
  //       7959965675,
  //       7457670542,
  //       8118702500,
  //       8073490159,
  //       7649262799,
  //       8012001469,
  //       7454861052,
  //       7730050177
  // ];
//
// const botUsernames = [ "cvpost1_bot","cvpost2_bot","cvpost3_bot","cvpost4_bot","cvpost5_bot","cvpost6_bot","cvpost7_bot","cvpost8_bot","cvpost9_bot","cvpost10_bot","cvpost11_bot","cvpost12_bot","cvpost13_bot","cvpost14_bot","cvpost15_bot","cvpost16_bot","cvpost17_bot","cvpost18_bot","cvpost19_bot","cvpost20_bot","cvpost21_bot","cvpost22_bot","cvpost23_bot","cvpost24_bot","cvpost25_bot","cvpost26_bot","cvpost27_bot","cvpost28_bot","cvpost29_bot","cvpost30_bot"
// ];
//
//     const rights = new Api.ChatAdminRights({
//     changeInfo: false,
//     postMessages: true,
//     editMessages: true,
//     deleteMessages: true,
//     banUsers: false,
//     inviteUsers: true,
//     pinMessages: true,
//     addAdmins: false,
//     anonymous: false,
//     manageCall: false,
//     other: true,
//   });

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


  

  // for (const botId of botIds) {
  //   try {
  //     await client.invoke(
  //       new Api.channels.EditAdmin({
  //         channel: channel,
  //         userId: botId,
  //         adminRights: rights,
  //         rank: "Bot",
  //       })
  //     );
  //     console.log(`✅ Назначен админом: ${botId}`);
  //   } catch (e) {
  //     console.error(`❌ Ошибка для ${botId}:`, e.message);
  //   }
  // }
  //
  process.exit(0);
})();
