const mongoose = require("mongoose");

const BotUserSchema = new mongoose.Schema(
{
    chat_id: {
      type: String,
      required: true,
    },
    username:{
      type: String,
      default:''
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BotUser", BotUserSchema);
