import { saveCredential } from './secureStore';

// chrome typings may not be available in Node environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

export interface CredentialRecord {
  id: string;
  credential: string;
}

export async function importFromCSV(masterPassword: string, csv: string): Promise<void> {
  const lines = csv.trim().split(/\r?\n/);
  for (const line of lines) {
    const [id, credential] = line.split(',');
    if (id && credential) {
      await saveCredential(masterPassword, id.trim(), credential.trim());
    }
  }
}

export async function importFromJSON(masterPassword: string, jsonData: string): Promise<void> {
  const records: CredentialRecord[] = JSON.parse(jsonData);
  for (const record of records) {
    if (record.id && record.credential) {
      await saveCredential(masterPassword, record.id, record.credential);
    }
  }
}

export async function exportEncrypted(): Promise<string> {
  const all = await chrome.storage.local.get(null);
  return JSON.stringify(all);
}
