import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp({
    credential: admin.credential.cert(require("../service-account.json"))
});
import * as jwt from "jsonwebtoken";
import { getValue, setValue, updateValue, deleteValue } from "./CRUD";
import * as dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
const secretKey = Buffer.from(process.env.SECRET_KEY!, "utf-8"); // 32 bytes
const IV_LENGTH = 16; // pour AES-CBC

import * as corsModule from "cors";

const cors = corsModule({
    origin: '*'
});

function withCors(handler: (req: functions.Request, res: functions.Response) => void) {
    return functions.https.onRequest((req, res) => {
        cors(req, res, () => handler(req, res));
    });
}

function decryptData(ciphertextBase64: string): string {
    const data = Buffer.from(ciphertextBase64, "base64");

    const iv = data.slice(0, IV_LENGTH);
    const encryptedText = data.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);
    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const db = admin.firestore();

function verifyAuthorizationHeader(req: functions.Request): string | null {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    return authHeader.substring(7);
}

async function verifyTokenAndGetData(req: functions.Request): Promise<any> {
    const token = verifyAuthorizationHeader(req);
    if (!token) throw new Error("Unauthorized");

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

        // Vérifier dans Firestore que ce token est toujours valide (non révoqué)
        const tokenDoc = await db
            .collection("developers")
            .doc(decoded.developerUid)
            .collection("token")
            .doc(decoded.tokenId)
            .get();

        if (!tokenDoc.exists || tokenDoc.data()?.revoked) {
            throw new Error("Token revoked or does not exist");
        }

        return decoded;
    } catch (err) {
        console.error("Invalid token or revoked", err);
        throw new Error("Unauthorized");
    }
}

export const generateDeveloperToken = functions.https.onRequest(async (req, res) => {
    try {
        const adminSecret = req.headers['x-admin-secret'];
        if (adminSecret !== process.env.ADMIN_SECRET) {
            res.status(403).send("Forbidden");
            return;
        }

        const { gameUid, developerUid } = req.body;
        if (!gameUid || !developerUid) {
            res.status(400).send("Missing gameUid or developerUid");
            return;
        }

        // Vérifier que le jeu existe
        const gameSnap = await db.doc(`games/${gameUid}`).get();
        if (!gameSnap.exists) {
            res.status(404).send("Game not found");
            return;
        }
        const gameName = gameSnap.data()?.name || "Unknown";

        // Générer un tokenId unique
        const tokenId = uuidv4();

        // Générer un JWT avec claims, ajouter tokenId si besoin
        const tokenPayload = { developerUid, gameUid, tokenId };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!);

        // Stocker le token dans Firestore sous developers/{developerUid}/token/{tokenId}
        await db.collection("developers")
            .doc(developerUid)
            .collection("token")
            .doc(tokenId)
            .set({
                token,
                gameUid,
                gameName,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                revoked: false,
            });
        res.send({ token, tokenId });
    } catch (err) {
        console.error("Error generating token", err);
        res.status(500).send("Internal Server Error");
    }
});

export const verifyToken = withCors(async (req, res) => {
    try {
        const data = await verifyTokenAndGetData(req);
        res.send({ valid: true, data });
    } catch {
        res.status(401).send("Invalid token");
    }
});

export const get = withCors(async (req, res) => {
    try {
        const data = await verifyTokenAndGetData(req);
        const cryptedData = req.body;

        if (!cryptedData) {
            res.status(400).send("Missing key");
            return;
        }

        const decryptedData = decryptData(cryptedData);
        const obj = JSON.parse(decryptedData);
        const value = await getValue(data.gameUid, obj.key);
        res.send({ value });
    } catch (err) {
        console.error("Error in get", err);
        res.status(401).send("Unauthorized");
    }
});

export const set = withCors(async (req, res) => {
    try {
        const data = await verifyTokenAndGetData(req);
        const cryptedData = req.body;

        if (!cryptedData) {
            res.status(400).send("Missing data");
            return;
        }

        const decryptedData = decryptData(cryptedData);
        const obj = JSON.parse(decryptedData);

        await setValue(data.gameUid, obj.key, obj.value);
        res.send({ success: true });
    } catch (err) {
        console.error("Error in set", err);
        res.status(401).send("Unauthorized");
    }
});

export const update = withCors(async (req, res) => {
    try {
        const data = await verifyTokenAndGetData(req);
        const cryptedData = req.body;

        if (!cryptedData) {
            res.status(400).send("Missing data");
            return;
        }

        const decryptedData = decryptData(cryptedData);
        const obj = JSON.parse(decryptedData);

        await updateValue(data.gameUid, obj.key, obj.value);
        res.send({ success: true });
    } catch (err) {
        console.error("Error in update", err);
        res.status(401).send("Unauthorized");
    }
});

export const remove = withCors(async (req, res) => {
    try {
        const data = await verifyTokenAndGetData(req);
        const cryptedData = req.body;

        if (!cryptedData) {
            res.status(400).send("Missing key");
            return;
        }

        const decryptedData = decryptData(cryptedData);
        const obj = JSON.parse(decryptedData);

        await deleteValue(data.gameUid, obj.key);
        res.send({ success: true });
    } catch (err) {
        console.error("Error in delete", err);
        res.status(401).send("Unauthorized");
    }
});
