// lambda_function.js
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  const gameID = event.requestContext.gameID;

  try {
    await dynamoDb.delete({ TableName: tableName, Key: { gameID: gameID } }).promise();
    return { statusCode: 200, body: 'Disconnected.' };
  } catch (err) {
    console.error('Error removing connection:', err);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
