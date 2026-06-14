export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map