nodeDarwinArchiver
==================

node.js Darwin archiving tool for establishing a dataset of recent UK National Rail passenger train running data for research and analysis.

Requires an account on the National Rail Data Portal for access to Darwin Push Port (STOMP)
https://opendata.nationalrail.co.uk/

Requires an access token for OpenLDBSVWS (Staff Version) Darwin Web Service (SOAP)
http://openldbsv.nationalrail.co.uk/

The script consumes schedule related messages from the Darwin Push Port feed (using a JMS selector of MessageType=SC) watching for deactivated messages normally indicating that a train has completed its journey and no further updates are expected. The final state of the Darwin database for the train is then obtained by a web services call to GetServiceDetailsByRID and logged to console (stdout).

NPM Dependencies
================

stompit ( https://www.npmjs.com/package/stompit )

xml2js ( https://www.npmjs.com/package/xml2js )

soap ( https://www.npmjs.com/package/soap )

Getting Started
===============

Edit config.json and enter your STOMP credentials and SOAP access token where indicated.

Run the script without redirection to check for any connection errors.  If all is well it may be up to 60s before any output is generated:

    $nodejs archiver.js

With data being received, run the script with output redirection, or as required:

    $nodejs archiver.js > logs/darwin.json.log

Background Daily Logging
========================

With midnightExit set to true the script will terminate after processing the first batch of deactivations received post-midnight. A shell script can then be used to initiate / restart the process (including a pause incase of connectivity issues) with a date based log filename for example:

    #!/bin/sh
    while true
    do
      DATE=$(date +"%Y%m%d")
      LOG="logs/$DATE.darwin.json.log"
      nodejs archiver.js >> $LOG
      sleep 10
    done

With the above saved as archiver.sh (and chmod +x), to initiate and detach from your terminal process:

    $nohup ./archiver.sh > /dev/null &

Notes
=====

* Weekday logs grow to approximately 170MB (around 23,000 schedules) and compress by around 90%.

* The generated dataset should not be considered complete.  The period between deactivation and persistence of a service in the Darwin environment is not documented and very occasionally calls to GetServiceDetailsByRID for a recently deactivated schedule fail (to ensure clean logs set logErrors to false).

* Darwin batch processes deactivations approximately every 60s, when around 20-30 deactivated messages are received within 1-2s.  The script queues requests to OpenLDBSVWS which are then made at 1s intervals to avoid triggering the rate limiter of free tier access to the web services.

Links
=====

OpenLDBSVWS documentation:
http://lite.realtime.nationalrail.co.uk/OpenLDBSVWS/

