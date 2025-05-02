export interface Response {
    id: string;
    success?: boolean;
    fallback?: boolean;
    serve?: boolean;
    serveResponse?: Uint8Array;
    err?: string;
}

export interface Datum {
    id: string;
    keys: string[];
    value: Buffer;
    eventTime: Date;
    watermark: Date;
    headers: Record<string, string>;
}

export interface Sinker {
    sink(data: Datum[]): Promise<Response[]>;
}
