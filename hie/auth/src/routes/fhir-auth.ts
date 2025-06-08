import express, { NextFunction, Response, Request } from "express";
import fetch from "cross-fetch";


const router = express.Router();
const FHIR_BASE_URL = process.env['FHIR_BASE_URL'];

if (!FHIR_BASE_URL) {
    throw new Error('FHIR_BASE_URL environment variable is not set');
}

// Middleware setup
router.use(express.json());

// Custom error type
interface ProxyError extends Error {
    status?: number;
}

// Error handler
const errorHandler = (err: ProxyError, req: Request, res: Response, next: NextFunction) => {
    console.error('Proxy Error:', {
        message: err.message,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error'
    });
};

// Proxy handler for all /fhir/* requests
const proxyFHIRRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Remove /fhir prefix from the path
        console.log(req.path);
        const targetPath = req.path;

        // console.log(url.toString());
        // const urlString = FHIR_BASE_URL.endsWith("/") ? FHIR_BASE_URL : `${FHIR_BASE_URL}/`;
        const urlString = `${FHIR_BASE_URL.replace(/\/$/, "")}${targetPath}`;
        // console.log(urlString);
        const url = new URL(urlString);


        
        // Add query parameters
        Object.entries(req.query).forEach(([key, value]) => {
            url.searchParams.append(key, value as string);
        });

        // Prepare headers
        // const headers = new Headers(req.headers as HeadersInit);
        // headers.delete('host');
        // headers.delete('connection');

        // Prepare headers as a plain object
        const headers: Record<string, string> = {};
        Object.entries(req.headers).forEach(([key, value]) => {
            if (value && !['host', 'connection'].includes(key.toLowerCase())) {
                headers[key] = Array.isArray(value) ? value[0] : value;
            }
        });

         // Ensure content-type is set for requests with body
         if (['POST', 'PUT', 'PATCH'].includes(req.method) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        console.log(urlString);

        const response = await fetch(url.toString(), {
            method: req.method,
            headers: {...headers, ['Content-Type']: 'application/json'},
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });

        // Forward response headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        console.log(response);

        if (!response.ok) {
            const error = new Error(`FHIR server responded with status ${response.status}`) as ProxyError;
            error.status = response.status;
            throw error;
        }

        const responseData = await response.json();
        res.status(response.status).json(responseData);

    } catch (error) {
        next(error);
    }
};

// Mount the proxy handler for all requests under /fhir
router.all('/*', proxyFHIRRequest);

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        fhirBaseUrl: FHIR_BASE_URL 
    });
});

// Error handling middleware
router.use(errorHandler);

export default router;