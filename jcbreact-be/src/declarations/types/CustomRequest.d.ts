import { Request } from 'express';
import { User } from '@/types/Models'

export interface CustomRequest extends Request {
    user?: User;
}

/**
 *  "sub": "4b3c9e99-39e4-4de0-aa3c-bc2abf686e57",
    "email_verified": false,
    "name": "Salim Shamim",
    "preferred_username": "sshamim",
    "given_name": "Salim",
    "family_name": "Shamim",
    "email": "salim.shamim.94@gmail.com"
 */