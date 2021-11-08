const { Telegraf } = require("telegraf");
const config = require("../config/default");

const BotUser = require("../models/botUser");

let token = config.dev.botToken;
let KaspiBot = new Telegraf(token);

KaspiBot.start(async (ctx) => {  
    console.log('bot start pressed by: '+ctx.from.username)
    let user = await BotUser.findOne({ chat_id: ctx.chat.id });
   
    if(!user){
        const newUser = {
            chat_id: ctx.chat.id,
            username: ctx.from.username
        };

        user = new BotUser(newUser);
        user.save((err, saved) => {
            if(err) console.log(err, ' ,error in telegram/index.js');
            if (saved) console.log('user saved');
        });

        KaspiBot.telegram.sendMessage(ctx.chat.id, 'Начинаю менять цены...');
    }else{
        KaspiBot.telegram.sendMessage(ctx.chat.id, 'Зачем нажимаешь старт?');
    }
});

// const sendMessage = (chat_id, message, messageKeyboard) => {
//     kolesaBot.sendChatAction(chat_id, "typing");
//     return kolesaBot
//       .sendMessage(chat_id, message, messageKeyboard)
//       .then(() => {
//         return true;
//       })
//       .catch(async (err) => {
//           console.log(err && err.response && err.response.statusCode ? err.response.statusCode : "no status", chat_id)
//         if (err.response && err.response.statusCode === 403) {
//           await USER.findOneAndUpdate(
//             { chat_id: chat_id },
//             { $set: { isBlocked: true } }
//           );
//           const user = await USER.findOne({ chat_id });
//           await saveEvent(user, events.blockBot);
//         }
//         return err;
//       });
//   };


KaspiBot.launch()

module.exports = {
    KaspiBot
};
