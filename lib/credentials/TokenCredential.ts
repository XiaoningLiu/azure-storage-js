import { RequestPolicy, RequestPolicyOptions } from "ms-rest-js";

import { Credential } from "../credentials/Credential";
import { TokenCredentialPolicy } from "../policies/TokenCredentialPolicy";

/**
 * TokenCredential is a Credential used to generate a TokenCredentialPolicy.
 * Renew token by setting a new token string value to token property.
 *
 * @export
 * @class TokenCredential
 * @extends {Credential}
 * @example
 *  const tokenCredential = new TokenCredential("token");
 *  const pipeline = StorageURL.newPipeline(tokenCredential);
 *
 *  // List containers
 *  const serviceURL = new ServiceURL("https://mystorageaccount.blob.core.windows.net", pipeline);
 *
 *  // Set up a timer to refresh the token
 *  const timerID = setInterval(() => {
 *    // Update token by accessing to public tokenCredential.token
 *    tokenCredential.token = "updatedToken";
 *    // WARNING: Timer must be manually stopped! It will forbid GC of tokenCredential
 *    if (shoudStop()) {
 *      clearInterval(timerID);
 *    }
 *  }, 60 * 60 * 1000); // Set an interval time before your token expired
 *
 */
export class TokenCredential extends Credential {
  /**
   * Mutable token value. You can set a renewed token value to this property,
   * for example, when an OAuth token is expired.
   *
   * @type {string}
   * @memberof TokenCredential
   */
  public token: string;

  /**
   * Creates an instance of TokenCredential.
   * @param {string} token
   * @memberof TokenCredential
   */
  constructor(token: string) {
    super();
    this.token = token;
  }

  /**
   * Creates a TokenCredentialPolicy object.
   *
   * @param {RequestPolicy} nextPolicy
   * @param {RequestPolicyOptions} options
   * @returns {TokenCredentialPolicy}
   * @memberof TokenCredential
   */
  public create(
    nextPolicy: RequestPolicy,
    options: RequestPolicyOptions
  ): TokenCredentialPolicy {
    return new TokenCredentialPolicy(nextPolicy, options, this);
  }
}
