/**
 * @swagger
 * /myStub:
 *   post:
 *     tags: [Webhooks]
 *     operationId: subscribe
 *     summary: Subscribes a receiver to a webhook event for orders or order changes.
 *     description: When subscribing to a webhook, the `subscribe` endpoint expects
 *       to call the URL as a test to see if it receives a HTTP 200 response and an
 *       ID. This request contains header `x-subscribe-test-id` so that the test
 *       response body may be set to the value of the header. If a response of
 *       anything other than HTTP 200 and body of the ID is received, the subscribe
 *       call will return error HTTP 412.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionRequest'
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionRequest'
 *       '400':
 *         description: Bad Request
 *       '412':
 *         description: Conflict - cannot connect to receiver URL
 *       '500':
 *         description: Server error
 */
export function myStub (): void {}
