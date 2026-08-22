import expres from "express";
const router = expres.Router();
import memberContoller from "./controllers/member_controller";
import makeUploader from "./libs/utils/uploader";
import productController from "./controllers/product_controller";
import orderController from "./controllers/order_controller";

/** Member **/
router.get("/member/restaurant", memberContoller.getStore);
router.post("/member/Login", memberContoller.Login);
router.post("/member/Signup", memberContoller.Signup);
router.post(
  "/member/Logout",
  memberContoller.verifyAuth,
  memberContoller.logout,
);
router.get(
  "/member/detail",
  memberContoller.verifyAuth,
  memberContoller.getMemberDetail,
);
router.post(
  "/member/update",
  memberContoller.verifyAuth,
  makeUploader("members").single("memberImage"),
  memberContoller.updateMember,
);
router.get("/member/top-users", memberContoller.getTopUSers);

/** Product **/
router.get("/product/all", productController.getProducts);
router.get(
  "/product/:id",
  memberContoller.retrieveAuth,
  productController.getProduct,
);

/** Orders **/
router.post(
  "/order/create",
  memberContoller.verifyAuth,
  orderController.createOrder,
);
router.get(
  "/order/all",
  memberContoller.verifyAuth,
  orderController.getMyOrders,
);
router.post(
  "/order/update",
  memberContoller.verifyAuth,
  orderController.updateOrder,
);

export default router;
