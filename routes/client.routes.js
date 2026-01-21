import { Router } from "express";
import {
  registerClient,
  getParentEntity,
  getAllClientInfo,
  deleteFromList,
  updateClientDetails,
  getClientInfoById,
  getClientInfoByEmId,
  getShiftPattern,
  getAllServicesInfo,
  updateClientService,
  updateClientShiftPattern,
  updateClientPayRate,
  getPayRate
} from "../controller/client.controller.js";

import {
  createMenu,
  getMenuList
} from "../controller/client_menu.controller.js";

import { upload, handleUpload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/save-client")
  .post(
    upload.fields([
      { name: "upload", maxCount: 1 },
      { name: "client_logo", maxCount: 1 }
    ]),
    handleUpload,
    registerClient
  );

router.route("/update-client-details")
  .patch(
    upload.fields([
      { name: "upload", maxCount: 1 },
      { name: "client_logo", maxCount: 1 }
    ]),
    handleUpload,
    updateClientDetails
  );

router.route("/get_parent_entity").get(getParentEntity);
router.route("/info").get(getClientInfoById);
router.route("/info/employee").get(getClientInfoByEmId);
router.route("/get-client-info").get(getAllClientInfo);
router.route("/get-shift-pattern").get(getShiftPattern);
router.route("/get-pay-rate").get(getPayRate);
router.route("/delete").patch(deleteFromList);
router.route("/get-all-services").get(getAllServicesInfo);
router.route("/update-client-service").patch(updateClientService);
router.route("/update-client-shift-pattern").patch(updateClientShiftPattern);
router.route("/update-client-pay-rate").patch(updateClientPayRate);

router.route("/menu/client").post(createMenu);
router.route("/menu/list/client").get(getMenuList);

export default router;