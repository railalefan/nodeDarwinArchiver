// core

const fs = require('fs');

const zlib = require('zlib');

// npm

const stompit = require('stompit');

const xml2js = require('xml2js');

const soap = require('soap');

//

const config = JSON.parse(fs.readFileSync('config.json'));

const today = new Date().getDay();

//

var OpenLDBSVWS;

var deactivated = {rids:[],processFrequency:1000,processTimeout:null};

//

function main() {

  if (!config.logErrors) console.error = function(){};

  soap.createClient('OpenLDBSVWS.wsdl', function(error, client) {

    if (error) { console.error('soap error: ' + error.message); return; }

    client.addSoapHeader({AccessToken:{TokenValue:config.soap.accessToken}});

    OpenLDBSVWS = client;

    consumer();
  });
}

function consumer() {

  stompit.connect(config.stomp, function(error, client) {

    if (error) { console.error('stomp connect error: ' + error.message); return; }

    client.subscribe({'destination':'/topic/darwin.pushport-v16','selector':'MessageType=\'SC\'','ack':'client-individual'}, function(error, message) {

      if (error) { console.error('stomp subscribe error: ' + error.message); return; }

      message.readString('binary', function(error, body) {

        if (error) { console.error('stomp read message error: ' + error.message); return; }

        xml2js.parseString(zlib.gunzipSync(Buffer.from(body, 'binary')).toString(), function (error, result) {

          for(element of result.Pport.uR) {

            if (element.deactivated) {

              clearTimeout(deactivated.processTimeout);

              deactivated.rids.push(element.deactivated[0].$.rid);

              deactivated.processTimeout = setTimeout(processor, deactivated.processFrequency);
            }
          }

          client.ack(message);
        });
      });
    });
  });
}

function processor() {

  if (rid = deactivated.rids.shift()) {

    OpenLDBSVWS.GetServiceDetailsByRID({'rid':rid}, function(error, result) {

      if (error) { console.error('soap error: ' + error.message); }

      if (result) {

        isPassengerService = ((typeof result.GetServiceDetailsResult.isPassengerService == "undefined") || (result.GetServiceDetailsResult.isPassengerService));

        if (isPassengerService) console.log(JSON.stringify(result));
      }

      deactivated.processTimeout = setTimeout(processor,deactivated.processFrequency);
    });
  }
  else if (config.midnightExit && ((new Date().getDay() != today))) process.exit();
}

main();
