const fetch = require('node-fetch');
const verses = ['GEN.1.1', 'GEN.1.2', 'GEN.1.3', 'GEN.1.4', 'GEN.1.5'];
Promise.all(verses.map(v => 
  fetch(`https://api.youversion.com/v1/bibles/2692/passages/${v}`, {
    headers: { 'x-yvp-app-key': 'RAhHurUzL1pk5kt9LwrGIaz0AdnX0obcIH6NNIayuvGogR7f', 'Accept': 'application/json' }
  }).then(r => r.json())
)).then(console.log);
