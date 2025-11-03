export type AppError = {
  details: Error | string | null;
  message?: string;
  severity: "info" | "warning" | "error";
  timestamp: number;
};

class ErrorHandler {
  private listeners: Set<(error: AppError) => void> = new Set();
  subscribe(listener: (error: AppError) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(error: AppError) {
    this.listeners.forEach((listener) => listener(error));
  }
  handle(
    severity: AppError["severity"],
    details: Error | string | null,
    message?: string,
  ) {
    const error: AppError = {
      details,
      severity,
      message,
      timestamp: Date.now(),
    };
    this.notifyListeners(error);
    let logger;
    switch (severity) {
      case "info":
        logger = console.info;
        break;
      case "warning":
        logger = console.warn;
        break;
      case "error":
        logger = console.error;
        break;
    }
    logger(
      `[${new Date().toISOString()}]`,
      message,
      typeof details === "string" ? details : details?.message,
    );
    if (details && typeof details !== "string") {
      logger(details);
    }
  }
}

export const errorHandler = new ErrorHandler();

export const info = (details: Error | string | null, message?: string) => {
  errorHandler.handle("info", details, message);
};

export const warning = (details: Error | string | null, message?: string) => {
  errorHandler.handle("warning", details, message);
};

export const error = (details: Error | string | null, message?: string) => {
  errorHandler.handle("error", details, message);
};

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  severity: AppError["severity"],
  message?: string,
) {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(severity, error as Error, message);
    return null;
  }
}
