/*
 * Created on Tue Apr 04 2023
 * @author Hung Le <hungls>
 * @email hunglsxx@gmail.com
 */

const NodeMediaServer = require("../node_media_server");
const Https = require('https');
const Logger = require('../node_core_logger');
const NodeRtmpServer = require('../node_rtmp_server');
const NodeHttpServer = require('./custom_node_http_server');
const NodeTransServer = require('../node_trans_server');
const NodeRelayServer = require('./custom_node_relay_server');
const NodeFissionServer = require('../node_fission_server');
const context = require('../node_core_ctx');
const Package = require('../../package.json');

class CustomMediaServer extends NodeMediaServer {
    constructor(config) {
        super(config);
    }
    run() {
        Logger.setLogType(this.config.logType);
        Logger.log(`Node Media Server v${Package.version}`);
        if (this.config.rtmp) {
            this.nrs = new NodeRtmpServer(this.config);
            this.nrs.run();
        }

        if (this.config.http) {
            this.nhs = new NodeHttpServer(this.config);
            this.nhs.run();
        }

        if (this.config.trans) {
            if (this.config.cluster) {
                Logger.log('NodeTransServer does not work in cluster mode');
            } else {
                this.nts = new NodeTransServer(this.config);
                this.nts.run();
            }
        }

        if (this.config.relay) {
            if (this.config.cluster) {
                Logger.log('NodeRelayServer does not work in cluster mode');
            } else {
                this.nls = new NodeRelayServer(this.config);
                this.nls.run();
            }
        }

        if (this.config.fission) {
            if (this.config.cluster) {
                Logger.log('NodeFissionServer does not work in cluster mode');
            } else {
                this.nfs = new NodeFissionServer(this.config);
                this.nfs.run();
            }
        }

        process.on('uncaughtException', function (err) {
            Logger.error('uncaughtException', err);
        });

        process.on('SIGINT', function () {
            process.exit();
        });

        Https.get('https://registry.npmjs.org/node-media-server', function (res) {
            let size = 0;
            let chunks = [];
            res.on('data', function (chunk) {
                size += chunk.length;
                chunks.push(chunk);
            });
            res.on('end', function () {
                let data = Buffer.concat(chunks, size);
                let jsonData = JSON.parse(data.toString());
                let latestVersion = jsonData['dist-tags']['latest'];
                let latestVersionNum = latestVersion.split('.')[0] << 16 | latestVersion.split('.')[1] << 8 | latestVersion.split('.')[2] & 0xff;
                let thisVersionNum = Package.version.split('.')[0] << 16 | Package.version.split('.')[1] << 8 | Package.version.split('.')[2] & 0xff;
                if (thisVersionNum < latestVersionNum) {
                    Logger.log(`There is a new version ${latestVersion} that can be updated`);
                }
            });
        }).on('error', function (e) {
        });
    }

    on(eventName, listener) {
        context.nodeEvent.on(eventName, listener);
    }

    stop() {
        if (this.nrs) {
            this.nrs.stop();
        }
        if (this.nhs) {
            this.nhs.stop();
        }
        if (this.nls) {
            this.nls.stop();
        }
        if (this.nfs) {
            this.nfs.stop();
        }
    }
}

module.exports = CustomMediaServer;