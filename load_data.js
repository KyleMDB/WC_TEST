const { MongoClient, Binary } = require("mongodb");
const { getCredentials } = require("./credentials");
credentials = getCredentials();

// start-key-vault
const eDB = "Never_Delete_KeyVault";
const eKV = "__keyVault";
const keyVaultNamespace = `${eDB}.${eKV}`;
// end-key-vault

// start-kmsproviders
const kmsProviders = {
  aws: {
    accessKeyId: credentials["AWS_ACCESS_KEY_ID"],
    secretAccessKey: credentials["AWS_SECRET_ACCESS_KEY"],
  },
};
// end-kmsproviders

async function run() {
  // start-schema
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
          queries: { queryType: "range" },
        },
      ],
    },
  };
  // end-schema

  // start-extra-options
  const extraOptions = {
    cryptSharedLibPath: credentials["SHARED_LIB_PATH"],
  };
  // end-extra-options

  // start-client
  const encryptedClient = new MongoClient(uri, {
    autoEncryption: {
      keyVaultNamespace: keyVaultNamespace,
      kmsProviders: kmsProviders,
      extraOptions: extraOptions,
      encryptedFieldsMap: encryptedFieldsMap,
    },
  });
  await encryptedClient.connect();
  // end-client

  try {
    const unencryptedColl = unencryptedClient
      .db(secretDB)
      .collection(secretCollection);

    // start-insert
    const encryptedColl = encryptedClient
      .db(secretDB)
      .collection(secretCollection);

    // 10개의 환자 데이터 배열 생성 
    const patientData = [
      { firstName: "철수", lastName: "김", patientId: 12345678, address: "서울특별시 강남구 테헤란로 123", patientRecord: { ssn: "987-65-4320", billing: { type: "Visa", number: "4111111111111111" } }, medications: ["아토르바스타틴", "레보티록신"], billAmount: 1000 },
      { firstName: "영희", lastName: "박", patientId: 23456789, address: "서울특별시 마포구 홍대입구 45", patientRecord: { ssn: "876-54-3210", billing: { type: "Mastercard", number: "5555555555554444" } }, medications: ["리시노프릴", "메트포르민"], billAmount: 1200 },
      { firstName: "민수", lastName: "이", patientId: 34567890, address: "부산광역시 해운대구 해변로 78", patientRecord: { ssn: "765-43-2109", billing: { type: "Amex", number: "378282246310005" } }, medications: ["암로디핀", "알부테롤"], billAmount: 800 },
      { firstName: "지수", lastName: "최", patientId: 45678901, address: "대구광역시 수성구 범어로 56", patientRecord: { ssn: "654-32-1098", billing: { type: "Visa", number: "4012888888881881" } }, medications: ["메토프롤롤", "가바펜틴"], billAmount: 1500 },
      { firstName: "정우", lastName: "장", patientId: 56789012, address: "광주광역시 서구 상무대로 23", patientRecord: { ssn: "543-21-0987", billing: { type: "Discover", number: "6011111111111117" } }, medications: ["오메프라졸", "로사르탄"], billAmount: 950 },
      { firstName: "서연", lastName: "윤", patientId: 67890123, address: "인천광역시 남동구 구월로 78", patientRecord: { ssn: "432-10-9876", billing: { type: "Mastercard", number: "5105105105105100" } }, medications: ["하이드로클로로티아지드", "심바스타틴"], billAmount: 1100 },
      { firstName: "도윤", lastName: "송", patientId: 90123456, address: "경기도 성남시 분당구 판교로 82", patientRecord: { ssn: "321-98-7654", billing: { type: "Visa", number: "4532456789012345" } }, medications: ["에스시탈로프람", "둘록세틴"], billAmount: 900 },
      { firstName: "지윤", lastName: "한", patientId: 10123457, address: "전라북도 전주시 완산구 백제대로 64", patientRecord: { ssn: "210-87-6543", billing: { type: "Amex", number: "349876543210987" } }, medications: ["부프로피온", "벤라팍신"], billAmount: 1400 },
      { firstName: "하준", lastName: "배", patientId: 11123458, address: "강원도 춘천시 중앙로 100", patientRecord: { ssn: "123-45-6789", billing: { type: "Visa", number: "4000123456789010" } }, medications: ["클로피도그렐", "로바스타틴"], billAmount: 1300 },
      { firstName: "은서", lastName: "강", patientId: 12123459, address: "제주특별자치도 제주시 일주서로 200", patientRecord: { ssn: "987-65-4321", billing: { type: "Mastercard", number: "5200123456789012" } }, medications: ["텔미사르탄", "아스피린"], billAmount: 1100 }
    ];

    const result = await encryptedColl.insertMany(patientData);
    console.log(`${result.insertedCount}개의 문서가 성공적으로 삽입되었습니다.`);
  } finally {
    await unencryptedClient.close();
    await encryptedClient.close();
  }
}

run().catch(console.dir);
