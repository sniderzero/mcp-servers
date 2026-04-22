import * as crypto from "crypto";

export interface LocalCert {
  key: string;
  cert: string;
}

/**
 * Generate a self-signed certificate for localhost.
 * Used by the OAuth callback server to satisfy Workday's HTTPS redirect requirement.
 * Pure Node.js — no external dependencies. Builds a minimal X.509 v3 cert in DER
 * with SAN entries for DNS:localhost and IP:127.0.0.1.
 */
export function generateSelfSignedCert(): LocalCert {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });

  const keyPem = privateKey.export({ type: "sec1", format: "pem" }) as string;
  const pubDer = publicKey.export({ type: "spki", format: "der" });

  const certDer = buildSelfSignedCertDer(privateKey, pubDer);
  const certPem =
    "-----BEGIN CERTIFICATE-----\n" +
    certDer.toString("base64").match(/.{1,64}/g)!.join("\n") +
    "\n-----END CERTIFICATE-----\n";

  return { key: keyPem, cert: certPem };
}

/**
 * Build a minimal self-signed X.509 v3 DER certificate.
 * Valid for localhost, 1 year expiry.
 */
function buildSelfSignedCertDer(
  privateKey: crypto.KeyObject,
  subjectPublicKeyDer: Buffer,
): Buffer {
  const now = new Date();
  const notBefore = formatAsn1Time(now);
  const notAfter = formatAsn1Time(new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));

  // Serial number (random 8 bytes, positive)
  const serial = crypto.randomBytes(8);
  serial[0] &= 0x7f;

  // Subject/Issuer: CN=localhost
  const cnOid = Buffer.from([0x55, 0x04, 0x03]); // 2.5.4.3
  const cnValue = derUtf8String("localhost");
  const cnAttr = derSequence(Buffer.concat([derOid(cnOid), cnValue]));
  const cnSet = derSet(cnAttr);
  const name = derSequence(cnSet);

  // Signature algorithm: ECDSA with SHA-256 (1.2.840.10045.4.3.2)
  const ecdsaSha256Oid = Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]);
  const sigAlg = derSequence(derOid(ecdsaSha256Oid));

  // TBS Certificate
  const version = derContextTag(0, derInteger(Buffer.from([0x02]))); // v3
  const serialNumber = derInteger(serial);
  const validity = derSequence(Buffer.concat([notBefore, notAfter]));
  const subjectPublicKeyInfo = Buffer.from(subjectPublicKeyDer);

  // Subject Alternative Name extension
  const sanExt = buildSanExtension();
  const extensions = derContextTag(3, derSequence(sanExt));

  const tbs = derSequence(
    Buffer.concat([
      version,
      serialNumber,
      sigAlg,
      name, // issuer
      validity,
      name, // subject
      subjectPublicKeyInfo,
      extensions,
    ]),
  );

  // Sign the TBS
  const signer = crypto.createSign("SHA256");
  signer.update(tbs);
  const signature = signer.sign(privateKey);

  const sigBitString = derBitString(signature);

  return derSequence(Buffer.concat([tbs, sigAlg, sigBitString]));
}

function buildSanExtension(): Buffer {
  // OID 2.5.29.17 (subjectAltName)
  const sanOid = Buffer.from([0x55, 0x1d, 0x11]);

  // DNS:localhost
  const dnsName = Buffer.from("localhost", "ascii");
  const dnsEntry = Buffer.concat([Buffer.from([0x82, dnsName.length]), dnsName]);

  // IP:127.0.0.1
  const ipBytes = Buffer.from([127, 0, 0, 1]);
  const ipEntry = Buffer.concat([Buffer.from([0x87, ipBytes.length]), ipBytes]);

  const sanValue = derSequence(Buffer.concat([dnsEntry, ipEntry]));
  const sanOctetString = derOctetString(sanValue);

  return derSequence(Buffer.concat([derOid(sanOid), sanOctetString]));
}

// ── ASN.1 DER encoding helpers ─────────────────────────────────────────────

function derLength(len: number): Buffer {
  if (len < 0x80) return Buffer.from([len]);
  if (len < 0x100) return Buffer.from([0x81, len]);
  return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function derWrap(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}

function derSequence(content: Buffer): Buffer {
  return derWrap(0x30, content);
}

function derSet(content: Buffer): Buffer {
  return derWrap(0x31, content);
}

function derInteger(value: Buffer): Buffer {
  const padded = value[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), value]) : value;
  return derWrap(0x02, padded);
}

function derOid(oidBytes: Buffer): Buffer {
  return derWrap(0x06, oidBytes);
}

function derUtf8String(str: string): Buffer {
  return derWrap(0x0c, Buffer.from(str, "utf-8"));
}

function derBitString(content: Buffer): Buffer {
  return derWrap(0x03, Buffer.concat([Buffer.from([0x00]), content]));
}

function derOctetString(content: Buffer): Buffer {
  return derWrap(0x04, content);
}

function derContextTag(tag: number, content: Buffer): Buffer {
  return derWrap(0xa0 | tag, content);
}

function formatAsn1Time(date: Date): Buffer {
  const year = date.getUTCFullYear();
  const parts = [
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
    "Z",
  ];

  if (year < 2050) {
    // UTCTime: YYMMDDHHMMSSZ
    const str = String(year % 100).padStart(2, "0") + parts.join("");
    return derWrap(0x17, Buffer.from(str, "ascii"));
  }

  // GeneralizedTime: YYYYMMDDHHMMSSZ
  const str = String(year) + parts.join("");
  return derWrap(0x18, Buffer.from(str, "ascii"));
}
