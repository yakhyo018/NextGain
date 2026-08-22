import { ObjectId } from "mongoose";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { ProductStatus } from "../libs/enums/product.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Member } from "../libs/types/member";
import {
  Product,
  ProductInput,
  ProductInquiry,
  ProductUpdateInput,
} from "../libs/types/product";
import ProductModel from "../schema/Product.model";
import { ViewInput } from "../libs/types/view";
import { ViewGroup } from "../libs/enums/view.enum";
import ViewService from "./View.service";

/** @claude-change — how many images one product may hold */
const MAX_PRODUCT_IMAGES = 5;

class ProductService {
  [x: string]: any;
  private readonly productModel;
  public viewService;

  constructor() {
    this.productModel = ProductModel;
    this.viewService = new ViewService();
  }
  //** SPA */
  public async getProducts(inquiry: ProductInquiry): Promise<Member[]> {
    const match: T = { productStatus: ProductStatus.PROCESS };

    if (inquiry.productCollection)
      match.productCollection = inquiry.productCollection;

    if (inquiry.search) {
      match.productName = { $regex: new RegExp(inquiry.search, "i") };
    }

    const sort: T =
      inquiry.order === "productPrice"
        ? { [inquiry.order]: 1 }
        : { [inquiry.order]: -1 };

    const result = await this.productModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        { $skip: (inquiry.page * 1 - 1) * inquiry.limit },
        { $limit: inquiry.limit * 1 },
      ])
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  public async getProduct(
    memberId: ObjectId | null,
    id: string,
  ): Promise<Product> {
    const productId = shapeIntoMongooseObjectId(id);

    let result = await this.productModel
      .findOne({
        _id: productId,
        productStatus: ProductStatus.PROCESS,
      })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    if (memberId) {
      // Check Existence
      const input: ViewInput = {
        memberId: memberId,
        viewRefId: productId,
        viewGroup: ViewGroup.PRODUCT,
      };

      const existView = await this.viewService.checkViewExistence(input);

      console.log("exist:", !!existView);

      if (!existView) {
        // Insert View
        console.log("PLANNING TO INSERT NEW LOG");
        await this.viewService.insertMemberView(input);

        // Increase Counts
        result = await this.productModel.findByIdAndUpdate(
          productId,
          {
            $inc: { productViews: +1 },
          },
          { new: true },
        );
      }
    }

    return result as Product;
  }

  /** SSR */

  public async getAllProduct(): Promise<Product[]> {
    const result = await this.productModel.find().exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    console.log("result:", result);
    return result;
  }

  public async createNewProduct(input: ProductInput): Promise<Product> {
    try {
      return await this.productModel.create(input);
    } catch (err) {
      console.log("Error,model:createNewProduct:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  /**
   * @claude-change — now also attaches uploaded images.
   *
   * @param id         the :id from the route
   * @param input      the text fields of the form (productName, price ...)
   * @param newImages  paths of the files multer already wrote to disk,
   *                   e.g. ["uploads/products/9f3c-...jpg"]
   * @param imageMode  "append" keeps the images the product already has,
   *                   "replace" throws them away and keeps only the new ones
   */
  public async updateChosenProduct(
    id: string,
    input: ProductUpdateInput,
    newImages: string[] = [],
    imageMode: "append" | "replace" = "append",
  ): Promise<{ product: Product; replacedImages: string[] }> {
    const productId = shapeIntoMongooseObjectId(id);

    // productImages may only come from req.files. If the body were allowed to
    // set it, anyone could point a product at any path on the server.
    const fields: T = { ...input };
    delete fields.productImages;
    delete fields._id; // _id is immutable in mongo, sending it errors out

    const update: T = {};
    if (Object.keys(fields).length > 0) update.$set = fields;

    /** files the product no longer points at — the controller deletes them */
    let replacedImages: string[] = [];

    if (newImages.length > 0) {
      // the product must exist before we attach anything to it
      const existing = await this.productModel.findById(productId).exec();
      if (!existing) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

      const current = existing.productImages ?? [];

      if (imageMode === "replace") {
        // @claude-change: the old files stop being referenced here, so hand
        // them back instead of leaving them behind in ./uploads/products
        replacedImages = [...current];
        update.$set = { ...(update.$set ?? {}), productImages: newImages };
      } else {
        if (current.length + newImages.length > MAX_PRODUCT_IMAGES)
          throw new Errors(
            HttpCode.BAD_REQUEST,
            `This product already holds ${current.length} image(s) and you sent ${newImages.length}; the limit is ${MAX_PRODUCT_IMAGES}. Send imageMode=replace to swap them instead of appending.`,
          );

        // $push + $each appends atomically. Reading the doc, pushing in JS and
        // calling save() would lose one of two uploads arriving together.
        update.$push = { productImages: { $each: newImages } };
      }
    }

    if (Object.keys(update).length === 0)
      throw new Errors(HttpCode.BAD_REQUEST, Message.NOTHING_TO_UPDATE);

    const result = await this.productModel
      .findByIdAndUpdate(productId, update, { new: true })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return { product: result, replacedImages };
  }
}

export default ProductService;
