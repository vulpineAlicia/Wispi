import { ApiError } from "./apiError";

export function getUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_QUERY":
      case "HTTP_400":
      case "HTTP_422":
        return "Please enter a valid city name.";

      case "NO_AIR_DATA":
        return "No air quality data for this location.";

      case "NO_HISTORY_DATA":
        return "No history data for this location.";

      case "RATE_LIMIT":
      case "HTTP_429":
      case "UPSTREAM_RATE_LIMIT":
        return "Too many requests right now. Please try again in a minute.";

      case "UPSTREAM_TIMEOUT":
        return "The provider is taking too long to respond. Try again.";

      case "UPSTREAM_NETWORK":
      case "NETWORK_ERROR":
        return "Network error. Please check your connection and try again.";

      case "UPSTREAM_5XX":
      case "UPSTREAM_ERROR":
      case "UPSTREAM_UNAVAILABLE":
        return "The data provider is temporarily unavailable. Please try again later.";

      case "UPSTREAM_AUTH":
        return "Server configuration error. Please try again later.";

      case "INVALID_JSON":
      case "INVALID_RESPONSE":
      case "UPSTREAM_MALFORMED":
        return "Server returned an invalid response. Please try again later.";

      case "NOT_FOUND":
      case "HTTP_404":
        return "Not found.";

      default:
        if (error.status === 0) {
          return "Network error. Please check your connection.";
        }
        if (error.status === 404) return "Not found.";
        if (error.status === 429) return "Too many requests. Try again soon.";
        if (error.status >= 500) {
          return "Server error. Please try again later.";
        }
        return error.message || "Something went wrong.";
    }
  }

  if (error instanceof TypeError) {
    return "Network error. Please check your connection.";
  }

  if (error instanceof Error) {
    return error.message || "Something went wrong.";
  }

  return "Unexpected error occurred.";
}