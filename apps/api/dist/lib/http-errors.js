export class HttpError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
export function assert(condition, statusCode, message, details) {
    if (!condition)
        throw new HttpError(statusCode, message, details);
}
