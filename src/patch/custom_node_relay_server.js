/*
 * Created on Tue Apr 04 2023
 * @author Hung Le <hungls>
 * @email hunglsxx@gmail.com
 */

const NodeRelayServer = require("../node_relay_server");
const Logger = require('../node_core_logger');

const NodeRelaySession = require('./custom_node_relay_session');
const context = require('../node_core_ctx');

class CustomRelayServer extends NodeRelayServer {
    constructor(config) {
        super(config);
    }
    onRelayPush(url, app, name, loop, params) {
        let conf = {};
        conf.params = params;
        conf.app = app;
        conf.name = name;
        conf.loop = loop;
        conf.mode = 'push';
        conf.ffmpeg = this.config.relay.ffmpeg;
        conf.inPath = `rtmp://127.0.0.1:${this.config.rtmp.port}/${app}/${name}`;
        if (app == 'external') conf.inPath = `${name}`;
        conf.ouPath = url;
        let session = new NodeRelaySession(conf);
        const id = session.id;
        context.sessions.set(id, session);
        session.on('end', (id) => {
            context.sessions.delete(id);
            this.dynamicSessions.delete(id);
        });
        this.dynamicSessions.set(id, session);
        session.run();
        Logger.log('[relay dynamic push] start id=' + id, conf.inPath, 'to', conf.ouPath);
        context.nodeEvent.emit("relayPushDone", id, conf);
    }
}

module.exports = CustomRelayServer;