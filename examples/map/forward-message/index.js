import { map } from 'numaflow';

const udfMapper = {
  drop: false,

  async map(keys, datum) {
    const data = JSON.stringify(datum);
    console.log(`Running user-map function: keys=${keys} datum=${data}`);
    const msg = {
      value: Buffer.from('value-from-map'),
      keys: ['test-key1', 'test-key2'],
    };
    const result = this.drop ? msg : map.messageToDrop();
    this.drop = !this.drop;
    return [result];
  },
};

map.createServer(udfMapper).start();
