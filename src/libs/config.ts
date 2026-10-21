export const AUTH_TIMER = 24;
/** Production: ".nextgain.shop", so the cookie set by api.nextgain.shop is
 *  also visible to the frontend on nextgain.shop. Unset locally (host-only). */
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
export const MORGAN_FORMAT = ":method :url :response-time [:status] \n";

import mongoose from "mongoose";
export const shapeIntoMongooseObjectId = (target: any) => {
  return typeof target === "string"
    ? new mongoose.Types.ObjectId(target)
    : target;
};
