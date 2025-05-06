import { sink } from 'numaflow';

const fbSink = {
    async sink(datumStream) {
        let responses = [];
        for (const datum of datumStream) {
            const response = {
                id: datum.id,
                fallback: true,
            };
            responses.push(response);
        }
        return responses;
    },
};
sink.createServer(fbSink).start();
