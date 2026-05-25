export interface HospiqAiContext {
  hotelId: string;
  hotelName: string;
  hasWebbooking: boolean;
  webbookingUrl: string | null;
  roomtypes: Array<{
    id: string;
    name: string;
    description: string | null;
    moodDescription: string | null;
    basePrice: number;
    totalRooms: number;
    amenities: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    category: string | null;
  }>;
  aiSetting: {
    assistantName: string;
    assistantGenderTone: string;
    fallbackToAdminEnabled: boolean;
    adminContactMessage: string | null;
  };
}

export interface GenerateHospiqReplyInput {
  hotelId: string;
  lineUserId: string;
  message: string;
}

export interface GenerateHospiqReplyResult {
  reply: string;
  intent: string;
  aiResponseSource: string;
}
