import { aiRepository } from "../repositories/ai.repository";
import { hotelRepository } from "../repositories/hotel.repository";
import { roomtypeRepository } from "../repositories/roomtype.repository";
import type { OnboardingInput } from "../validators/onboarding.schema";

export const onboardingService = {
  async completeOnboarding(hotelId: string, input: OnboardingInput) {
    const hotel = await hotelRepository.update(hotelId, {
      ...input.hotel,
      webbookingUrl: input.hotel.hasWebbooking ? input.hotel.webbookingUrl ?? null : null,
    });

    const roomtype = input.roomtype
      ? await roomtypeRepository.create(hotelId, input.roomtype)
      : null;

    const faqs = await aiRepository.createFaqs(hotelId, input.aiFaqs);

    const completedHotel = input.complete
      ? await hotelRepository.markOnboardingCompleted(hotelId)
      : hotel;

    return {
      hotel: completedHotel,
      roomtype,
      faqs,
    };
  },
};
