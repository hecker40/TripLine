import { AppError } from "../errors";

// Affiliate endpoints are public configuration; bearer credentials remain server-only.
export const DEFAULT_BOOKING_MCP_URL =
  "https://demandapi-mcp.booking.com/v1/mcp/8132308";

export function bookingEndpoint(): URL {
  const configured = process.env.BOOKING_MCP_URL?.trim();
  const affiliate = process.env.BOOKING_AFFILIATE_ID?.trim();
  try {
    if (affiliate && !/^\d+$/.test(affiliate))
      throw new Error("Invalid affiliate");
    const url = new URL(
      configured ||
        (affiliate
          ? `https://demandapi-mcp.booking.com/v1/mcp/${affiliate}`
          : DEFAULT_BOOKING_MCP_URL),
    );
    if (
      url.origin !== "https://demandapi-mcp.booking.com" ||
      !/^\/v1\/mcp\/\d+$/.test(url.pathname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("Invalid endpoint");
    if (configured && affiliate && !url.pathname.endsWith(`/${affiliate}`))
      throw new Error("Affiliate mismatch");
    return url;
  } catch {
    throw new AppError(
      "BOOKING_CONFIG_INVALID",
      "Use an official Booking.com MCP URL and a matching affiliate ID (if set). No token was sent.",
      503,
    );
  }
}

export function bookingConfigured(): boolean {
  try {
    bookingEndpoint();
    return Boolean(process.env.BOOKING_BEARER_TOKEN?.trim());
  } catch {
    return false;
  }
}
