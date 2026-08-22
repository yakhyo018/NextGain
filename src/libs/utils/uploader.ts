import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 } from "uuid";
import { Request, Response, NextFunction } from "express";

/** @claude-change — only real images may reach the uploads folder */
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function getTargetImageStorage(address: string) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = `./uploads/${address}`;
      // @claude-change: on a fresh clone ./uploads/products does not exist yet
      // and multer would fail with ENOENT
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },

    filename: function (req, file, cb) {
      const extension = path.parse(file.originalname).ext;
      const random_name = v4() + extension;
      cb(null, random_name);
    },
  });
}

const makeUploader = (address: string) => {
  const storage = getTargetImageStorage(address);

  return multer({
    storage: storage,

    // @claude-change: reject pdf/exe/anything that is not an image, and stop a
    // 300 MB upload from filling the disk
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(
          new Error("Only jpeg, jpg, png and webp images are allowed"),
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per image
      files: 5,
    },
  });
};

export default makeUploader;

/**
 * @claude-change — makeUploader(...).array(...) hands its own failures to the
 * Express error handler, which answers with an HTML 500 page. That is unusable
 * from Postman or from the React app. This wrapper turns them into JSON 400s:
 *
 *   LIMIT_FILE_SIZE   the image is over 5 MB
 *   LIMIT_FILE_COUNT  more than `max` files
 *   LIMIT_UNEXPECTED_FILE  the form field is not named `field`
 *   plus our own fileFilter message for non-images
 */
export const uploadImages = (address: string, field: string, max: number) => {
  const handler = makeUploader(address).array(field, max);

  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err: any) => {
      if (err) {
        const message =
          err instanceof multer.MulterError
            ? `${err.message} (field: ${err.field ?? field})`
            : err.message;
        return res.status(400).json({ code: 400, message });
      }
      next();
    });
  };
};
