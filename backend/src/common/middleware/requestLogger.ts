import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = uuidv4();
  req.correlationId = correlationId;
  
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || 'anonymous';
  
  console.log(`[${timestamp}] [${correlationId}] ${req.method} ${req.path} - User: ${userId} - START`);
  
  const originalSend = res.send;
  res.send = function(body) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${correlationId}] ${req.method} ${req.path} - User: ${userId} - Status: ${res.statusCode} - END`);
    return originalSend.call(this, body);
  };
  
  next();
};
