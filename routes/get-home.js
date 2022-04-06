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
  const userEmail = req.query.userEmail || (req.body && req.body.userEmail);
  const environment =
    req.query.environment || (req.body && req.body.environment);

  if (!client.isOpen) client.connect();

  if (!refresh) {
    const userReply = await client.get(entity + userEmail);
    if (userReply) return res.json({ response: JSON.parse(userReply) });
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

  let _mainReply;
  let mainReply;

  if (!refresh) {
    _mainReply = await client.get(entity);
  }

  if (!_mainReply || refresh) {
    const Entity1 = axios.get(
      `${tenant}/data/HcmWorkers?$format=application/json;odata.metadata=none&cross-company=true&$select=DirPerson_FK_PartyNumber,PersonnelNumber`,
      { headers: { Authorization: "Bearer " + token } }
    );

    await axios.all([Entity1]).then(
      axios.spread(async (...responses) => {
        mainReply = responses[0].data.value;

        await client.set(entity, JSON.stringify(mainReply), {
          EX: 9999999,
        });
      })
    );
  } else {
    mainReply = JSON.parse(_mainReply);
  }

  const Entity1 = axios.get(
    `${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name,company`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity2 = axios.get(
    `${tenant}/data/PersonUsers?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true&$filter=UserEmail eq '${userEmail}'&$select=PersonName,PartyNumber`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const Entity3 = axios.get(
    `${tenant}/data/Companies?$format=application/json;odata.metadata=none${
      numberOfElements ? "&$top=" + numberOfElements : ""
    }&cross-company=true&$select=DataArea,Name`,
    { headers: { Authorization: "Bearer " + token } }
  );

  await axios.all([Entity1, Entity2, Entity3]).then(
    axios.spread(async (...responses) => {
      const _PersonUsers = responses[1].data.value;
      let PersonUsers = {};
      let HcmWorkers = {};

      if (_PersonUsers.length > 0) {
        PersonUsers = _PersonUsers[0];
        const _HcmWorkers = mainReply.filter(
          (item) => item.DirPerson_FK_PartyNumber === PersonUsers.PartyNumber
        );

        if (_HcmWorkers.length > 0) {
          HcmWorkers = _HcmWorkers[0];
        }
      }

      const userReply = {
        SRFSecurityRoles: responses[0].data.value.map((Rol) => {
          return { Name: Rol.Name };
        }),
        SRFUserData: {
          PersonName: PersonUsers.PersonName,
          PersonnelNumber: HcmWorkers.PersonnelNumber,
          Company: responses[0].data.value[0].company,
        },
        Companies: responses[2].data,
      };

      await client.set(entity + userEmail, JSON.stringify(userReply), {
        EX: 3599,
      });

      return res.json({ response: userReply });
    })
  );
});

module.exports = router;
