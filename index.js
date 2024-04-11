const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    try {
        // First, get the connection to check if there's a gameId associated with it
        const getResult = await dynamoDb.get({
            TableName: tableName,
            Key: { connectionId: connectionId }
        }).promise();

        const connectionItem = getResult.Item;

        if (connectionItem && connectionItem.gameId) {
            // If there's a gameId, invoke the leaveGame function
            console.log(`Connection ${connectionId} has gameId ${connectionItem.gameId}, invoking leaveGame function.`);
            
            await lambda.invoke({
                FunctionName: 'poker-page-leaveGame',
                InvocationType: 'Event', // Use 'Event' to invoke the function asynchronously
                Payload: JSON.stringify({
                    gameId: connectionItem.gameId,
                    playerId: connectionItem.playerId
                })
            }).promise();

            console.log(`leaveGame invoked for gameId ${connectionItem.gameId} and playerId ${connectionItem.playerId}.`);
        }

        // Attempt to delete the connection
        const deleteResult = await dynamoDb.delete({
            TableName: tableName,
            Key: { connectionId: connectionId },
            ReturnValues: 'ALL_OLD' // Returns the item content before it was deleted
        }).promise();

        // Check if an item was actually deleted
        if (deleteResult.Attributes) {
            console.log(`Connection ${connectionId} disconnected successfully.`);
            return { statusCode: 200, body: 'Disconnected.' };
        } else {
            console.log(`Connection ${connectionId} not found.`);
            return { statusCode: 404, body: 'Connection not found.' };
        }
    } catch (err) {
        console.error('Error removing connection:', err);
        return { statusCode: 500, body: 'Failed to disconnect' };
    }
};