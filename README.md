# Node.js Queryable Encryption Tutorial

- This project demonstrates an example implementation of Queryable Encryption for the MongoDB Node.js driver, including examples of Equality and Range queries.
- This content has been modified and enhanced to enable Range Queries based on the following:
[MongoDB University - Queryable Encryption Examples](https://github.com/mongodb-university/docs-in-use-encryption-examples/tree/main/queryable-encryption) 
- To learn more about Queryable Encryption, see the [[Queryable Encryption section]](https://www.mongodb.com/docs/manual/core/queryable-encryption/) in the Server manual.

## Install Dependencies

To run this sample application, you first need to install the following
dependencies:

- MongoDB Server version 8.0 or later
- Automatic Encryption Shared Library version 8.0 or later
- Node.js
- npm

Sample command
```
sudo apt-get install
sudo apt update
sudo apt install nodejs
sudo apt install npm
wget https://downloads.mongodb.com/linux/mongo_crypt_shared_v1-linux-x86_64-enterprise-ubuntu2404-8.0.5.tgz
tar -xvf *tgz
```
## Configure Your Environment
- Clone Git
```
git clone https://github.com/KyleLeeKorea/QE_DEMO 
```

- Please edit the contents of the credential.js according to each respective value.
```
  // Mongo Paths + URI
  MONGODB_URI: "<your MongoDB URI here>",
  SHARED_LIB_PATH: "<path to crypt_shared library>",

  // AWS Credentials
  AWS_ACCESS_KEY_ID: "<your AWS access key ID here>",
  AWS_SECRET_ACCESS_KEY: "<your AWS secret access key here>",
  AWS_KEY_REGION: "<your AWS key region>",
  AWS_KEY_ARN: "<your AWS key ARN>",
```
## Run the App

1. In a shell, navigate to the project root directory(QE_DEMO).

1. Run as below
```
node make_data_key.js
node load_data.js
node equal_query.js
node range_query.js
```
