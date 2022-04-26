let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const moment = require("moment");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");

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
    const eventCauses =
      req.query.eventCauses || (req.body && req.body.eventCauses);
    const potentialEventDamage =
      req.query.potentialEventDamage ||
      (req.body && req.body.potentialEventDamage);
    const evidences = req.query.evidences || (req.body && req.body.evidences);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!unsafeCondition || unsafeCondition.length === 0)
      throw new Error("unsafeCondition is Mandatory");

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

    const newRequest = {
      dataAreaId: unsafeCondition.dataAreaId,
      ReportType: unsafeCondition.ReportType,
      Other: unsafeCondition.Other,
      Responsible: unsafeCondition.Responsible.toString(),
      Description: unsafeCondition.Description,
      //CreatedByForUser: unsafeCondition.CreatedByForUser,
      UtcDrawingDate: moment(unsafeCondition.UtcDrawingDate).add(5, "hours"),
      State: unsafeCondition.State,
    };

    let _unsafeCondition = await axios
      .post(
        `${tenant}/data/SRF_HSEUnsafeConditionsReport?$format=application/json;odata.metadata=none`,
        newRequest,
        { headers: { Authorization: "Bearer " + token } }
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

    _unsafeCondition = _unsafeCondition.data;

    let _improvementOpportunity;

    if (improvementOpportunity) {
      _improvementOpportunity = await axios
        .post(
          `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
          {
            _description: improvementOpportunity,
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
      _improvementOpportunity = _improvementOpportunity.data;
    }

    let _eventDetails;

    if (eventDetails) {
      _eventDetails = await axios
        .post(
          `${tenant}/data/SRF_HSEEventDetails?$format=application/json;odata.metadata=none`,
          {
            dataAreaId: _unsafeCondition.dataAreaId,
            SRF_HSEIdUnsafeCondition: _unsafeCondition.SRF_HSEIdUnsafeCondition,
            ...eventDetails,
            EventDate2: moment(eventDetails.EventDate2).add(5, "hours"),
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
      _eventDetails = _eventDetails.data;
    }

    let _eventCauses = [];

    if (eventCauses) {
      for (let i = 0; i < eventCauses.length; i++) {
        const cause = eventCauses[i];
        const causeResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEEventCauses?$format=application/json;odata.metadata=none`,
            {
              dataAreaId: _eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: _eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: _eventDetails.RecId1,
              ...cause,
              Description: undefined,
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

    let _potentialEventDamage = [];

    if (potentialEventDamage) {
      for (let i = 0; i < potentialEventDamage.length; i++) {
        const damage = potentialEventDamage[i];
        const damageResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEPotentialEventDamage?$format=application/json;odata.metadata=none`,
            {
              dataAreaId: _eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: _eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: _eventDetails.RecId1,
              ...damage,
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

    if (evidences) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        "DefaultEndpointsProtocol=https;AccountName=multitenantappsstorage;AccountKey=dUEqKBrzMOB0qzOSZMADxP4ywLWJnmTh4s2ar5hh3yhkKmlgaQUlsIDmdB89EMG00fCu2lIIYFiJYfpjZ3duJQ==;EndpointSuffix=core.windows.net"
      );

      const containerClient = await blobServiceClient.getContainerClient(
        "raic-evidences"
      );

      for (let i = 0; i < evidences.length; i++) {
        const element = evidences[i];

        const path = JSON.parse(element.imagePath).toString();
        
        const matches = path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        const buffer = new Buffer.from(matches[2], "base64");
        
        const imageType = matches[1];
        
        const name = _unsafeCondition.RecId1 + uuidv1()+ "." + imageType.split('/')[1];
        console.error(name);
        
        const blockBlobClient = containerClient.getBlockBlobClient(name);

        const responseImage = await blockBlobClient.upload(
          buffer,
          buffer.byteLength
        );
        console.error(responseImage);

        const imageRequest = {
          _DataareaId: _unsafeCondition.dataAreaId,
          _AccesInformation: `https://multitenantappsstorage.blob.core.windows.net/raic-evidences/${name}`,
          _name: name,
          _TableId: 20371,
          _RefRecId: _unsafeCondition.RecId1,
          _FileType: imageType.split('/')[1],
        };
        console.error(imageRequest);

        

        let _responseImage;

        if (responseImage) {
          
          _responseImage = await axios
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
          _responseImage = _responseImage.data;
        }
      }
    }

    return res.json({
      result: true,
      message: "OK",
      _unsafeCondition,
      _improvementOpportunity,
      _eventDetails,
      _eventCauses,
      _potentialEventDamage,
      _evidences: evidences,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
