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

  const unsafeCondition =
    req.query.unsafeCondition || (req.body && req.body.unsafeCondition);
  const eventDetails =
    req.query.eventDetails || (req.body && req.body.eventDetails);
  const eventCauses =
    req.query.eventCauses || (req.body && req.body.eventCauses);
  const potentialEventDamage =
    req.query.potentialEventDamage ||
    (req.body && req.body.potentialEventDamage);
  const improvementOpportunities =
    req.query.improvementOpportunities ||
    (req.body && req.body.improvementOpportunities);
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

  let _unsafeCondition;
  let _improvementOpportunities;
  let _eventDetails;
  let _eventCauses = [];
  let _potentialEventDamage = [];

  try {
    if (unsafeCondition) {
      await axios({
        method: "post",
        url: `${tenant}/data/SRF_HSEUnsafeConditionsReport?$format=application/json;odata.metadata=none`,
        data: {
          ...unsafeCondition,
          Responsible: unsafeCondition.Responsible.toString(),
        },
        headers: { Authorization: "Bearer " + token },
        transformResponse: [
          async (dataUnsafeCondition) => {
            _unsafeCondition = JSON.parse(dataUnsafeCondition);
            let _improvementOpportunities;

            if (improvementOpportunities) {
              const __improvementOpportunities = await axios.post(
                `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
                {
                  ...improvementOpportunities,
                  _dataAreaId: _unsafeCondition.dataAreaId,
                  _idOrigin: _unsafeCondition.SRF_HSEIdUnsafeCondition,
                  _detectionDate: _unsafeCondition.UtcDrawingDate,
                  _refRecId: _unsafeCondition.RecId1,
                  _state: 0,
                  _hcmEmploymentType: 0,
                  _origin: 8,
                  _tableID: 20371,
                },
                {
                  headers: { Authorization: "Bearer " + token },
                }
              );
              _improvementOpportunities = __improvementOpportunities.data;
            }

            if (eventDetails) {
              await axios({
                method: "post",
                url: `${tenant}/data/SRF_HSEEventDetails?$format=application/json;odata.metadata=none`,
                data: {
                  dataAreaId: _unsafeCondition.dataAreaId,
                  SRF_HSEIdUnsafeCondition:
                    _unsafeCondition.SRF_HSEIdUnsafeCondition,
                  ...eventDetails,
                },
                headers: { Authorization: "Bearer " + token },
                transformResponse: [
                  async (dataEventDetails) => {
                    _eventDetails = JSON.parse(dataEventDetails);

                    if (eventCauses) {
                      for (let i = 0; i < eventCauses.length; i++) {
                        const cause = eventCauses[i];
                        const causeResponse = await axios.post(
                          `${tenant}/data/SRF_HSEEventCauses?$format=application/json;odata.metadata=none`,
                          {
                            dataAreaId: _eventDetails.dataAreaId,
                            SRF_HSEIdUnsafeCondition:
                              _eventDetails.SRF_HSEIdUnsafeCondition,
                            RefRecid: _eventDetails.RecId1,
                            ...cause,
                          },
                          {
                            headers: { Authorization: "Bearer " + token },
                          }
                        );
                        _eventCauses.push(causeResponse.data);
                      }
                    }
                    if (potentialEventDamage) {
                      for (let i = 0; i < potentialEventDamage.length; i++) {
                        const damage = potentialEventDamage[i];
                        const damageResponse = await axios.post(
                          `${tenant}/data/SRF_HSEPotentialEventDamage?$format=application/json;odata.metadata=none`,
                          {
                            dataAreaId: _eventDetails.dataAreaId,
                            SRF_HSEIdUnsafeCondition:
                              _eventDetails.SRF_HSEIdUnsafeCondition,
                            RefRecid: _eventDetails.RecId1,
                            ...damage,
                          },
                          {
                            headers: { Authorization: "Bearer " + token },
                          }
                        );
                        _potentialEventDamage.push(damageResponse.data);
                      }
                    }
                    return res.send({
                      result: true,
                      _unsafeCondition,
                      _improvementOpportunities,
                      _eventDetails,
                      _eventCauses,
                      _potentialEventDamage,
                      _evidences: evidences,
                    });
                  },
                ],
              });
            } else {
              return res.send({
                result: true,
                _unsafeCondition,
                _improvementOpportunities,
                _eventDetails,
                _eventCauses,
                _potentialEventDamage,
                _evidences: evidences,
              });
            }
          },
        ],
      });
    } else {
      return res.send({
        result: true,
        _unsafeCondition,
        _improvementOpportunities,
        _eventDetails,
        _eventCauses,
        _potentialEventDamage,
        _evidences: evidences,
      });
    }
  } catch (error) {
    return res.send({
      result: false,
      _unsafeCondition,
      _improvementOpportunities,
      _eventDetails,
      _eventCauses,
      _potentialEventDamage,
      _evidences: evidences,
    });
  }
});

module.exports = router;
