var express = require('express');
var router = express.Router();
const client = require('../bin/redis-client');
const axios = require("axios");

router.post('/', async(req, res, next) => {

    const tenantUrl = (req.query.tenantUrl || (req.body && req.body.tenantUrl));
    const clientId = (req.query.clientId || (req.body && req.body.clientId));
    const clientSecret = (req.query.clientSecret || (req.body && req.body.clientSecret));
    const tenant = (req.query.tenant || (req.body && req.body.tenant));
    const entity = (req.query.entity || (req.body && req.body.entity));
    const select = (req.query.select || (req.body && req.body.select));
    const filter = (req.query.filter || (req.body && req.body.filter));
    const crossCompany = (req.query.crossCompany || (req.body && req.body.crossCompany));
    const orderby = (req.query.orderby || (req.body && req.body.orderby));
    const offset = (req.query.offset || (req.body && req.body.offset));
    const numberOfElements = (req.query.numberOfElements || (req.body && req.body.numberOfElements));
    const withCount = (req.query.withCount || (req.body && req.body.withCount));
    const refresh = (req.query.refresh || (req.body && req.body.refresh));
    const userEmail = (req.query.userEmail || (req.body && req.body.userEmail));
    const isPerzonalized = (req.query.isPerzonalized || (req.body && req.body.isPerzonalized));
    

    if(!refresh){
      const reply = await client.get(isPerzonalized ? entity + userEmail : entity);
      if (reply) return res.send(JSON.parse(reply));
    }

    var token;
    token = await client.get(tenant);

    if (!token){
      const optionsToken = {
        method: 'post',
        url: `https://login.microsoftonline.com/${tenantUrl}/oauth2/token`,
        data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&resource=${tenant}/`,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformResponse: [async (data) => {
          const _data = JSON.parse(data);
          token = _data.access_token;
          await client.set(
            tenant,
            _data.access_token,
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
      url: `${tenant}/data/${entity}?$format=application/json;odata.metadata=none${ select ? "&$select=" + select : "" }${ filter ? "&$filter=" + filter : ""}${ orderby ? "&$orderby=" + orderby : ""}${ offset ? "&$skip=" + offset : ""}${ numberOfElements ? "&$top=" + numberOfElements : ""}${ withCount ? "&$count=" + withCount : ""}${crossCompany ? "&cross-company=true" : ""}`,
      headers: {'Authorization': "Bearer " + token},
      data: {},
      transformResponse: [async (data) => {
        const _data = JSON.parse(data);

        await client.set(
          isPerzonalized ? entity + userEmail : entity,
          JSON.stringify(_data.value),
          {
            EX: 3599,
          }
        );
        if(withCount){
          return res.send({
            count: _data["@odata.count"],
            values: _data.value
          });
        }else{
          return res.send({
            count: null,
            values: _data.value
          });
        }
      }]
    };
    await axios(optionsEntity);  
});

module.exports = router;