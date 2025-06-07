const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // Для ввода данных (npm install input)

// Настройки API
const apiId = YOUR_API_ID; // Замените на ваш api_id
const apiHash = 'YOUR_API_HASH'; // Замените на ваш api_hash
const stringSession = new StringSession(''); // Сессия сохраняется после первого входа

// Данные
const newOwnerId = 'USER_ID'; // ID пользователя, которому передаем права (например, 123456789)
const channelIds = ['-1001234567890', '-1009876543210']; // Список ID каналов
const botsToRemove = ['123456789', '987654321']; // ID ботов для удаления

(async () => {
  // Инициализация клиента
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  // Авторизация
  await client.start({
    phoneNumber: async () => await input.text('Введите номер телефона: '),
    password: async () => await input.text('Введите пароль (если есть): '),
    phoneCode: async () => await input.text('Введите код из Telegram: '),
    onError: (err) => console.error('Ошибка авторизации:', err),
  });

  // Сохраняем сессию для повторного использования
  console.log('Сессия сохранена:', client.session.save());

  // Функция для управления администраторами и правами канала
  async function manageChannel(channelId) {
    try {
      // Получаем объект канала
      const channel = await client.getEntity(channelId);

      // 1. Удаляем ботов из администраторов
      for (const botId of botsToRemove) {
        try {
          await client.invoke(
            new Api.channels.EditAdmin({
              channel: channel,
              userId: botId,
              adminRights: new Api.ChatAdminRights({
                changeInfo: false,
                postMessages: false,
                editMessages: false,
                deleteMessages: false,
                banUsers: false,
                inviteUsers: false,
                pinMessages: false,
                addAdmins: false,
              }),
              rank: '',
            })
          );
          console.log(`Бот ${botId} удален из администраторов канала ${channelId}`);
        } catch (error) {
          console.error(`Ошибка при удалении бота ${botId} из ${channelId}:`, error.message);
        }
      }

      // 2. Проверяем, является ли пользователь участником канала
      try {
        const participants = await client.invoke(
          new Api.channels.GetParticipant({
            channel: channel,
            participant: newOwnerId,
          })
        );
        console.log(`Пользователь ${newOwnerId} уже участник канала ${channelId}`);
      } catch (error) {
        // Если пользователь не участник, приглашаем его
        if (error.message.includes('USER_NOT_PARTICIPANT')) {
          try {
            await client.invoke(
              new Api.channels.InviteToChannel({
                channel: channel,
                users: [newOwnerId],
              })
            );
            console.log(`Пользователь ${newOwnerId} приглашен в канал ${channelId}`);
          } catch (inviteError) {
            console.error(`Ошибка при приглашении ${newOwnerId} в ${channelId}:`, inviteError.message);
            return; // Прерываем, если не удалось пригласить
          }
        } else {
          console.error(`Ошибка проверки участника ${newOwnerId} в ${channelId}:`, error.message);
          return;
        }
      }

      // 3. Назначаем пользователя администратором
      try {
        await client.invoke(
          new Api.channels.EditAdmin({
            channel: channel,
            userId: newOwnerId,
            adminRights: new Api.ChatAdminRights({
              changeInfo: true,
              postMessages: true,
              editMessages: true,
              deleteMessages: true,
              banUsers: true,
              inviteUsers: true,
              pinMessages: true,
              addAdmins: true,
            }),
            rank: 'Admin',
          })
        );
        console.log(`Пользователь ${newOwnerId} назначен администратором в ${channelId}`);
      } catch (error) {
        console.error(`Ошибка при назначении администратора ${newOwnerId} в ${channelId}:`, error.message);
        return;
      }

      // 4. Передаем права владения
      try {
        await client.invoke(
          new Api.channels.EditCreator({
            channel: channel,
            userId: newOwnerId,
            password: null, // Если требуется 2FA, запросите пароль
          })
        );
        console.log(`Права владения каналом ${channelId} переданы пользователю ${newOwnerId}`);
      } catch (error) {
        console.error(`Ошибка при передаче прав владения ${channelId}:`, error.message);
      }
    } catch (error) {
      console.error(`Общая ошибка для канала ${channelId}:`, error.message);
    }
  }

  // Обрабатываем все каналы
  for (const channelId of channelIds) {
    console.log(`Обработка канала ${channelId}...`);
    await manageChannel(channelId);
    // Задержка для избежания лимитов
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('Обработка всех каналов завершена.');
  await client.disconnect();
})();
