/*
 * Created on Wed Apr 05 2023
 * @author Hung Le <hungls>
 * @email hunglsxx@gmail.com
 */

const NodeRelaySession = require("../node_relay_session");
const Logger = require('../node_core_logger');
const { spawn } = require('child_process');
const RTSP_TRANSPORT = ['udp', 'tcp', 'udp_multicast', 'http'];
const context = require('../node_core_ctx');

class CustomRelaySession extends NodeRelaySession {
    constructor(conf) {
        super(conf);
    }

    run() {
        let argv = ['-re', '-i', this.conf.inPath];

        for (let i in this.conf.ouPath) {
            let format = this.conf.ouPath[i].startsWith('rtsp://') ? 'rtsp' : 'flv';
            argv = argv.concat(['-c', 'copy', '-f', format, this.conf.ouPath[i]]);
        }

        if (this.conf.inPath[0] === '/' || this.conf.inPath[1] === ':') {
            argv.unshift('-1');
            argv.unshift('-stream_loop');
        } else if (this.conf.loop > 1 || this.conf.loop == -1) {
            argv.unshift(this.conf.loop);
            argv.unshift('-stream_loop');
        }

        if (this.conf.inPath.startsWith('rtsp://') && this.conf.rtsp_transport) {
            if (RTSP_TRANSPORT.indexOf(this.conf.rtsp_transport) > -1) {
                argv.unshift(this.conf.rtsp_transport);
                argv.unshift('-rtsp_transport');
            }
        }

        Logger.log('[relay task] id=' + this.id, 'cmd=ffmpeg', argv.join(' '));

        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
        this.ffmpeg_exec.on('error', (e) => {
            Logger.ffdebug(e);
        });

        this.ffmpeg_exec.stdout.on('data', (data) => {
            Logger.ffdebug(`FF_LOG:${data}`);
        });

        this.ffmpeg_exec.stderr.on('data', (data) => {
            Logger.ffdebug(`FF_LOG:${data}`);
        });

        this.ffmpeg_exec.on('close', (code) => {
            Logger.log('[relay end] id=' + this.id, 'code=' + code);
            this.emit('end', this.id);
            context.nodeEvent.emit("relayEnd", this.id, code, this.conf);
        });
    }
}

module.exports = CustomRelaySession;