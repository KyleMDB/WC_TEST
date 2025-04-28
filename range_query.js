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
  const dek5 = await keyVaultClient.findOne({ keyAltNames: "dataKey5" });

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
        {
          keyId: dek5._id,
          path: "billAmount",
          bsonType: "int",
	          queries: {
          queryType: "range"
        },
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
    const encryptedColl = encryptedClient.db(secretDB).collection(secretCollection);


    console.log("==================================================================================");
    console.log("Example2-1 : billAmount가 1000 이상인 환자 찾기");
    console.log("==================================================================================");
    const amountQuery = await encryptedColl.find({ billAmount: { $gt: 1000} }).toArray();

    amountQuery.sort((a, b) => b.billAmount - a.billAmount);

    console.log(`billAmount가 1000 이상인 환자 수: ${amountQuery.length}명`);
    console.log("환자 목록:");
    amountQuery.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}: $${patient.billAmount}`);
    });

    console.log("==================================================================================");
    console.log("Example2-2 : billAmount가 1000 이상 1200 이하 환자 찾기");
    console.log("==================================================================================");
    const findResult1 = await encryptedColl.findOne({ "billAmount": { $gt: 1000, $lt: 1200 }, });
    console.log(findResult1);

    console.log("==================================================================================");
    console.log("Example2-3 : Range + Equality");
    console.log("==================================================================================");
    console.log(
      await encryptedColl.findOne({
        "patientRecord.ssn": "987-65-4321",
        //"patientRecord.ssn": "432-10-9876",987-65-4321
        "billAmount": { $gt: 1000, $lt: 1200 }
      })
    );
    console.log("==================================================================================");
    console.log("Example2-4 : Range로 Map하고 Equality로 검색 ");
    console.log("==================================================================================");
    const findResult2= await encryptedColl.findOne({ "billAmount":  1500 , });
    console.log(findResult2);

  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    await unencryptedClient.close();
    await encryptedClient.close();
  }
}

readData().catch(console.dir);
