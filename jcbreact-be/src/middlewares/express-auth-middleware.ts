import { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
//import jwt from "jsonwebtoken";
const { AUTH_VERIFY_URL } = process.env;

//const key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzH84R05FEobo3491uedpqeehmT4dbg602Kaf1jrxnZUAF5RKMuYQYl8YeOzul3L+llp58ijP5eiDewg1/eFp3x63wFR7AT6Ta1RwxOdSj/Xs9qWHTQLlaoWSrU3LrCTp2hZgTctx3tCSs45EB6W21iuY/wv6rpVhoF9FjRLzpcm/8PYtzSuApRf95/6AdIQnWxNlPsYbMm4rdFMRcUdmz0IfrnaaaIv9axnQCFekxo8720pmziolDZNRaxlyigchsmOY/bJ4AhWSp7vTe31aJcDPEk17K171itvUSynPMoyt/YhEl+A3yH2TJ7KXmzzGoAa3w3qz4KuALr85F+FVeQIDAQAB";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Verifying Token");

        const token = req.header('Authorization');
        if (!token) {
            res.status(401).send('Unauthorized | No Token');
            return;
        }
        // console.log("Token: " + token);
        // const decodedHeader: any = jwt.decode(token.split(' ')[1]);
        // console.log("Decoded Header: ", decodedHeader);
        // let publicKey = `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;

        // jwt.verify(token, key, { algorithms: ['RS256'] });4
        const response = await fetch(`${AUTH_VERIFY_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (!response.ok) {
            console.log("Invalid Token");  
            res.status(401).send('Unauthorized | Invalid Token');
            return;
        }
        const decoded = await response.json();
        let sub = decoded.sub;
        if (!req.session.user) {
            console.log("User not in session");

            let user = await prisma.user.findFirst({
                where: {
                    email: decoded.email
                }
            });
            if (user !== null) {
                console.log("User found in DB");
            }
            else {
                console.log("User not found in DB. Creating new user");
            }
            if (user === null) {
                user = await prisma.user.create({
                    data: {
                        id: sub,
                        email: decoded.email,
                        first_name: decoded.given_name,
                        last_name: decoded.family_name,
                        role_id: 2,
                        user_name: decoded.preferred_username
                    }
                }).catch(err => {
                    throw err;
                });
            }
            req.session.user = user;
        }
        else {
            console.log("User already in session");
        }

        /**
     * {
        "sub": "4b3c9e99-39e4-4de0-aa3c-bc2abf686e57",
        "email_verified": false,
        "name": "Salim Shamim",
        "preferred_username": "sshamim",
        "given_name": "Salim",
        "family_name": "Shamim",
        "email": "salim.shamim.94@gmail.com"
    }
    */
        next();
    }
    catch (err) {
        console.error(err);
        res.status(401).send('Unable to authenticate user');
    }
};