import i18n from '../../i18n';
import { ApiError } from "./apiError";

export function getUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_QUERY":
      case "HTTP_400":
      case "HTTP_422":
        return i18n.t('errors.invalidQuery');

      case "NO_AIR_DATA":
        return i18n.t('errors.noAirData');

      case "NO_HISTORY_DATA":
        return i18n.t('errors.noHistoryData');

      case "RATE_LIMIT":
      case "HTTP_429":
      case "UPSTREAM_RATE_LIMIT":
        return i18n.t('errors.rateLimit');

      case "UPSTREAM_TIMEOUT":
        return i18n.t('errors.upstreamTimeout');

      case "UPSTREAM_NETWORK":
      case "NETWORK_ERROR":
        return i18n.t('errors.networkError');

      case "UPSTREAM_5XX":
      case "UPSTREAM_ERROR":
      case "UPSTREAM_UNAVAILABLE":
        return i18n.t('errors.upstreamUnavailable');

      case "UPSTREAM_AUTH":
        return i18n.t('errors.serverConfigError');

      case "INVALID_JSON":
      case "INVALID_RESPONSE":
      case "UPSTREAM_MALFORMED":
        return i18n.t('errors.invalidResponse');

      case "NOT_FOUND":
      case "HTTP_404":
        return i18n.t('errors.notFound');

      default:
        if (error.status === 0) {
          return i18n.t('errors.networkErrorShort');
        }
        if (error.status === 404) return i18n.t('errors.notFound');
        if (error.status === 429) return i18n.t('errors.tooManyRequests');
        if (error.status >= 500) {
          return i18n.t('errors.serverError');
        }
        return error.message || i18n.t('errors.unexpected');
    }
  }

  if (error instanceof TypeError) {
    return i18n.t('errors.networkErrorShort');
  }

  if (error instanceof Error) {
    return error.message || i18n.t('errors.unexpected');
  }

  return i18n.t('errors.unexpected');
}
