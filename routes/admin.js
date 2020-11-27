const router = require("express").Router();

const adminControl = require("../controllers/admin");

/** Completely flushes the Lobbies collection. */
router.get(
  "/clearLobbies" /**TODO: add admin authorization middleware */,
  adminControl.clearLobbies
);

/** Completely flushes the Cached data. */
router.get(
  "/clearCache" /**TODO: add admin authorization middleware */,
  adminControl.clearCache
);

/** Clears server-set tokens. Currently, the following cokkies are reset with this request: token. */
router.get(
  "/clearCookies" /**TODO: add admin authorization middleware */,
  adminControl.clearCookies
);

/** Returns currently Cached data in HTML.  */
router.get(
  "/displayCacheData" /**TODO: add admin authorization middleware */,
  adminControl.displayCacheData
);

/** Returns currently Cached data in JSON.  */
/**Example: 
{
  USP: [
    { userID: 1, sockID: 2 },
    { userID: 3, sockID: 3 },
    { userID: 4, sockID: 12 },
  ],
  RDY: [
    { lobbyID: 123, users: [1, 3, 4] },
    { lobbyID: 124, users: [5, 6] },
  ],
};
*/
router.get(
  "/getCacheData" /**TODO: add admin authorization middleware */,
  adminControl.getCacheData
);

module.exports = router;
