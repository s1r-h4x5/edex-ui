/**
 * IPC abstraction layer for eDEX-UI
 * Provides a cleaner event-based interface for electron IPC
 */

const EventEmitter = require("events");

/**
 * IPC Channel Manager
 * Unifies IPC communication with a consistent interface
 */
class IPCManager extends EventEmitter {
    constructor(ipcInstance) {
        super();
        this.ipc = ipcInstance;
        this.handlers = new Map();
        this.requestHandlers = new Map();
        this.init();
    }

    /**
   * Initialize IPC listeners
   * @private
   */
    init() {
    // Listen for all messages
        this.ipc.on("ipc-message", (event, channel, args) => {
            this.emit(channel, args, event);

            const handler = this.handlers.get(channel);
            if (handler) {
                handler(args, event);
            }
        });

        // Listen for request/response pattern
        this.ipc.on("ipc-request", (event, channel, id, args) => {
            const handler = this.requestHandlers.get(channel);
            if (handler) {
                Promise.resolve(handler(args, event))
                    .then(result => {
                        event.reply("ipc-response", channel, id, null, result);
                    })
                    .catch(error => {
                        event.reply("ipc-response", channel, id, error.message);
                    });
            } else {
                event.reply("ipc-response", channel, id, `No handler for channel: ${channel}`);
            }
        });
    }

    /**
   * Send event without expecting response
   * @param {string} channel - Channel name
   * @param {*} args - Arguments to send
   */
    send(channel, args = {}) {
        this.emit("send", { channel, args });
        if (this.ipc.send) {
            this.ipc.send("ipc-send", channel, args);
        }
    }

    /**
   * Send request and wait for response
   * @param {string} channel - Channel name
   * @param {*} args - Arguments to send
   * @param {number} timeout - Response timeout in ms
   * @returns {Promise}
   */
    async request(channel, args = {}, timeout = 5000) {
        const id = Math.random().toString(36);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`IPC request timeout on channel: ${channel}`));
            }, timeout);

            const handler = (eventChannel, respId, error, result) => {
                if (eventChannel === channel && respId === id) {
                    clearTimeout(timer);
                    this.ipc.removeListener("ipc-response", handler);
                    error ? reject(new Error(error)) : resolve(result);
                }
            };

            this.ipc.on("ipc-response", handler);
            this.ipc.send("ipc-request", channel, id, args);
        });
    }

    /**
   * Register event handler
   * @param {string} channel - Channel name
   * @param {function} handler - Handler function
   */
    on(channel, handler) {
        this.handlers.set(channel, handler);
        return this;
    }

    /**
   * Unregister event handler
   * @param {string} channel - Channel name
   */
    off(channel) {
        this.handlers.delete(channel);
        return this;
    }

    /**
   * Register request handler
   * @param {string} channel - Channel name
   * @param {function} handler - Handler function (can be async)
   */
    onRequest(channel, handler) {
        this.requestHandlers.set(channel, handler);
        return this;
    }

    /**
   * Unregister request handler
   * @param {string} channel - Channel name
   */
    offRequest(channel) {
        this.requestHandlers.delete(channel);
        return this;
    }

    /**
   * Remove all handlers for a channel
   * @param {string} channel - Channel name
   */
    clear(channel) {
        if (channel) {
            this.handlers.delete(channel);
            this.requestHandlers.delete(channel);
        } else {
            this.handlers.clear();
            this.requestHandlers.clear();
        }
        return this;
    }
}

/**
 * Create IPC manager for main process (Electron IPC Main)
 * @param {object} ipcMain - electron.ipcMain
 * @returns {IPCManager}
 */
function createMainIPCManager(ipcMain) {
    return new IPCManager(ipcMain);
}

/**
 * Create IPC manager for renderer process (Electron IPC Renderer)
 * @param {object} ipcRenderer - electron.ipcRenderer
 * @returns {IPCManager}
 */
function createRendererIPCManager(ipcRenderer) {
    return new IPCManager(ipcRenderer);
}

module.exports = {
    IPCManager,
    createMainIPCManager,
    createRendererIPCManager
};
