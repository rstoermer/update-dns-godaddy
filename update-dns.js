const os = require("os");
require("dotenv").config();
const axios = require("axios").default;

let localIpv6;
let godaddyIpv6;

(async () => {
  godaddyIpv6 = (
    await axios({
      method: "get",
      url: `https://api.godaddy.com/v1/domains/${process.env.DOMAIN}/records/AAAA/${process.env.SUBDOMAIN}`,
      headers: {
        Authorization: `sso-key ${process.env.SECRET}:${process.env.KEY}`,
      },
    })
  ).data[0].data;

  const networkInterfaces = os.networkInterfaces();

  for (const networkInterface of networkInterfaces.eth0) {
    if (networkInterface.family === "IPv6" && networkInterface.scopeid === 0) {
      localIpv6 = networkInterface.address;
      break;
    }
  }

  if (localIpv6 !== godaddyIpv6) {
    console.info(`${new Date().toISOString()}: ipv6 ${godaddyIpv6} not uptodate. Current: ${localIpv6}`);

    try {
      await axios({
        method: "put",
        url: `https://api.godaddy.com/v1/domains/${process.env.DOMAIN}/records/AAAA/${process.env.SUBDOMAIN}`,
        headers: {
          Authorization: `sso-key ${process.env.SECRET}:${process.env.KEY}`,
        },
        data: [
          {
            data: localIpv6,
            name: "cloud",
            ttl: 3600,
            type: "AAAA",
          },
        ],
      });

      console.info(`${new Date().toISOString()}: Changed ipv6 to ${localIpv6}`)
    } catch (error) {
      console.log(error.response.data);
    }
  }
})();
