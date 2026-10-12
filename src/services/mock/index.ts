import type { Services } from "../contracts";
import { mockAuth } from "./auth";
import { mockCatalog } from "./catalog";
import { resetDb } from "./db";
import { mockMessages, mockNotifications, mockPlaces, mockWallet } from "./inbox";
import { latency } from "./latency";
import { clearMedia, mockMedia } from "./media";
import { mockOrders } from "./orders";
import { mockSocial } from "./social";
import { mockStudio } from "./studio";

export const mockServices: Services = {
  auth: mockAuth,
  catalog: mockCatalog,
  social: mockSocial,
  orders: mockOrders,
  notifications: mockNotifications,
  messages: mockMessages,
  wallet: mockWallet,
  places: mockPlaces,
  studio: mockStudio,
  media: mockMedia,
  demo: {
    async reset() {
      await latency();
      await clearMedia();
      await resetDb();
    },
  },
};
