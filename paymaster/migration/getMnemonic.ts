import * as AWS from "@aws-sdk/client-kms";

const kms = new AWS.KMS({
  region: process.env.AWS_REGION,
});

export async function getMnemonic(): Promise<string> {
  if (process.env.MNEMONIC) {
    return Promise.resolve(process.env.MNEMONIC);
  } else if (process.env.ENCRYPTED_MNEMONIC) {
    return Promise.resolve(
      await decryptMnemonic(
        process.env.ENCRYPTED_MNEMONIC!,
        process.env.KMS_KEY_ID!
      )
    );
  }
  return Promise.reject("No mnemonic found");
}

async function decryptMnemonic(
  encryptedMnemonic: string,
  keyId: string
): Promise<string> {
  const params: AWS.DecryptRequest = {
    CiphertextBlob: Buffer.from(encryptedMnemonic, "base64"),
    KeyId: keyId,
  };
  const response = await kms.decrypt(params);
  return Buffer.from(response.Plaintext!).toString("utf8");
}
