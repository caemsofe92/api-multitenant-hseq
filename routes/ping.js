let express = require("express");
let router = express.Router();

router.get("/", async (req, res) => {
  try {
    return res.json({ result: true, message: "OK" });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.toString() });
  }
});

module.exports = router;
