import mongoose, { Schema } from "mongoose";
import {
  ProductStatus,
  ProductCollection,
  ProductSize,
} from "../libs/enums/product.enum";
import { Product } from "../libs/types/product";

const productSchema = new Schema(
  {
    productStatus: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.PAUSE,
    },
    productCollection: {
      type: String,
      enum: ProductCollection,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productLeftCount: {
      type: Number,
      required: true,
    },
    productSize: {
      type: String,
      enum: ProductSize,
      default: ProductSize.NORMAL,
    },
    productDesc: {
      type: String,
    },
    productImages: {
      type: [String],
      default: [],
    },
    productViews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }, // updateAt, deleteAt
);
productSchema.index({ productName: 1, productSize: 1 }, { unique: true });

export default mongoose.model<Product>("Product", productSchema);
