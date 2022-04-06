let express = require("express");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

router.post("/", async (req, res) => {
  const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
  const clientId = req.query.clientId || (req.body && req.body.clientId);
  const clientSecret =
    req.query.clientSecret || (req.body && req.body.clientSecret);
  const tenant = req.query.tenant || (req.body && req.body.tenant);
  const entity = req.query.entity || (req.body && req.body.entity);
  const numberOfElements =
    req.query.numberOfElements || (req.body && req.body.numberOfElements);
  const refresh = req.query.refresh || (req.body && req.body.refresh);
  const userCompany =
    req.query.userCompany || (req.body && req.body.userCompany);
  const environment =
    req.query.environment || (req.body && req.body.environment);

  if (!client.isOpen) client.connect();

  if (!refresh) {
    const mainReply = await client.get(entity + userCompany);
    if (mainReply) return res.json({ response: JSON.parse(mainReply) });
  }

  let token = await client.get(environment);

  if (!token) {
    const optionsToken = {
      method: "post",
      url: `https://login.microsoftonline.com/${tenantUrl}/oauth2/token`,
      data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&resource=${tenant}/`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      transformResponse: [
        async (data) => {
          const _data = JSON.parse(data);
          token = _data.access_token;
          await client.set(environment, _data.access_token, {
            EX: 3599,
          });
          return data;
        },
      ],
    };
    await axios(optionsToken);
  }

  const Entity1 = axios.get(
    `${tenant}/data/SRF_HSEApprovalLineEntity?$format=application/json;odata.metadata=none&cross-company=true${
      userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
    }`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity2 = axios.get(
    `${tenant}/data/SRF_HSEDiagnosticEntity?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true${
      userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
    }&$orderby=DrawingDate desc`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity3 = axios.get(
    `${tenant}/data/SRF_HSEDiagnosticLine?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true${
      userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
    }`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity4 = axios.get(
    `${tenant}/data/SRF_HSEComplianceEvidencesEntity?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true${
      userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
    }`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity5 = axios.get(
    `${tenant}/data/SRF_HSEImprovementOpportunities?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true${
      userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
    }`,
    { headers: { Authorization: "Bearer " + token } }
  );

  await axios.all([Entity1, Entity2, Entity3, Entity4, Entity5]).then(
    axios.spread(async (...responses) => {
      const SRF_HSEDiagnosticLine = responses[2].data;
      const SRF_HSEApprovalLineEntity = responses[0].data;
      const SRF_HSEDiagnosticLine2 = SRF_HSEDiagnosticLine.value.map((item) => {
        const approvalList = SRF_HSEApprovalLineEntity.value
          .filter(
            (approvalElement) =>
              approvalElement.IdApproval === item.IdApproval &&
              approvalElement.dataAreaId === item.dataAreaId
          )
          .map((approvalElement) => approvalElement.Score);
        return {
          ...item,
          MaxScore: Math.max(...approvalList),
          MinScore: Math.min(...approvalList),
        };
      });

      const reply = {
        SRF_HSEApprovalLineEntity,
        SRF_HSEDiagnosticEntity: responses[1].data,
        SRF_HSEDiagnosticLine,
        SRF_HSEComplianceEvidencesEntity: responses[3].data,
        SRF_HSEImprovementOpportunities: responses[4].data,
        SRF_HSEDiagnosticLine2,
      };

      await client.set(entity + userCompany, JSON.stringify(reply), {
        EX: 9999999,
      });
      return res.json({ response: reply });
    })
  );
});

module.exports = router;
