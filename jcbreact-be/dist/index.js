"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const keycloak_connect_1 = __importDefault(require("keycloak-connect"));
const express_session_1 = __importDefault(require("express-session"));
// const kcConfig:KeycloakConfig = {
//     clientId: 'jcbnode',
//     bearerOnly: true,
//     serverUrl: 'http://localhost:8080',
//     realm: 'jcbnoderealm',
//     realmPublicKey: 'IIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzH84R05FEobo3491uedpqeehmT4dbg602Kaf1jrxnZUAF5RKMuYQYl8YeOzul3L+llp58ijP5eiDewg1/eFp3x63wFR7AT6Ta1RwxOdSj/Xs9qWHTQLlaoWSrU3LrCTp2hZgTctx3tCSs45EB6W21iuY/wv6rpVhoF9FjRLzpcm/8PYtzSuApRf95/6AdIQnWxNlPsYbMm4rdFMRcUdmz0IfrnaaaIv9axnQCFekxo8720pmziolDZNRaxlyigchsmOY/bJ4AhWSp7vTe31aJcDPEk17K171itvUSynPMoyt/YhEl+A3yH2TJ7KXmzzGoAa3w3qz4KuALr85F+FVeQIDAQAB',
// };
//const app = express();
const memoryStore = new express_session_1.default.MemoryStore();
const keycloak = new keycloak_connect_1.default({ store: memoryStore });
//app.use(keycloak.middleware());
