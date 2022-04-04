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
    const Entity1 = axios.get(`${tenant}/data/Companies?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity2 = axios.get(`${tenant}/data/SRF_HSEZones?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity3 = axios.get(`${tenant}/data/SRF_HSEZonesLineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity4 = axios.get(`${tenant}/data/SRF_HSEProcessLineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity5 = axios.get(`${tenant}/data/SRF_HSEActivities_LineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity6 = axios.get(`${tenant}/data/SRF_HSEImmediateBasicCauses?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity7 = axios.get(`${tenant}/data/SRF_HSEObjectDamage?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity8 = axios.get(`${tenant}/data/SRF_HSEPropertyType?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity9 = axios.get(`${tenant}/data/SRF_HSEHarmLevelsEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity10 = axios.get(`${tenant}/data/SRF_HSEUnsafeConditionsReport?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity11 = axios.get(`${tenant}/data/SRF_HSEEventDetails?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity12 = axios.get(`${tenant}/data/SRF_HSEEventCauses?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity13 = axios.get(`${tenant}/data/SRF_HSEPotentialEventDamage?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity14 = axios.get(`${tenant}/data/SRF_HSEApprovalLineEntity?$format=application/json;odata.metadata=none&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity15 = axios.get(`${tenant}/data/SRF_HSEItemsEvaluateEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity16 = axios.get(`${tenant}/data/SRF_HSEDiagnosticEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity17 = axios.get(`${tenant}/data/SRF_HSEDiagnosticLine?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity18 = axios.get(`${tenant}/data/SRF_HSEComplianceEvidencesEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity19 = axios.get(`${tenant}/data/SRF_HSEImprovementOpportunities?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity20 = axios.get(`${tenant}/data/SRF_HcmWorkerEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$select=Name,PersonnelNumber,Locator,DataArea`, { headers: {'Authorization': "Bearer " + token}});
    
      await axios.all([Entity1, Entity2, Entity3, Entity4,Entity5, Entity6, Entity7, Entity8, Entity9, Entity10, Entity11, Entity12, Entity13, Entity14, Entity15, Entity16, Entity17, Entity18, Entity19, Entity20, Entity21]).then(axios.spread(async (...responses) => {
        
        const SRF_HSEDiagnosticLine = responses[16].data;
        const SRF_HSEApprovalLineEntity = responses[13].data;
        const SRF_HSEDiagnosticLine2 = SRF_HSEDiagnosticLine.value.map(item => {
          const approvalList = (SRF_HSEApprovalLineEntity.value.filter(approvalElement => approvalElement.IdApproval === item.IdApproval && approvalElement.dataAreaId === item.dataAreaId)).map(approvalElement => approvalElement.Score);
          return {
            ...item, 
            MaxScore: Math.max(...approvalList),
            MinScore: Math.min(...approvalList)
          }
        });

        const SRF_HcmWorkerEntity = responses[19].data.value;
        let SRF_HSE_WorkerEntity = [];

        for (let i = 0; i < SRF_HcmWorkerEntity.length; i++) {
          const element1 = SRF_HcmWorkerEntity[i];
          let exists = false;
          
          for (let j = 0; j < SRF_HSE_WorkerEntity.length; j++) {
            const element2 = SRF_HSE_WorkerEntity[j];
            
            if(element2.Name === element1.Name &&  element2.PersonnelNumber === element1.PersonnelNumber && element2.DataArea === element1.DataArea){
              exists=true;
              break;
            }
          }

          if(!exists){
            SRF_HSE_WorkerEntity.push(element1);
          }
        }

        mainReply = {
          Companies: responses[0].data,
          SRF_HSEZones: responses[1].data,
          SRF_HSEZonesLineEntity: responses[2].data,
          SRF_HSEProcessLineEntity: responses[3].data,
          SRF_HSEActivities_LineEntity: responses[4].data,
          SRF_HSEImmediateBasicCauses: responses[5].data,
          SRF_HSEObjectDamage: responses[6].data,
          SRF_HSEPropertyType: responses[7].data,
          SRF_HSEHarmLevelsEntity: responses[8].data,
          SRF_HSEUnsafeConditionsReport: responses[9].data,
          SRF_HSEEventDetails: responses[10].data,
          SRF_HSEEventCauses: responses[11].data,
          SRF_HSEPotentialEventDamage: responses[12].data,
          SRF_HSEApprovalLineEntity,
          SRF_HSEItemsEvaluateEntity: responses[14].data,
          SRF_HSEDiagnosticEntity: responses[15].data,
          SRF_HSEDiagnosticLine,
          SRF_HSEComplianceEvidencesEntity: responses[17].data,
          SRF_HSEImprovementOpportunities: responses[18].data,
          SRF_HSEDiagnosticLine2,
          SRF_HSE_WorkerEntity
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
    const Entity1 = axios.get(`${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=Email eq '${userEmail}'`, { headers: {'Authorization': "Bearer " + token}});
    const Entity2 = axios.get(`${tenant}/data/HcmWorkers?$format=application/json;odata.metadata=none&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity3 = axios.get(`${tenant}/data/PersonUsers?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=UserEmail eq '${userEmail}'`, { headers: {'Authorization': "Bearer " + token}});
    
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
          SRFSecurityRoles: responses[1].data,
          PersonUsers,
          HcmWorkers
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