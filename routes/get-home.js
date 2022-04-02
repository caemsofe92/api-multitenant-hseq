let express = require('express');
let router = express.Router();
const client = require('../bin/redis-client');
const axios = require("axios");

router.post('/', async(req, res) => {
    const tenantUrl = (req.query.tenantUrl || (req.body && req.body.tenantUrl));
    const clientId = (req.query.clientId || (req.body && req.body.clientId));
    const clientSecret = (req.query.clientSecret || (req.body && req.body.clientSecret));
    const tenant = (req.query.tenant || (req.body && req.body.tenant));
    const entity = (req.query.entity || (req.body && req.body.entity));
    const numberOfElements = (req.query.numberOfElements || (req.body && req.body.numberOfElements));
    const refresh = (req.query.refresh || (req.body && req.body.refresh));
    const userEmail = (req.query.userEmail || (req.body && req.body.userEmail));
    
    let mainReply;
    let userReply;

    let _mainReply;
    let _userReply;

    if(!refresh){
      _mainReply = await client.get(entity);
      _userReply = await client.get(entity + userEmail);

      if (_mainReply && _userReply){ 
        mainReply = JSON.parse(_mainReply);
        userReply = JSON.parse(_userReply);
        return res.json({response: {...mainReply, ...userReply}});
      }
    }

    let token = await client.get(tenant);

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

    if(!_mainReply){
    const Entity1 = axios.get(`${tenant}/data/SRF_HSEUnsafeConditionsReport?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity2 = axios.get(`${tenant}/data/SRF_HSEDiagnosticEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    
      await axios.all([Entity1, Entity2]).then(axios.spread(async (...responses) => {
        mainReply = {
          SRF_HSEUnsafeConditionsReport: responses[0].data,
          SRF_HSEDiagnosticEntity: responses[1].data
        };

        await client.set(
          entity,
          JSON.stringify(mainReply),
          {
            EX: 9999999,
          }
        );
      }));
    }

    if(!_userReply){
    const Entity1 = axios.get(`${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name,company`, { headers: {'Authorization': "Bearer " + token}});
    const Entity2 = axios.get(`${tenant}/data/HcmWorkers?$format=application/json;odata.metadata=none&cross-company=true&$select=DirPerson_FK_PartyNumber,PersonnelNumber`, { headers: {'Authorization': "Bearer " + token}});
    const Entity3 = axios.get(`${tenant}/data/PersonUsers?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=UserEmail eq '${userEmail}'&$select=PersonName,PartyNumber`, { headers: {'Authorization': "Bearer " + token}});
    
      await axios.all([Entity1, Entity2, Entity3]).then(axios.spread(async (...responses) => {

        const _PersonUsers = responses[2].data.value;
        let PersonUsers = {};
        let HcmWorkers = {};

        if(_PersonUsers.length > 0){
          PersonUsers = _PersonUsers[0];
          const _HcmWorkers = responses[1].data.value.filter(item => item.DirPerson_FK_PartyNumber === PersonUsers.PartyNumber);

          if(_HcmWorkers.length > 0){
            HcmWorkers = _HcmWorkers[0];
          }
        }

        userReply = {
          SRFSecurityRoles: responses[0].data,
          HcmWorkers,
          PersonUsers
        };

        await client.set(
          entity + userEmail,
          JSON.stringify(userReply),
          {
            EX: 3599,
          }
        );
      }));
    }

    return res.json({response: {...mainReply, ...userReply}});
});

module.exports = router;