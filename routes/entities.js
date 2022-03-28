var express = require('express');
var router = express.Router();
const client = require('../bin/redis-client');
const axios = require("axios");

router.get('/', async(req, res, next) => {

    const reply = await client.get("SRFSecurityRoles");

    if (reply) return res.send(JSON.parse(reply));

    var token = await client.get("token");
    if (!token){
      const optionsToken = {
        method: 'post',
        url: 'https://login.microsoftonline.com/gecolsa.com.co/oauth2/token',
        data: "grant_type=client_credentials&client_id=74ca5bcf-dcce-4651-99a2-307c1b481046&client_secret=I-_7Q~Q42D4oMfPY0NxgKcl1PE3PhBj-OTRh5&resource=https://dfo365-preprod.sandbox.operations.dynamics.com",
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformResponse: [async (data) => {
          const _data = JSON.parse(data);
          token = _data.access_token;
          await client.set(
            "token",
            JSON.stringify(_data.access_token),
            {
              EX: 3599,
            }
          );
          return data;
        }]
      };
      await axios(optionsToken);
    }

    const optionsEntity = {
      method: 'get',
      url: 'https://dfo365-preprod.sandbox.operations.dynamics.com/data/SRFSecurityRoles?$format=application/json;odata.metadata=none',
      headers: {'Authorization': "Bearer " + token},
      data: {},
      transformResponse: [async (data) => {

        await client.set(
          "SRFSecurityRoles",
          JSON.stringify(data),
          {
            EX: 3599,
          }
        );
        res.send(JSON.parse(data));
      }]
    };
    await axios(optionsEntity);
  
});

module.exports = router;