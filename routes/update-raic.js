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
  const deleteEventCauses =
    req.query.deleteEventCauses || (req.body && req.body.deleteEventCauses);
  const potentialEventDamage =
    req.query.potentialEventDamage ||
    (req.body && req.body.potentialEventDamage);
  const deletePotentialEventDamage =
    req.query.deletePotentialEventDamage ||
    (req.body && req.body.deletePotentialEventDamage);
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

  let _eventCauses = [];
  let _potentialEventDamage = [];

  try {
    if (unsafeCondition) {
      await axios.patch(
        `${tenant}/data/SRF_HSEUnsafeConditionsReport(RecId1=${unsafeCondition.RecId1},dataAreaId='${unsafeCondition.dataAreaId}',WorkerNumber='${unsafeCondition.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
        {
          ...unsafeCondition,
          Responsible: unsafeCondition.Responsible.toString(),
          SRF_HSEIdImprovementOpportunities: undefined,
        },
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
    }

    if (eventDetails) {
      await axios.patch(
        `${tenant}/data/SRF_HSEEventDetails(RecId1=${eventDetails.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
        eventDetails,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
    }

    if (deleteEventCauses && deleteEventCauses.length > 0) {
      for (let i = 0; i < deleteEventCauses.length; i++) {
        const deleteCause = deleteEventCauses[i];
        await axios.delete(
          `${tenant}/data/SRF_HSEEventCauses(RecId1=${deleteCause.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}',IdCausal='${deleteCause.IdCausal}')?cross-company=true`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
      }
    }

    if (eventCauses && eventCauses.length > 0) {
      for (let i = 0; i < eventCauses.length; i++) {
        const cause = eventCauses[i];
        const causeResponse = await axios.post(
          `${tenant}/data/SRF_HSEEventCauses?cross-company=true&$format=application/json;odata.metadata=none`,
          {
            dataAreaId: eventDetails.dataAreaId,
            SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
            RefRecid: eventDetails.RecId1,
            ...cause,
          },
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        _eventCauses.push(causeResponse.data);
      }
    }

    if (deletePotentialEventDamage && deletePotentialEventDamage.length > 0) {
      for (let i = 0; i < deletePotentialEventDamage.length; i++) {
        const damage = deletePotentialEventDamage[i];
        await axios.delete(
          `${tenant}/data/SRF_HSEPotentialEventDamage(RecId1=${damage.RecId1},dataAreaId='${eventDetails.dataAreaId}')?cross-company=true`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
      }
    }

    if (potentialEventDamage && potentialEventDamage.length > 0) {
      for (let i = 0; i < potentialEventDamage.length; i++) {
        const damage = potentialEventDamage[i];
        const damageResponse = await axios.post(
          `${tenant}/data/SRF_HSEPotentialEventDamage?cross-company=true&$format=application/json;odata.metadata=none`,
          {
            dataAreaId: eventDetails.dataAreaId,
            SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
            RefRecid: eventDetails.RecId1,
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
      _eventCauses,
      _potentialEventDamage,
      _evidences: evidences,
    });
  } catch (error) {
    return res.send({
      result: error,
      _eventCauses,
      _potentialEventDamage,
      _evidences: evidences,
    });
  }
});

module.exports = router;
