import { sink } from "numaflow";

const logSink = {
  async sink(datumStream) {
    let responses = [];

    for (const datum of datumStream) {
      console.log("User defined Sink: ", datum.id);
      const response = {
        id: datum.id,
        success: true,
      };
      responses.push(response);
    }
    return responses;
  },
};

sink.createServer(logSink).start();
