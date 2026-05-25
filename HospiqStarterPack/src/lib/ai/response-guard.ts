export interface ResponseGuardResult {
  allowed: boolean;
  response: string;
  reasons: string[];
}

export function guardAiResponse(input: {
  response: string;
  hotelId: string;
  maxReplyLength: number;
}): ResponseGuardResult {
  const reasons: string[] = [];
  const response = input.response.trim();

  if (!response) reasons.push("empty_response");
  if (response.length > input.maxReplyLength) reasons.push("reply_too_long");
  if (referencesDifferentHotelId(response, input.hotelId)) reasons.push("cross_hotel_reference");

  return {
    allowed: reasons.length === 0,
    response,
    reasons,
  };
}

function referencesDifferentHotelId(response: string, hotelId: string): boolean {
  return response.includes("hotel_id") && !response.includes(hotelId);
}
