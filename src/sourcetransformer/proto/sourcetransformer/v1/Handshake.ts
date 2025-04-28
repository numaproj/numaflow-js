// Original file: proto/sourcetransformer.proto


/**
 * Handshake message between client and server to indicate the start of transmission.
 */
export interface Handshake {
  /**
   * Required field indicating the start of transmission.
   */
  'sot'?: (boolean);
}

/**
 * Handshake message between client and server to indicate the start of transmission.
 */
export interface Handshake__Output {
  /**
   * Required field indicating the start of transmission.
   */
  'sot': (boolean);
}
