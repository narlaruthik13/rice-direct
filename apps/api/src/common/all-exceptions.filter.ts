import { STATUS_CODES } from "node:http";
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "@kisa/db";
import type { ApiError } from "@kisa/shared";

const body = (statusCode: number, message: string, extra: Partial<ApiError> = {}): ApiError => ({
  statusCode,
  error: STATUS_CODES[statusCode] ?? "Error",
  message,
  ...extra,
});

/**
 * Turns every error into an ApiError. Client errors keep their message; anything
 * unexpected (Prisma, bugs) becomes a generic 500. Stack traces, SQL and Prisma
 * details are logged on the server only, never sent to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions");

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = req.headers["x-request-id"] as string | undefined;

    const out = this.toApiError(exception);
    if (out.statusCode >= 500) {
      const detail = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${req.method} ${req.originalUrl} -> ${out.statusCode} [${requestId}]`, detail);
    }
    res.status(out.statusCode).json({ ...out, requestId });
  }

  private toApiError(e: unknown): ApiError {
    if (e instanceof HttpException) {
      const status = e.getStatus();
      const r = e.getResponse();
      if (typeof r === "string") return body(status, r);
      const { message, issues } = r as { message?: string | string[]; issues?: ApiError["issues"] };
      const text = Array.isArray(message) ? message.join("; ") : (message ?? e.message);
      return body(status, text, issues ? { issues } : {});
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return body(404, "Not found");
      if (e.code === "P2002") return body(409, "A record with these details already exists");
    }
    // Express body-parser errors (invalid JSON, body too large) carry a 4xx status.
    const status = (e as { status?: unknown })?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return body(status, status === 413 ? "Request body too large" : "Invalid request body");
    }
    return body(500, "Something went wrong");
  }
}
