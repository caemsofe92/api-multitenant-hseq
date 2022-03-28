var express = require('express');
var router = express.Router();
const client = require('../bin/redis-client');
const axios = require("axios");

/* GET users listing. */
router.get('/', async(req, res, next) => {
  
    // Search Data in Redis
    const reply = await client.get("character");

    // if exists returns from redis and finish with response
    if (reply) return res.send(JSON.parse(reply));

    // Fetching Data from Rick and Morty API
    const response = await axios.get(
      "https://rickandmortyapi.com/api/character"
    );

    // Saving the results in Redis. The "EX" and 10, sets an expiration of 10 Seconds
    const saveResult = await client.set(
      "character",
      JSON.stringify(response.data),
      {
        EX: 10,
      }
    );
    console.log(saveResult)

    // resond to client
    res.send(response.data);
  
});

module.exports = router;
