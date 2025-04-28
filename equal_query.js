const { MongoClient } = require("mongodb");
const { getCredentials } = require("./credentials");

const credentials = getCredentials();

const eDB = "Never_Delete_KeyVault";
const eKV = "__keyVault";
const keyVaultNamespace = `${eDB}.${eKV}`;

const kmsProviders = {
  aws: {
    accessKeyId: credentials["AWS_ACCESS_KEY_ID"],
    secretAccessKey: credentials["AWS_SECRET_ACCESS_KEY"],
  },
};

async function readData() {
  const uri = credentials.MONGODB_URI;
  const unencryptedClient = new MongoClient(uri);
  await unencryptedClient.connect();
  const keyVaultClient = unencryptedClient.db(eDB).collection(eKV);

  const dek1 = await keyVaultClient.findOne({ keyAltNames: "dataKey1" });
  const dek2 = await keyVaultClient.findOne({ keyAltNames: "dataKey2" });
  const dek3 = await keyVaultClient.findOne({ keyAltNames: "dataKey3" });
  const dek4 = await keyVaultClient.findOne({ keyAltNames: "dataKey4" });

  const secretDB = "medicalRecords";
  const secretCollection = "patients";

  const encryptedFieldsMap = {
    [`${secretDB}.${secretCollection}`]: {
      fields: [
        {
          keyId: dek1._id,
          path: "patientId",
          bsonType: "int",
          queries: { queryType: "equality" },
        },
        {
          keyId: dek2._id,
          path: "medications",
          bsonType: "array",
        },
        {
          keyId: dek3._id,
          path: "patientRecord.ssn",
          bsonType: "string",
          queries: { queryType: "equality" },
        },
        {
          keyId: dek4._id,
          path: "patientRecord.billing",
          bsonType: "object",
        },
      ],
    },
  };

  const extraOptions = {
    cryptSharedLibPath: credentials["SHARED_LIB_PATH"],
  };

  const encryptedClient = new MongoClient(uri, {
    autoEncryption: {
      keyVaultNamespace: keyVaultNamespace,
      kmsProviders: kmsProviders,
      extraOptions: extraOptions,
      encryptedFieldsMap: encryptedFieldsMap,
    },
  });
  await encryptedClient.connect();

  try {
    const unencryptedColl = unencryptedClient.db(secretDB).collection(secretCollection);
    const encryptedColl = encryptedClient.db(secretDB).collection(secretCollection);

    console.log("==================================================================================");
    console.log("Example1-1 : Finding a document with regular (non-encrypted) client.");
    console.log("==================================================================================");
    console.log(await unencryptedColl.findOne({ firstName: /철수/ }));

    console.log("==================================================================================");
    console.log("Example1-2 : Finding a document with encrypted client, searching on an encrypted field");
    console.log("==================================================================================");
    console.log(await encryptedColl.findOne({ "patientRecord.ssn": "987-65-4320" }));
  } finally {
    await unencryptedClient.close();
    await encryptedClient.close();
  }
}

readData().catch(console.dir);
