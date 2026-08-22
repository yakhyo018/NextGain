import expres from "express";
const routerAdmin = expres.Router();
import StoreContoller from "./controllers/store_controller";
import productController from "./controllers/product_controller";
import makeUploader, { uploadImages } from "./libs/utils/uploader";
import storeController from "./controllers/store_controller";

/** Restaurant  */
routerAdmin.get("/", StoreContoller.goHome);
routerAdmin
  .get("/signup", StoreContoller.getSignUp)
  .post(
    "/signup",
    makeUploader("members").single("memberImage"),
    StoreContoller.processSignup,
  );

routerAdmin
  .get("/login", StoreContoller.getLogin)
  .post("/login", StoreContoller.processLogin);

routerAdmin.get("/logout", StoreContoller.logout);
routerAdmin.get("/check-me", StoreContoller.testAuthSession);

/** Product */
routerAdmin.get(
  "/product/all",
  StoreContoller.verifyRestaurant,
  productController.getAllProducts,
);
routerAdmin.post(
  "/product/create",
  StoreContoller.verifyRestaurant,
  makeUploader("products").array("productImages", 5),
  productController.createNewProduct,
);
/**
 * @claude-change — POST /admin/product/:id now also accepts images.
 * uploadImages() replaces makeUploader(...).array(...) so a rejected upload
 * comes back as JSON instead of an HTML 500 page.
 */
routerAdmin.post(
  "/product/:id",
  StoreContoller.verifyRestaurant,
  uploadImages("products", "productImages", 5),
  productController.updateChosenProduct,
);

/** User */
routerAdmin.get(
  "/user/all",
  StoreContoller.verifyRestaurant,
  storeController.getUsers,
);
routerAdmin.post(
  "/user/edit",
  StoreContoller.verifyRestaurant,
  storeController.updateChosenUser,
);

export default routerAdmin;
