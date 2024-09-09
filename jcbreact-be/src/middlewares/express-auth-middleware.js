"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
var db_1 = require("../lib/db");
//import jwt from "jsonwebtoken";
var AUTH_VERIFY_URL = process.env.AUTH_VERIFY_URL;
//const key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzH84R05FEobo3491uedpqeehmT4dbg602Kaf1jrxnZUAF5RKMuYQYl8YeOzul3L+llp58ijP5eiDewg1/eFp3x63wFR7AT6Ta1RwxOdSj/Xs9qWHTQLlaoWSrU3LrCTp2hZgTctx3tCSs45EB6W21iuY/wv6rpVhoF9FjRLzpcm/8PYtzSuApRf95/6AdIQnWxNlPsYbMm4rdFMRcUdmz0IfrnaaaIv9axnQCFekxo8720pmziolDZNRaxlyigchsmOY/bJ4AhWSp7vTe31aJcDPEk17K171itvUSynPMoyt/YhEl+A3yH2TJ7KXmzzGoAa3w3qz4KuALr85F+FVeQIDAQAB";
var verifyToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, response, decoded, sub, user, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                console.log("Verifying Token");
                token = req.header('Authorization');
                if (!token) {
                    res.status(401).send('Unauthorized | No Token');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, fetch("".concat(AUTH_VERIFY_URL), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        }
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    console.log("Invalid Token");
                    res.status(401).send('Unauthorized | Invalid Token');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, response.json()];
            case 2:
                decoded = _a.sent();
                sub = decoded.sub;
                if (!!req.session.user) return [3 /*break*/, 6];
                console.log("User not in session");
                return [4 /*yield*/, db_1.default.user.findFirst({
                        where: {
                            email: decoded.email
                        }
                    })];
            case 3:
                user = _a.sent();
                if (user !== null) {
                    console.log("User found in DB");
                }
                else {
                    console.log("User not found in DB. Creating new user");
                }
                if (!(user === null)) return [3 /*break*/, 5];
                return [4 /*yield*/, db_1.default.user.create({
                        data: {
                            id: sub,
                            email: decoded.email,
                            first_name: decoded.given_name,
                            last_name: decoded.family_name,
                            role_id: 2,
                            user_name: decoded.preferred_username
                        }
                    }).catch(function (err) {
                        throw err;
                    })];
            case 4:
                user = _a.sent();
                _a.label = 5;
            case 5:
                req.session.user = user;
                return [3 /*break*/, 7];
            case 6:
                console.log("User already in session");
                _a.label = 7;
            case 7:
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
                return [3 /*break*/, 9];
            case 8:
                err_1 = _a.sent();
                console.error(err_1);
                res.status(401).send('Unable to authenticate user');
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.verifyToken = verifyToken;
