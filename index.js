const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    try {

        const connectionData = await dynamoDb.get({
            TableName: tableName,
            Key: { connectionId },
        }).promise();

        const playerData = connectionData.Item;
        if (!playerData) {
            console.log("No player found for connection ${connectionId}");
            return {statusCode: 404, body: "Player not found"};
        }
        const game = playerData.gameId;
        if (game) {
            const leaveGamePayload = {
                gameId: game, 
                playerId: playerData.playerId,
            };

            await lambda.invoke({
                FunctionName: 'poker-game-leaveGame',
                InvocationType: 'Event',
                Payload: JSON.stringify(leaveGamePayload),
            }).promise();
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
