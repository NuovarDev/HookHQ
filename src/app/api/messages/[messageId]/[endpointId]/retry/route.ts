import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiHelpers";

/**
 * @swagger
 * /api/messages/{messageId}/{endpointId}/retry:
 *   post:
 *     summary: Retry Failed Message for Specific Endpoint
 *     description: Manually retry a failed webhook message for a specific endpoint
 *     tags:
 *       - Messages
 *     parameters:
 *       - name: messageId
 *         in: path
 *         required: true
 *         description: The webhook message ID to retry
 *         schema:
 *           type: string
 *       - name: endpointId
 *         in: path
 *         required: true
 *         description: The endpoint ID to retry
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 retryId:
 *                   type: string
 *                   description: ID of the retry attempt
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Failed message not found
 *       500:
 *         description: Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string; endpointId: string }> }
) {
  try {
    const authResult = await authenticateApiRequest(request, { messages: ["create"] });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { messageId, endpointId } = await params;

    if (!messageId || !endpointId) {
      return NextResponse.json({ 
        error: "Message ID and Endpoint ID are required" 
      }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    
    // Construct the KV key for the failed message
    const failedMessageKey = `failed:${messageId}:${endpointId}`;

    // Get the failed message from KV
    const failedMessageRaw = await env.KV.get(failedMessageKey);
    
    if (!failedMessageRaw) {
      return NextResponse.json({ 
        error: "Failed message not found or expired" 
      }, { status: 404 });
    }

    const failedMessageData = JSON.parse(failedMessageRaw);
    const { webhookData } = failedMessageData;

    // Generate a new webhook ID for the retry
    const retryWebhookId = crypto.randomUUID();
    
    // Create a new message for the queue with the original data
    const retryMessage = {
      id: retryWebhookId,
      endpointId: webhookData.endpointId,
      eventType: webhookData.eventType,
      eventId: webhookData.eventId,
      payload: webhookData.payload,
      timestamp: new Date().toISOString(),
      idempotencyKey: webhookData.idempotencyKey,
      retryConfig: webhookData.retryConfig,
      isManualRetry: true,
      originalMessageId: messageId
    };

    // Send the retry message to the queue
    await env.WEBHOOKS.send(retryMessage);

    // Remove the failed message from KV since we're retrying it
    await env.KV.delete(failedMessageKey);

    return NextResponse.json({
      message: "Message queued for retry successfully",
      retryId: retryWebhookId,
      originalMessageId: messageId,
      endpointId: endpointId
    });

  } catch (error) {
    console.error("Error retrying failed message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
