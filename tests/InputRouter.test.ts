import { InputRouter } from '../src/InputRouter';
import { EventEmitter } from 'events';

describe('InputRouter', () => {
    let router: InputRouter;
    let mockStdin: EventEmitter & { isTTY: boolean; setRawMode: jest.Mock; resume: jest.Mock };

    beforeEach(() => {
        mockStdin = Object.assign(new EventEmitter(), {
            isTTY: true,
            setRawMode: jest.fn(),
            resume: jest.fn()
        });
        router = new InputRouter(mockStdin as any);
    });

    it('emits pane_switch when prefix (Ctrl+B) and pane number are pressed', () => {
        const spy = jest.fn();
        router.on('pane_switch', spy);
        
        mockStdin.emit('data', Buffer.from([0x02])); // Ctrl+B
        mockStdin.emit('data', Buffer.from('2')); // Switch to pane 2
        
        expect(spy).toHaveBeenCalledWith(2);
    });

    it('emits raw data if not in prefix mode', () => {
        const spy = jest.fn();
        router.on('data', spy);
        
        const data = Buffer.from('hello');
        mockStdin.emit('data', data);
        
        expect(spy).toHaveBeenCalledWith(data);
    });
});
