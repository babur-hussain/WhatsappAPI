export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: {
        message: string;
        code?: string;
    } | null;
}

export const successResponse = <T>(data: T): ApiResponse<T> => {
    return {
        success: true,
        data,
        error: null,
    };
};

export const errorResponse = (message: string, code?: string): ApiResponse<null> => {
    return {
        success: false,
        data: null,
        error: {
            message,
            code,
        },
    };
};
