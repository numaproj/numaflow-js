const numa = require('numaflow');
const source = numa.source;

const sleep = (duration_ms) => new Promise((resolve) => setTimeout(resolve, duration_ms));

const fixedDataGenerator = {
  offsetMap: new Map(), // Map to track offsets

  async read(readRequest) {
    await sleep(readRequest.timeout_ms);
    const num = Math.floor(Math.random() * 1000);
    const offset = source.createOffsetWithDefaultPartitionId(num.toString(10));
    this.offsetMap.set(offset.partitionId, offset); // Track the offset
    return [
      {
        value: Buffer.from('test data'),
        offset: offset,
        eventTime: new Date(Date.now()),
      },
    ];
  },

  async ack(offsets) {
    offsets.forEach((offset) => {
      if (this.offsetMap.delete(offset.partitionId)) {
        return;
      }
      console.error(`Offset not found in map: ${JSON.stringify(offset)}`);
    });
  },

  async pending() {
    return this.offsetMap.size; // Return the number of pending offsets
  },

  async partitions() {
    return [0];
  },
};

source.createServer(fixedDataGenerator).start();
