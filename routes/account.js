const router = require("express").Router();

const accControl = require("../controllers/account");
const dbAcc = require("../db/manage-account");

/**Request to register a new account.
 * Request body:
 * {
    username: "_String_",
    password: "_String_",
    email: "_String_"
 * }
 * Response on success: Status code 201
 */
router.post("/register", accControl.register);

/**When user requests to log in, the server responds with a generated token which should be passed on to the server with further HTTP requests.
 *
 * Request to log in.
 * Request body:
 * {
    username: "_String_",
    password: "_String"
 * }
 * Response on success:
*  {
    token: "_String_"
*  }
 *  
 *  The response sets "token" cookie.
 */
router.post("/login", accControl.logIn);

/**Request to log out.
 * When the application will be finished, request type should be changed to GET (token will be passed through cookies). For now, it is configured as POST, as it is necessary to send a token in the request body.
 * Request body:
 * {
 *  token: "_String_"
 * }
 * Response on success: Status code 200
 */
router.post("/logout", dbAcc.auth, accControl.logOut);

/**Request for user's statistics.
 * Token should be passed the same way as for the logout request (refer to the comment above for more explanation).
 * Request body:
 * {
 *  token: "_String_"
 * }
 * Response on success: 
 * {
    user: "_String_ User's username",
    first: "_Number_ Number of games the user placed first.",
    second: "_Number_ Number of games the user placed second.",
    played: "_Number_ Number of games a user has played in total."
 * }
 */
router.post("/stats", dbAcc.auth, accControl.getStats);

module.exports = router;
