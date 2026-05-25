import { apiOk } from "../http/api-response";

interface LineWebhookInput {
  hotelId: string;
  rawBody: string;
  signature: string | null;
}

export const lineWebhookService = {
  async handleWebhook(input: LineWebhookInput) {
    JSON.parse(input.rawBody || "{\"events\":[]}");

    return apiOk({
      hotelId: input.hotelId,
      received: true,
      signaturePresent: Boolean(input.signature),
    });
  },
};
