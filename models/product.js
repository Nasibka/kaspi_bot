const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
{
    sku: {
      type: String,
      required: true,
    },
    product_name:{
      type: String,
      default:''
    },
    price:{
        type: Number,
        default:''
    },
    brand:{
        type: String,
        default:''
    },
    available:{
        type: String,
        default:''
    },
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("product", ProductSchema);
