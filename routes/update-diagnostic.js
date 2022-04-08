let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");

router.post("/", async (req, res) => {
  const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
  const clientId = req.query.clientId || (req.body && req.body.clientId);
  const clientSecret =
    req.query.clientSecret || (req.body && req.body.clientSecret);
  const tenant = req.query.tenant || (req.body && req.body.tenant);
  const diagnostic = req.query.diagnostic || (req.body && req.body.diagnostic);
  const diagnosticLine =
    req.query.diagnosticLine || (req.body && req.body.diagnosticLine);
  const evidences = req.query.evidences || (req.body && req.body.evidences);
  const environment =
    req.query.environment || (req.body && req.body.environment);

  if (!client.isOpen) client.connect();

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

  let _improvementOpportunities = [];

  try {
    if (diagnostic) {
      await axios.patch(
        `${tenant}/data/DiagnosticNews(RecIdGen=${diagnostic.RecIdGen},dataAreaId='${diagnostic.dataAreaId}')?cross-company=true`,
        diagnostic,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
    }

    if (diagnosticLine && diagnosticLine.length > 0) {
      for (let i = 0; i < diagnosticLine.length; i++) {
        const line = diagnosticLine[i];
        let opportunityResponse;
        if (line.improvementOpportunity) {
            opportunityResponse = await axios.post(
              `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
              {
                _refRecId: line.RecId1,
                _description: line.improvementOpportunity,
                _dataAreaId: diagnostic.dataAreaId,
                _idOrigin: diagnostic.SRF_HSEIdDiagnostic,
                _detectionDate: diagnostic.ExecutionDate,
                _state: 0,
                _hcmEmploymentType: 0,
                _origin: 1,
                _tableID: 17070,
              },
              {
                headers: { Authorization: "Bearer " + token },
              }
            );
            _improvementOpportunities.push(opportunityResponse.data);
        }
        await axios.patch(
          `${tenant}/data/SRF_HSEDiagnosticLine(dataAreaId='${diagnostic.dataAreaId}',SRF_HSEIdDiagnostic='${diagnostic.SRF_HSEIdDiagnostic}',RecId1=${line.RecId1},Line=${line.Line})?cross-company=true`,
          {
            ...line,
            improvementOpportunity: undefined
          },
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
      }
    }

    return res.send({
      result: true,
      _improvementOpportunities,
      _evidences: evidences,
    });
  } catch (error) {
    return res.send({
      result: error,
      _improvementOpportunities,
      _evidences: evidences,
    });
  }
});

module.exports = router;
