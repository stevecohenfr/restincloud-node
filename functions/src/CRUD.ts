import * as admin from "firebase-admin";
const db = admin.firestore();

export async function getValue(gameUid: string, key: string): Promise<any> {
    const snap = await db.doc(`game-data/${gameUid}`).get();
    return snap.exists ? snap.data()?.[key] : null;
}

export async function setValue(gameUid: string, key: string, value: any): Promise<void> {
    await db.doc(`game-data/${gameUid}`).set({ [key]: value }, { merge: true });
}

export async function updateValue(gameUid: string, key: string, value: any): Promise<void> {
    await db.doc(`game-data/${gameUid}`).update({ [key]: value });
}

export async function deleteValue(gameUid: string, key: string): Promise<void> {
    await db.doc(`game-data/${gameUid}`).update({ [key]: admin.firestore.FieldValue.delete() });
}
