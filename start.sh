#!/bin/bash

# Invoke the Forever module (to START our Node.js server).
/var/node-js/i-motion/stop.sh
cd /var/node-js/i-motion
git pull
rm -rf /var/node-js/i-motion*/.log
rm -rf /root/.forever/demoapp8071.log
export PORT=8071
export ENV=DEMO
/usr/local/lib/node_modules/forever/bin/forever \
	--a --uid demoapp8071 \
	start \
	-al demoapp8071.log \
	-ao /var/node-js/i-motion/out.log \
	-ae /var/node-js/i-motion/err.log \
	 --killSignal=SIGINT /var/node-js/i-motion/server/app.js
