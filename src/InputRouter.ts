import { EventEmitter } from 'events';

export class InputRouter extends EventEmitter {
    private inPrefixMode = false;
    private readonly PREFIX_CHAR = 0x02; // Ctrl+B

    constructor(private stdin: NodeJS.ReadStream) {
        super();
        this.setup();
    }

    private setup() {
        if (this.stdin.isTTY && this.stdin.setRawMode) {
            this.stdin.setRawMode(true);
        }
        this.stdin.resume();
        this.stdin.on('data', this.handleData);
    }

    private handleData = (data: Buffer) => {
        if (this.inPrefixMode) {
            this.inPrefixMode = false;
            const key = data.toString('utf-8');
            const paneId = parseInt(key, 10);
            if (!isNaN(paneId) && paneId >= 1 && paneId <= 3) {
                this.emit('pane_switch', paneId);
                return;
            }
            // If invalid key after prefix, swallow it or pass it? Just reset mode.
            return;
        }

        if (data.length === 1 && data[0] === this.PREFIX_CHAR) {
            this.inPrefixMode = true;
            return;
        }

        this.emit('data', data);
    }
}
