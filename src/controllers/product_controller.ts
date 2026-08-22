import { Request, Response } from "express";
import fs from "fs"; // @claude-change: used to clean up orphan uploads
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { AdminRequest, ExtendedRequest } from "../libs/types/member";
import ProductService from "../models/Product.service";
import { ProductInquiry } from "../libs/types/product";
import { ProductCollection } from "../libs/enums/product.enum";

const productService = new ProductService();

const productController: T = {};
/** SPA */
productController.getProducts = async (req: Request, res: Response) => {
  try {
    console.log("getProducts");
    const { page, limit, order, productCollection, search } = req.query;
    const inquiry: ProductInquiry = {
      order: String(order),
      page: Number(page),
      limit: Number(limit),
    };
    if (productCollection) {
      inquiry.productCollection = productCollection as ProductCollection;
    }
    if (search) inquiry.search = String(search);

    const result = await productService.getProducts(inquiry);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProducts", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

productController.getProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    console.log("getProduct");
    const { id } = req.params;
    console.log("req.member", req.member);

    const memberId = req.member?._id ?? null,
      result = await productService.getProduct(memberId, id as string);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProduct", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

/** SSR */
productController.getAllProducts = async (req: Request, res: Response) => {
  try {
    console.log("getAllProducts");
    const data = await productService.getAllProduct();
    console.log("data:", data);

    res.render("products", { products: data });
  } catch (err) {
    console.log("Error, getAllProducts", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

productController.createNewProduct = async (
  req: AdminRequest,
  res: Response,
) => {
  try {
    console.log("createNewProduct");
    console.log("req.files:", req.files);

    if (!req.files?.length)
      throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);

    const data = req.body;
    data.productImages = req.files?.map((ele) => {
      return ele.path;
    });

    await productService.createNewProduct(data);

    res.send(
      `<script> alert("Succesfully  creation"); window.location.replace('/admin/product/all')</script>`,
    );
  } catch (err) {
    // @claude-change: this route also saves files before it validates, so a
    // failed create used to leave the image sitting in ./uploads/products with
    // nothing in the database pointing at it.
    const files: Express.Multer.File[] = req.files ?? [];
    await Promise.all(
      files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)),
    );

    console.log("Error, createNewProduct", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace('/admin/product/all')</script>`,
    );
  }
};

/**
 * @claude-change — updateChosenProduct now also stores uploaded images.
 *
 * The route already runs makeUploader("products").array("productImages", 5),
 * so multer has written the files to ./uploads/products and filled req.files
 * by the time we get here. Before, this handler ignored them completely and
 * only forwarded req.body.
 */
productController.updateChosenProduct = async (
  req: AdminRequest,
  res: Response,
) => {
  const files: Express.Multer.File[] = req.files ?? [];

  try {
    const id = req.params.id;

    // multer's file.path is "uploads/products/xxx.jpg" on mac/linux but
    // "uploads\products\xxx.jpg" on windows — the browser needs forward slashes
    const newImages = files.map((file) => file.path.split("\\").join("/"));

    // @claude-change: loud enough to debug from the terminal. If files is 0
    // here while a file did land in ./uploads/products, the request reached a
    // different route than POST /admin/product/:id
    console.log("=== updateChosenProduct ===");
    console.log("  url  :", req.originalUrl);
    console.log("  id   :", id);
    console.log("  files:", files.length, newImages);
    console.log("  body :", req.body);

    // form-data sends every untouched box as "", which would blank the field
    const fields: T = {};
    for (const [key, value] of Object.entries(req.body ?? {})) {
      if (value !== "" && value !== undefined && value !== null)
        fields[key] = value;
    }

    // optional switch: send imageMode=replace to drop the old images
    const imageMode: "append" | "replace" =
      fields.imageMode === "replace" ? "replace" : "append";
    delete fields.imageMode;

    const { product, replacedImages } = await productService.updateChosenProduct(
      id as string,
      fields,
      newImages,
      imageMode,
    );

    // in replace mode the previous files are no longer referenced by any
    // document, so drop them from disk once the write has succeeded
    await Promise.all(
      replacedImages.map((p: string) =>
        fs.promises.unlink(p).catch(() => undefined),
      ),
    );

    console.log("  saved productImages:", product.productImages);

    res.status(HttpCode.OK).json({ data: product });
  } catch (err) {
    // multer saved the files before this handler ran. If the update was
    // refused they are orphans on disk, so remove them.
    await Promise.all(
      files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)),
    );

    console.log("Error,updateChosenProduct", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};
export default productController;
