const https = require('https');
const options = {
  hostname: 'api.youversion.com',
  path: '/v1/bibles/111/passages/GEN.1?format=html',
  headers: {
    'x-yvp-app-key': 'RAhHurUzL1pk5kt9LwrGIaz0AdnX0obcIH6NNIayuvGogR7f',
    'Accept': 'application/json'
  }
};
https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
