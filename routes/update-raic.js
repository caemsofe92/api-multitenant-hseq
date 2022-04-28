let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const moment = require("moment");
const { BlobServiceClient } = require("@azure/storage-blob");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const unsafeCondition =
      req.query.unsafeCondition || (req.body && req.body.unsafeCondition);
    const improvementOpportunity =
      req.query.improvementOpportunity ||
      (req.body && req.body.improvementOpportunity);
    const eventDetails =
      req.query.eventDetails || (req.body && req.body.eventDetails);
    const deleteEventCauses =
      req.query.deleteEventCauses || (req.body && req.body.deleteEventCauses);
    const eventCauses =
      req.query.eventCauses || (req.body && req.body.eventCauses);
    const deletePotentialEventDamage =
      req.query.deletePotentialEventDamage ||
      (req.body && req.body.deletePotentialEventDamage);
    const potentialEventDamage =
      req.query.potentialEventDamage ||
      (req.body && req.body.potentialEventDamage);
    const evidences = req.query.evidences || (req.body && req.body.evidences);
    const email = req.query.email || (req.body && req.body.email);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!client.isOpen) client.connect();

    let token = await client.get(environment);

    if (!token) {
      const tokenResponse = await axios
        .post(
          `https://login.microsoftonline.com/${tenantUrl}/oauth2/token`,
          `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&resource=${tenant}/`,
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
      token = tokenResponse.data.access_token;
      await client.set(environment, tokenResponse.data.access_token, {
        EX: 3599,
      });
    }

    let _improvementOpportunity;

    if (
      unsafeCondition &&
      unsafeCondition.SRF_HSEIdImprovementOpportunities.length === 0 &&
      improvementOpportunity &&
      improvementOpportunity.length > 0
    ) {
      _improvementOpportunity = await axios
        .post(
          `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
          {
            _description: improvementOpportunity,
            _dataAreaId: unsafeCondition.dataAreaId,
            _idOrigin: unsafeCondition.SRF_HSEIdUnsafeCondition,
            _detectionDate: unsafeCondition.UtcDrawingDate,
            _refRecId: unsafeCondition.RecId1,
            _state: 0,
            _hcmEmploymentType: 0,
            _origin: 8,
            _tableID: 20371,
          },
          {
            headers: { Authorization: "Bearer " + token },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
      _improvementOpportunity = _improvementOpportunity.data
        ? {
            SRF_HSEIdImprovementOpportunities: _improvementOpportunity.data,
            Description: improvementOpportunity,
            RefRecId: unsafeCondition.RecId1,
          }
        : null;
    }

    let _unsafeCondition;

    if (unsafeCondition) {
      _unsafeCondition = await axios
        .patch(
          `${tenant}/data/UnsafeConditionsReports(dataAreaId='${unsafeCondition.dataAreaId}',SRF_HSEIdUnsafeCondition='${unsafeCondition.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
          {
            ...unsafeCondition,
            RecId1: undefined,
            SRF_HSEIdImprovementOpportunities:
              _improvementOpportunity &&
              _improvementOpportunity.SRF_HSEIdImprovementOpportunities &&
              unsafeCondition.SRF_HSEIdImprovementOpportunities.length === 0
                ? _improvementOpportunity.SRF_HSEIdImprovementOpportunities
                : unsafeCondition.SRF_HSEIdImprovementOpportunities,
            Responsible: unsafeCondition.Responsible.toString(),
          },
          {
            headers: { Authorization: "Bearer " + token },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
    }

    _unsafeCondition =
      _unsafeCondition && _unsafeCondition.data === ""
        ? "Modified"
        : "Unchanged";

    let _eventDetails;

    if (eventDetails) {
      _eventDetails = await axios
        .patch(
          `${tenant}/data/SRF_HSEEventDetails(RecId1=${eventDetails.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
          {
            ...eventDetails,
            EventDate2: moment(eventDetails.EventDate2).add(5, "hours"),
          },
          {
            headers: { Authorization: "Bearer " + token, "If-Match": "*" },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
    }

    _eventDetails =
      _eventDetails && _eventDetails.data === "" ? "Modified" : "Unchanged";

    let _deleteEventCauses = [];

    if (deleteEventCauses && deleteEventCauses.length > 0) {
      for (let i = 0; i < deleteEventCauses.length; i++) {
        const deleteCause = deleteEventCauses[i];
        const __deleteEventCauses = await axios
          .delete(
            `${tenant}/data/SRF_HSEEventCauses(RecId1=${deleteCause.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}',IdCausal='${deleteCause.IdCausal}')?cross-company=true`,
            {
              headers: { Authorization: "Bearer " + token },
            }
          )
          .catch(function (error) {
            if (
              error.response &&
              error.response.data &&
              error.response.data.error &&
              error.response.data.error.innererror &&
              error.response.data.error.innererror.message
            ) {
              throw new Error(error.response.data.error.innererror.message);
            } else if (error.request) {
              console.error(error.request);
              throw new Error(error.request);
            } else {
              throw new Error("Error", error.message);
            }
          });
        _deleteEventCauses.push(
          __deleteEventCauses && __deleteEventCauses.data === ""
            ? "Deleted"
            : "Unchanged"
        );
      }
    }

    let _eventCauses = [];

    if (eventCauses && eventCauses.length > 0) {
      for (let i = 0; i < eventCauses.length; i++) {
        const cause = eventCauses[i];
        const causeResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEEventCauses?cross-company=true&$format=application/json;odata.metadata=none`,
            {
              ...cause,
              dataAreaId: eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: eventDetails.RecId1,
            },
            {
              headers: { Authorization: "Bearer " + token },
            }
          )
          .catch(function (error) {
            if (
              error.response &&
              error.response.data &&
              error.response.data.error &&
              error.response.data.error.innererror &&
              error.response.data.error.innererror.message
            ) {
              throw new Error(error.response.data.error.innererror.message);
            } else if (error.request) {
              throw new Error(error.request);
            } else {
              throw new Error("Error", error.message);
            }
          });
        _eventCauses.push(causeResponse.data);
      }
    }

    let _deletePotentialEventDamage = [];

    if (deletePotentialEventDamage && deletePotentialEventDamage.length > 0) {
      for (let i = 0; i < deletePotentialEventDamage.length; i++) {
        const damage = deletePotentialEventDamage[i];
        const __deletePotentialEventDamage = await axios
          .delete(
            `${tenant}/data/SRF_HSEPotentialEventDamage(RecId1=${damage.RecId1},dataAreaId='${eventDetails.dataAreaId}')?cross-company=true`,
            {
              headers: { Authorization: "Bearer " + token },
            }
          )
          .catch(function (error) {
            if (
              error.response &&
              error.response.data &&
              error.response.data.error &&
              error.response.data.error.innererror &&
              error.response.data.error.innererror.message
            ) {
              throw new Error(error.response.data.error.innererror.message);
            } else if (error.request) {
              throw new Error(error.request);
            } else {
              throw new Error("Error", error.message);
            }
          });
        _deletePotentialEventDamage.push(
          __deletePotentialEventDamage &&
            __deletePotentialEventDamage.data === ""
            ? "Deleted"
            : "Unchanged"
        );
      }
    }

    let _potentialEventDamage = [];

    if (potentialEventDamage && potentialEventDamage.length > 0) {
      for (let i = 0; i < potentialEventDamage.length; i++) {
        const damage = potentialEventDamage[i];
        const damageResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEPotentialEventDamage?cross-company=true&$format=application/json;odata.metadata=none`,
            {
              ...damage,
              dataAreaId: eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: eventDetails.RecId1,
            },
            {
              headers: { Authorization: "Bearer " + token },
            }
          )
          .catch(function (error) {
            if (
              error.response &&
              error.response.data &&
              error.response.data.error &&
              error.response.data.error.innererror &&
              error.response.data.error.innererror.message
            ) {
              throw new Error(error.response.data.error.innererror.message);
            } else if (error.request) {
              throw new Error(error.request);
            } else {
              throw new Error("Error", error.message);
            }
          });
        _potentialEventDamage.push(damageResponse.data);
      }
    }

    let _evidences = [];

    if (evidences) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        "DefaultEndpointsProtocol=https;AccountName=multitenantappsstorage;AccountKey=dUEqKBrzMOB0qzOSZMADxP4ywLWJnmTh4s2ar5hh3yhkKmlgaQUlsIDmdB89EMG00fCu2lIIYFiJYfpjZ3duJQ==;EndpointSuffix=core.windows.net"
      );

      const containerClient =
        blobServiceClient.getContainerClient("raic-evidences");

      console.error(blobServiceClient, containerClient);

      for (let i = 0; i < evidences.length; i++) {
        const element = evidences[i];

        if (element.imagePath.length > 0) {
          const path = JSON.parse(element.imagePath).toString();

          const matches = path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

          const buffer = new Buffer.from(matches[2], "base64");

          const imageType = matches[1];

          const name =
            unsafeCondition.RecId1 +
            moment().format().toString() +
            "hseqraicimage." +
            imageType.split("/")[1];

          const blockBlobClient = containerClient.getBlockBlobClient(name);

          const responseImage = await blockBlobClient.upload(
            buffer,
            buffer.byteLength
          );

          console.error(responseImage);

          const imageRequest = {
            _DataareaId: unsafeCondition.dataAreaId,
            _AccesInformation: `https://multitenantappsstorage.blob.core.windows.net/raic-evidences/${name}`,
            _name: name,
            _TableId: 20371,
            _RefRecId: unsafeCondition.RecId1,
            _FileType: imageType.split("/")[1],
          };

          if (responseImage) {
            await axios
              .post(
                `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/FillDocuRef`,
                imageRequest,
                {
                  headers: { Authorization: "Bearer " + token },
                }
              )
              .catch(function (error) {
                if (
                  error.response &&
                  error.response.data &&
                  error.response.data.error &&
                  error.response.data.error.innererror &&
                  error.response.data.error.innererror.message
                ) {
                  throw new Error(error.response.data.error.innererror.message);
                } else if (error.request) {
                  throw new Error(error.request);
                } else {
                  throw new Error("Error", error.message);
                }
              });

            _evidences.push({
              RefRecId: unsafeCondition.RecId1,
              OriginalFileName: name,
            });
          }
        }
      }
    }

    if (email) {
      let recipients = "";

      for (let i = 0; i < email.recipients.length; i++) {
        const item = email.recipients[i];
        recipients += i === 0 ? item.Email : `;${item.Email}`;
      }

      await axios
        .post(
          "https://prod-60.westus.logic.azure.com:443/workflows/ff6b14da6ee9444fb7f3c46b4558981b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ba7NYh2lQRCXvSaz6xMQXKHGrQ1QWl48svmf6NS-c9c",
          {
            recipients: recipients,
            message: email.message,
            subject: email.subject,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
    }

    return res.json({
      result: true,
      message: "OK",
      _unsafeCondition,
      _improvementOpportunity,
      _eventDetails,
      _deleteEventCauses,
      _eventCauses,
      _deletePotentialEventDamage,
      _potentialEventDamage,
      _evidences,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
