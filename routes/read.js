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
    const expirationTime = (req.query.expirationTime || (req.body && req.body.expirationTime));
    
    if(!refresh){
      const reply = await client.get(isPerzonalized ? entity + userEmail : entity);
      if (reply) return res.json({response: JSON.parse(reply)});
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

    const Entity1 = axios.get(`${tenant}/data/Companies?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity2 = axios.get(`${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=Email eq '${userEmail}'`, { headers: {'Authorization': "Bearer " + token}});
    const Entity3 = axios.get(`${tenant}/data/SRF_HSEZones?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity4 = axios.get(`${tenant}/data/SRF_HSEZonesLineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity5 = axios.get(`${tenant}/data/SRF_HSEProcessLineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity6 = axios.get(`${tenant}/data/SRF_HSEActivities_LineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity7 = axios.get(`${tenant}/data/SRF_HSEImmediateBasicCauses?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity8 = axios.get(`${tenant}/data/SRF_HSEObjectDamage?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity9 = axios.get(`${tenant}/data/SRF_HSEPropertyType?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity10 = axios.get(`${tenant}/data/SRF_HSEHarmLevelsEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity11 = axios.get(`${tenant}/data/SRF_HSEUnsafeConditionsReport?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity12 = axios.get(`${tenant}/data/SRF_HSEEventDetails?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity13 = axios.get(`${tenant}/data/SRF_HSEEventCauses?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity14 = axios.get(`${tenant}/data/SRF_HSEPotentialEventDamage?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity15 = axios.get(`${tenant}/data/SRF_HSEApprovalLineEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity16 = axios.get(`${tenant}/data/SRF_HSEItemsEvaluateEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity17 = axios.get(`${tenant}/data/SRF_HSEDiagnosticEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity18 = axios.get(`${tenant}/data/SRF_HSEDiagnosticLine?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity19 = axios.get(`${tenant}/data/SRF_HSEComplianceEvidencesEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity20 = axios.get(`${tenant}/data/SRF_HSEImprovementOpportunities?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    const Entity21 = axios.get(`${tenant}/data/SRF_HcmWorkerEntity?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$select=Name,PersonnelNumber,Locator,DataArea`, { headers: {'Authorization': "Bearer " + token}});
    const Entity22 = axios.get(`${tenant}/data/PersonUsers?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true&$filter=UserEmail eq '${userEmail}'`, { headers: {'Authorization': "Bearer " + token}});
    const Entity23 = axios.get(`${tenant}/data/HcmWorkers?$format=application/json;odata.metadata=none${ numberOfElements ? "&$top=" + numberOfElements : ""}&cross-company=true`, { headers: {'Authorization': "Bearer " + token}});
    
      await axios.all([Entity1, Entity2, Entity3, Entity4,Entity5, Entity6, Entity7, Entity8, Entity9, Entity10, Entity11, Entity12, Entity13, Entity14, Entity15, Entity16, Entity17, Entity18, Entity19, Entity20, Entity21, Entity22, Entity23]).then(axios.spread(async (...responses) => {
        
        const SRF_HSEDiagnosticLine = responses[17].data.value;
        const SRF_HSEApprovalLineEntity = responses[14].data.value;
        const SRF_HSEDiagnosticLine2 = SRF_HSEDiagnosticLine.map(item => {
          const approvalList = (SRF_HSEApprovalLineEntity.filter(approvalElement => approvalElement.IdApproval === item.IdApproval && approvalElement.dataAreaId === item.dataAreaId)).map(approvalElement => approvalElement.Score);
          return {
            ...item, 
            MaxScore: Math.max(...approvalList),
            MinScore: Math.min(...approvalList)
          }
        });

        const SRF_HcmWorkerEntity = responses[20].data.value;
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

        const _PersonUsers = responses[21].data.value;
        let PersonUsers = {};
        let HcmWorkers = {};

        if(_PersonUsers.length > 0){
          PersonUsers = _PersonUsers[0];
          const _HcmWorkers = responses[22].data.value.filter(item => item.DirPerson_FK_PartyNumber === PersonUsers.PartyNumber);

          if(_HcmWorkers.length > 0){
            HcmWorkers = _HcmWorkers[0];
          }
        }

        const _data = {
          Companies: responses[0].data.value,
          SRFSecurityRoles: responses[1].data.value,
          SRF_HSEZones: responses[2].data.value,
          SRF_HSEZonesLineEntity: responses[3].data.value,
          SRF_HSEProcessLineEntity: responses[4].data.value,
          SRF_HSEActivities_LineEntity: responses[5].data.value,
          SRF_HSEImmediateBasicCauses: responses[6].data.value,
          SRF_HSEObjectDamage: responses[7].data.value,
          SRF_HSEPropertyType: responses[8].data.value,
          SRF_HSEHarmLevelsEntity: responses[9].data.value,
          SRF_HSEUnsafeConditionsReport: responses[10].data.value,
          SRF_HSEEventDetails: responses[11].data.value,
          SRF_HSEEventCauses: responses[12].data.value,
          SRF_HSEPotentialEventDamage: responses[13].data.value,
          SRF_HSEApprovalLineEntity,
          SRF_HSEItemsEvaluateEntity: responses[15].data.value,
          SRF_HSEDiagnosticEntity: responses[16].data.value,
          SRF_HSEDiagnosticLine,
          SRF_HSEComplianceEvidencesEntity: responses[18].data.value,
          SRF_HSEImprovementOpportunities: responses[19].data.value,
          SRF_HSEDiagnosticLine2,
          SRF_HSE_WorkerEntity,
          PersonUsers,
          HcmWorkers
        };

        await client.set(
          isPerzonalized ? entity + userEmail : entity,
          JSON.stringify(_data),
          {
            EX: expirationTime ? expirationTime : 9999999,
          }
        );
        
        return res.send({response: _data});
        
      }));
    
    /*
    const optionsEntity = {
      method: 'get',
      url: `${tenant}/data/${entity}?$format=application/json;odata.metadata=none${ select ? "&$select=" + select : "" }${ filter ? "&$filter=" + filter : ""}${ orderby ? "&$orderby=" + orderby : ""}${ offset ? "&$skip=" + offset : ""}${ numberOfElements ? "&$top=" + numberOfElements : ""}${ withCount ? "&$count=" + withCount : ""}${crossCompany ? "&cross-company=true" : ""}`,
      headers: {'Authorization': "Bearer " + token},
      data: {},
      transformResponse: [async (data) => {
        const response = JSON.parse(data);

        let values = JSON.stringify(response.value);
       
        const regex = /,/g;
        const regex2 = /{\"/g;
        const regex3 = /":/g;

        let _values = values.replace(regex, ';');
        let __values = _values.replace(regex2, `{`);
        let ___values = __values.replace(regex3, `:`);

        let ____values = ___values.slice(1,-1);
    
        const _data = {c:response["@odata.count"],v:response.value};

        await client.set(
          isPerzonalized ? entity + userEmail : entity,
          JSON.stringify(_data),
          {
            EX: expirationTime ? expirationTime : 9999999,
          }
        );
        return res.send({response: _data});
       
      }]
    };
    await axios(optionsEntity);  
    */
});

module.exports = router;