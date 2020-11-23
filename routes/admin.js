const router = require("express").Router();

const adminControl = require("../controllers/admin");

router.get(
  "/clearLobbies" /**TODO: add admin authorization middleware */,
  adminControl.clearLobbies
);

router.get(
  "/clearCache" /**TODO: add admin authorization middleware */,
  adminControl.clearCache
);

router.get(
  "/clearCookies" /**TODO: add admin authorization middleware */,
  adminControl.clearCookies
);

router.get(
  "/displayCacheData" /**TODO: add admin authorization middleware */,
  adminControl.displayCacheData
);

router.get(
  "/getCacheData" /**TODO: add admin authorization middleware */,
  adminControl.getCacheData
);

module.exports = router;
