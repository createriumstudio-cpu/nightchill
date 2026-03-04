/**
 * Tests for SNS Webhook business logic
 */

jest.mock("../db", () => ({
  getDb: jest.fn(),
}));

import { getDb } from "../db";
import {
  authenticateWebhook,
  validateWebhookBody,
  processWebhook,
  getScheduledContents,
} from "../sns-webhook";

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const MOCK_SECRET = "test-webhook-secret";

describe("sns-webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SNS_WEBHOOK_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    delete process.env.SNS_WEBHOOK_SECRET;
  });

  describe("authenticateWebhook", () => {
    it("should return false when secret is not set", () => {
      delete process.env.SNS_WEBHOOK_SECRET;
      expect(authenticateWebhook(`Bearer ${MOCK_SECRET}`)).toBe(false);
    });

    it("should return false without auth header", () => {
      expect(authenticateWebhook(null)).toBe(false);
    });

    it("should return false with wrong token", () => {
      expect(authenticateWebhook("Bearer wrong-token")).toBe(false);
    });

    it("should return true with correct token", () => {
      expect(authenticateWebhook(`Bearer ${MOCK_SECRET}`)).toBe(true);
    });
  });

  describe("validateWebhookBody", () => {
    it("should reject null/undefined", () => {
      expect(validateWebhookBody(null)).toBe(false);
      expect(validateWebhookBody(undefined)).toBe(false);
    });

    it("should reject non-integer contentId", () => {
      expect(validateWebhookBody({ contentId: "abc", action: "publish", platform: "instagram" })).toBe(false);
      expect(validateWebhookBody({ contentId: 1.5, action: "publish", platform: "instagram" })).toBe(false);
    });

    it("should reject invalid action", () => {
      expect(validateWebhookBody({ contentId: 1, action: "invalid", platform: "instagram" })).toBe(false);
    });

    it("should reject invalid platform", () => {
      expect(validateWebhookBody({ contentId: 1, action: "publish", platform: "facebook" })).toBe(false);
    });

    it("should accept valid body", () => {
      expect(validateWebhookBody({ contentId: 1, action: "publish", platform: "instagram" })).toBe(true);
      expect(validateWebhookBody({ contentId: 2, action: "schedule", platform: "x" })).toBe(true);
      expect(validateWebhookBody({ contentId: 3, action: "fail", platform: "tiktok" })).toBe(true);
    });

    it("should accept optional platformPostId", () => {
      expect(
        validateWebhookBody({ contentId: 1, action: "publish", platform: "x", platformPostId: "post_123" }),
      ).toBe(true);
    });

    it("should reject non-string platformPostId", () => {
      expect(
        validateWebhookBody({ contentId: 1, action: "publish", platform: "x", platformPostId: 123 }),
      ).toBe(false);
    });
  });

  describe("processWebhook", () => {
    it("should return error when DB is not available", async () => {
      mockGetDb.mockReturnValue(null);
      const result = await processWebhook({ contentId: 1, action: "publish", platform: "instagram" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(503);
      }
    });

    it("should return 404 when content not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

      const result = await processWebhook({ contentId: 999, action: "publish", platform: "instagram" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });

    it("should update status to scheduled", async () => {
      const mockSetFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSetFn });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, platform: "instagram" }]),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect, update: mockUpdate } as unknown as ReturnType<typeof getDb>);

      const result = await processWebhook({ contentId: 1, action: "schedule", platform: "instagram" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.status).toBe("scheduled");
      }
      expect(mockSetFn.mock.calls[0][0].status).toBe("scheduled");
      expect(mockSetFn.mock.calls[0][0].scheduledAt).toBeInstanceOf(Date);
    });

    it("should update status to published with platformPostId", async () => {
      const mockSetFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSetFn });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, platform: "x" }]),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect, update: mockUpdate } as unknown as ReturnType<typeof getDb>);

      const result = await processWebhook({
        contentId: 1,
        action: "publish",
        platform: "x",
        platformPostId: "post_123",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.status).toBe("published");
      }
      const setArg = mockSetFn.mock.calls[0][0];
      expect(setArg.status).toBe("published");
      expect(setArg.publishedAt).toBeInstanceOf(Date);
      expect(setArg.platformPostId).toBe("post_123");
    });

    it("should update status to failed", async () => {
      const mockSetFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSetFn });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, platform: "tiktok" }]),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect, update: mockUpdate } as unknown as ReturnType<typeof getDb>);

      const result = await processWebhook({ contentId: 1, action: "fail", platform: "tiktok" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.status).toBe("failed");
      }
    });
  });

  describe("getScheduledContents", () => {
    it("should return error when DB is not available", async () => {
      mockGetDb.mockReturnValue(null);
      const result = await getScheduledContents();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(503);
      }
    });

    it("should return generated content list", async () => {
      const mockItems = [
        {
          id: 1,
          featureSlug: "tokyo-new-spots-2026-w10",
          platform: "instagram",
          content: { slides: [{ text: "test" }], hashtags: ["test"] },
          status: "generated",
          generatedAt: new Date("2026-03-01"),
        },
        {
          id: 2,
          featureSlug: "tokyo-new-spots-2026-w10",
          platform: "x",
          content: { tweets: [{ text: "test" }] },
          status: "generated",
          generatedAt: new Date("2026-03-01"),
        },
      ];
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockItems),
          }),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

      const result = await getScheduledContents();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].platform).toBe("instagram");
        expect(result.data[1].platform).toBe("x");
      }
    });

    it("should return empty list when no generated content", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

      const result = await getScheduledContents();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
